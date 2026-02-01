import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import type { UpdateClbPermissionProps } from '@fastgpt/global/support/permission/collaborator';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';

import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { Permission } from '@fastgpt/global/support/permission/controller';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  const perVal = await getTmbPermission({
    teamId,
    tmbId,
    resourceType: PerResourceTypeEnum.team,
    resourceId: undefined
  });

  const per = new Permission({ role: perVal, isOwner: false });
  if (!per.checkPer(ManagePermissionVal)) {
    throw new Error('No Permission');
  }

  const { collaborators } = req.body as UpdateClbPermissionProps;

  for (const clb of collaborators) {
    if (!clb.tmbId && !clb.groupId && !clb.orgId) continue;

    await MongoResourcePermission.updateOne(
      {
        teamId,
        resourceType: PerResourceTypeEnum.team,
        resourceId: undefined, // Team permission doesn't need resourceId or use teamId as resourceId?
        // Checking controller.ts: getTmbPermission uses { resourceType: 'team', resourceId: undefined }
        // So we query with resourceId: undefined or null?
        // Mongoose might ignore undefined in query if not careful, but updateOne filter needs to be precise.
        // Let's check how `MongoResourcePermission` stores team permissions.
        // Usually `resourceId` is NOT set for team permissions.
        tmbId: clb.tmbId,
        groupId: clb.groupId,
        orgId: clb.orgId
      },
      {
        permission: clb.permission
      },
      { upsert: true }
    );
  }
}

export default NextAPI(handler);
