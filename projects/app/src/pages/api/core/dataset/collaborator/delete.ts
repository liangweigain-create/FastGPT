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
  DeleteDatasetCollaboratorQuerySchema,
  type DeleteDatasetCollaboratorQuery
} from '@fastgpt/global/openapi/core/dataset/collaborator';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  // DELETE request parameters are typically in query
  const { datasetId, tmbId, groupId, orgId } = DeleteDatasetCollaboratorQuerySchema.parse(
    req.query
  );

  if (!tmbId && !groupId && !orgId) {
    throw new Error('tmbId, groupId or orgId is required');
  }

  // Auth: check valid dataset and permission
  const { teamId } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ManagePermissionVal
  });

  // Build delete query
  const deleteQuery: any = {
    resourceType: PerResourceTypeEnum.dataset,
    resourceId: datasetId,
    teamId
  };

  if (tmbId) deleteQuery.tmbId = tmbId;
  if (groupId) deleteQuery.groupId = groupId;
  if (orgId) deleteQuery.orgId = orgId;

  // Delete permission
  const result = await MongoResourcePermission.deleteOne(deleteQuery);

  jsonRes(res, { code: 200, data: { success: true, deletedCount: result.deletedCount } });
}

export default NextAPI(handler);
