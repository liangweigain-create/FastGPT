import type { NextApiRequest, NextApiResponse } from 'next';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { jsonRes } from '@fastgpt/service/common/response';
import {
  UpdateDatasetCollaboratorBodySchema,
  type UpdateDatasetCollaboratorBody
} from '@fastgpt/global/openapi/core/dataset/collaborator';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { datasetId, collaborators } = UpdateDatasetCollaboratorBodySchema.parse(req.body);

  // Auth: check valid dataset and permission
  const { teamId } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ManagePermissionVal
  });

  // Get existing collaborators
  const existingPerms = await MongoResourcePermission.find({
    resourceType: PerResourceTypeEnum.dataset,
    resourceId: datasetId,
    teamId
  }).lean();

  // Build sets of new collaborator IDs
  const newTmbIds = new Set(collaborators.filter((c) => c.tmbId).map((c) => c.tmbId));
  const newGroupIds = new Set(collaborators.filter((c) => c.groupId).map((c) => c.groupId));
  const newOrgIds = new Set(collaborators.filter((c) => c.orgId).map((c) => c.orgId));

  // Delete collaborators not in the new list
  const toDelete = existingPerms.filter((p) => {
    if (p.tmbId && !newTmbIds.has(String(p.tmbId))) return true;
    if (p.groupId && !newGroupIds.has(String(p.groupId))) return true;
    if (p.orgId && !newOrgIds.has(String(p.orgId))) return true;
    return false;
  });

  for (const perm of toDelete) {
    await MongoResourcePermission.deleteOne({ _id: perm._id });
  }

  // Upsert permissions for each collaborator in the new list
  for (const clb of collaborators) {
    const query: any = {
      resourceType: PerResourceTypeEnum.dataset,
      resourceId: datasetId,
      teamId
    };

    if (clb.tmbId) query.tmbId = clb.tmbId;
    if (clb.groupId) query.groupId = clb.groupId;
    if (clb.orgId) query.orgId = clb.orgId;

    await MongoResourcePermission.updateOne(
      query,
      {
        $set: {
          permission: clb.permission
        }
      },
      { upsert: true }
    );
  }

  jsonRes(res, { code: 200, data: { success: true, deleted: toDelete.length } });
}

export default NextAPI(handler);
