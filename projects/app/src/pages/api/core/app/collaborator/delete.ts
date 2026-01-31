import type { NextApiRequest, NextApiResponse } from 'next';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  ManagePermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import type { AppCollaboratorDeleteParams } from '@fastgpt/global/core/app/collaborator';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { appId, tmbId } = req.query as AppCollaboratorDeleteParams;

  if (!appId || !tmbId) {
    throw new Error('appId and tmbId are required');
  }

  // Auth
  const { teamId } = await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  // Delete permission
  await MongoResourcePermission.deleteOne({
    teamId,
    resourceType: PerResourceTypeEnum.app,
    resourceId: appId,
    tmbId
  });
}

export default NextAPI(handler);
