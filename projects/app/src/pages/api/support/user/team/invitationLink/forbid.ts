import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // Check if user is owner or admin
  const tmb = await MongoTeamMember.findById(tmbId).lean();
  if (!tmb || (tmb.role !== TeamMemberRoleEnum.owner && tmb.role !== TeamMemberRoleEnum.admin)) {
    throw new Error('No Permission');
  }

  const { linkId } = req.body as { linkId: string };

  await MongoInvitationLink.findOneAndUpdate({ linkId, teamId }, { forbidden: true });
}

export default NextAPI(handler);
