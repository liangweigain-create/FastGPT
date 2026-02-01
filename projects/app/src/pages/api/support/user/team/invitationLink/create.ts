import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { InvitationLinkCreateType } from '@fastgpt/service/support/user/team/invitationLink/type';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { nanoid } from 'nanoid';
import { addDays } from 'date-fns';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // Check if user is owner or admin
  const tmb = await MongoTeamMember.findById(tmbId).lean();
  if (!tmb || (tmb.role !== TeamMemberRoleEnum.owner && tmb.role !== TeamMemberRoleEnum.admin)) {
    throw new Error('No Permission');
  }

  const { description, expires, usedTimesLimit } = req.body as InvitationLinkCreateType;

  // Calculate expiration date
  const expireDate = (() => {
    if (expires === '30m') return new Date(Date.now() + 30 * 60 * 1000);
    if (expires === '7d') return addDays(new Date(), 7);
    if (expires === '1y') return addDays(new Date(), 365);
    return addDays(new Date(), 7);
  })();

  const linkId = nanoid(24);

  await MongoInvitationLink.create({
    linkId,
    teamId,
    usedTimesLimit: usedTimesLimit === -1 ? -1 : usedTimesLimit,
    expires: expireDate,
    description
  });

  return linkId;
}

export default NextAPI(handler);
