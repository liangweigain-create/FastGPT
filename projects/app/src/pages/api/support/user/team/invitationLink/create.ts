import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { InvitationLinkCreateType } from '@fastgpt/service/support/user/team/invitationLink/type';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { nanoid } from 'nanoid';
import { addDays } from 'date-fns';

import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  const tmb = await MongoTeamMember.findById(tmbId).lean();
  // [Privatization] 逐步取消角色校验，用granular权限替代

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

  const {
    description,
    expires,
    usedTimesLimit = -1,
    role = TeamMemberRoleEnum.member
  } = req.body as InvitationLinkCreateType;

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
    tmbId,
    role,
    usedTimesLimit: usedTimesLimit === -1 ? -1 : usedTimesLimit,
    expires: expireDate,
    description
  });

  return linkId;
}

export default NextAPI(handler);
