import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { TeamSchema } from '@fastgpt/global/support/user/team/type.d';
import type { TeamTmbItemType } from '@fastgpt/global/support/user/team/type.d';
import { TeamDefaultRoleVal } from '@fastgpt/global/support/permission/user/constant';
import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

async function handler(req: ApiRequestProps<any>) {
  const { userId } = await authCert({ req, authToken: true });
  const { status } = req.query;

  const match = {
    userId,
    ...(status ? { status } : { status: { $ne: TeamMemberStatusEnum.leave } })
  };

  const members = await MongoTeamMember.find(match).populate<{ team: TeamSchema }>('team').lean();

  const list: TeamTmbItemType[] = await Promise.all(
    members.map(async (tmb) => {
      const role =
        (await getTmbPermission({
          resourceType: PerResourceTypeEnum.team,
          teamId: tmb.teamId,
          tmbId: tmb._id
        })) ?? TeamDefaultRoleVal;

      return {
        userId: String(tmb.userId),
        teamId: String(tmb.teamId),
        teamAvatar: tmb.team.avatar,
        teamName: tmb.team.name,
        memberName: tmb.name,
        avatar: tmb.avatar,
        balance: tmb.team.balance,
        tmbId: String(tmb._id),
        teamDomain: tmb.team?.teamDomain,
        role: tmb.role,
        status: tmb.status,
        permission: new TeamPermission({
          role,
          isOwner: tmb.role === TeamMemberRoleEnum.owner
        }),
        notificationAccount: tmb.team.notificationAccount
      };
    })
  );

  return list;
}

export default NextAPI(handler);
