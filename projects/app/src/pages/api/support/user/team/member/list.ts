import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { TeamDefaultRoleVal } from '@fastgpt/global/support/permission/user/constant';

import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import { NextAPI } from '@/service/middleware/entry';

type PaginationResponse<T = any> = {
  total: number;
  list: T[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<PaginationResponse<TeamMemberItemType>> {
  const {
    current,
    pageSize,
    searchText = ''
  } = req.body as {
    current: number;
    pageSize: number;
    searchText?: string;
  };

  const { teamId, tmbId } = await authCert({
    req,
    authToken: true
  });

  const match = {
    teamId,
    ...(searchText
      ? {
          name: new RegExp(searchText, 'i')
        }
      : {})
  };

  const [total, members] = await Promise.all([
    MongoTeamMember.countDocuments(match),
    MongoTeamMember.find(match)
      .sort({ createTime: 1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean()
  ]);

  // [Privatization] Fetch user status to check if global account is forbidden
  const userIds = members.map((m) => m.userId);
  const users = await MongoUser.find({ _id: { $in: userIds } }, 'status').lean();
  const userStatusMap = new Map(users.map((u) => [String(u._id), u.status]));

  const list: TeamMemberItemType[] = await Promise.all(
    members.map(async (member) => {
      const role =
        (await getTmbPermission({
          resourceType: PerResourceTypeEnum.team,
          teamId: member.teamId,
          tmbId: member._id
        })) ?? TeamDefaultRoleVal;

      const userStatus = userStatusMap.get(String(member.userId));
      // If user is globally forbidden, override team member status
      const displayStatus =
        userStatus === 'forbidden' ? TeamMemberStatusEnum.forbidden : member.status;

      return {
        userId: String(member.userId),
        tmbId: String(member._id),
        teamId: String(member.teamId),
        memberName: member.name,
        avatar: member.avatar,
        role: member.role as any,
        status: displayStatus as any,
        createTime: member.createTime,
        permission: new TeamPermission({
          role,
          isOwner: member.role === 'owner'
        })
      };
    })
  );

  return {
    total,
    list
  };
}

export default NextAPI(handler);
