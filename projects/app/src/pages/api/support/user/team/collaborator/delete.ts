import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamManagePermissionVal } from '@fastgpt/global/support/permission/user/constant';

import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { Permission } from '@fastgpt/global/support/permission/controller';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // Check if team owner or admin
  const tmb = await MongoTeamMember.findById(tmbId).lean();
  if (tmb?.role === 'owner' || tmb?.role === 'admin') {
    // Pass
  } else {
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
  }

  const {
    tmbId: targetTmbId,
    groupId,
    orgId
  } = req.query as {
    tmbId?: string;
    groupId?: string;
    orgId?: string;
  };

  if (!targetTmbId && !groupId && !orgId) throw new Error('Missing ID');

  await MongoResourcePermission.deleteOne({
    teamId,
    resourceType: PerResourceTypeEnum.team,
    tmbId: targetTmbId,
    groupId,
    orgId
  });
}

export default NextAPI(handler);
