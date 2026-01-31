import type { NextApiRequest, NextApiResponse } from 'next';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  ManagePermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import type { UpdateAppCollaboratorBody } from '@fastgpt/global/core/app/collaborator';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { appId, collaborators } = req.body as UpdateAppCollaboratorBody;

  if (!appId || !collaborators) {
    throw new Error('appId and collaborators are required');
  }

  // Auth
  const { teamId } = await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  // Update permissions
  for (const item of collaborators) {
    if (item.tmbId && item.permission) {
      await MongoResourcePermission.updateOne(
        {
          teamId,
          resourceType: PerResourceTypeEnum.app,
          resourceId: appId,
          tmbId: item.tmbId
        },
        {
          permission: item.permission
        },
        {
          upsert: true
        }
      );
    }
  }
}

export default NextAPI(handler);
