import type { NextApiRequest, NextApiResponse } from 'next';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  PerResourceTypeEnum,
  ReadPermissionVal
} from '@fastgpt/global/support/permission/constant';
import { getClbsInfo } from '@fastgpt/service/support/permission/controller';
import { NextAPI } from '@/service/middleware/entry';
import { GetDatasetCollaboratorListQuerySchema } from '@fastgpt/global/openapi/core/dataset/collaborator';
import type { CollaboratorListType } from '@fastgpt/global/support/permission/collaborator';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<CollaboratorListType> {
  const { datasetId } = GetDatasetCollaboratorListQuerySchema.parse(req.query);

  // Auth: check valid dataset and permission
  const { teamId } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ReadPermissionVal
  });

  // Get all permission records
  const permissions = await MongoResourcePermission.find({
    resourceType: PerResourceTypeEnum.dataset,
    resourceId: datasetId,
    teamId
  }).lean();

  const clbs = await getClbsInfo({
    clbs: permissions,
    teamId
  });

  return {
    clbs,
    parentClbs: []
  };
}

export default NextAPI(handler);
