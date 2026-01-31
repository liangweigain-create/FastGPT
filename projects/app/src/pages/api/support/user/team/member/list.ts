import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { TeamDefaultRoleVal } from '@fastgpt/global/support/permission/user/constant';
// PaginationResponse might be in different place or local. Checking patterns.
// Actually PagingResponse is usually in @fastgpt/web/common/fetch/type or similar, but this is backend.
// Let's use PagingResponse from global type if available or just define it.
// Checking projects/app/src/web/support/user/team/api.ts line 24: import type { PaginationResponse } from '@fastgpt/web/common/fetch/type';
// Backend shouldn't import from web.
// Let's verify where PaginationResponse is defined for backend.
// Usually backend returns { list: T[], total: number }.
// Let 's assume custom type matching frontend expectation.
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

  const list: TeamMemberItemType[] = await Promise.all(
    members.map(async (member) => {
      const role =
        (await getTmbPermission({
          resourceType: PerResourceTypeEnum.team,
          teamId: member.teamId,
          tmbId: member._id
        })) ?? TeamDefaultRoleVal;

      return {
        userId: String(member.userId),
        tmbId: String(member._id),
        teamId: String(member.teamId),
        memberName: member.name,
        avatar: member.avatar,
        role: member.role as any,
        status: member.status as any,
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
