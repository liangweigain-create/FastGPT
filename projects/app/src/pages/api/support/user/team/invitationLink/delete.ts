import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  const tmb = await MongoTeamMember.findById(tmbId).lean();
  if (!tmb) {
    throw new Error('Member not found');
  }

  const perVal = await getTmbPermission({
    teamId,
    tmbId,
    resourceType: PerResourceTypeEnum.team,
    resourceId: undefined
  });
  const permission = new TeamPermission({
    role: perVal,
    isOwner: tmb.role === TeamMemberRoleEnum.owner
  });

  if (!permission.hasInvitationManagePer) {
    throw new Error('No Permission');
  }

  const { _id } = req.query as { _id: string };

  await MongoInvitationLink.findOneAndDelete({ _id, teamId });
}

export default NextAPI(handler);
