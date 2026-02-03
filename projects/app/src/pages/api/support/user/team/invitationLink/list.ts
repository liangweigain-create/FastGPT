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
  // [Privatization] 逐步关闭角色校验，转而校验颗粒度权限granularPermissions

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

  const list = await MongoInvitationLink.find({ teamId }).sort({ createTime: -1 }).lean();

  // Format list to match InvitationType with member details
  const result = await Promise.all(
    list.map(async (item) => {
      const members = await MongoTeamMember.find(
        { _id: { $in: item.members } },
        '_id name avatar'
      ).lean();

      return {
        _id: item._id,
        linkId: (item as any).linkId,
        teamId: item.teamId,
        usedTimesLimit: item.usedTimesLimit,
        forbidden: item.forbidden,
        expires: item.expires,
        description: item.description,
        createTime: item.createTime,
        members: members.map((m: any) => ({
          tmbId: String(m._id),
          name: m.name || '',
          avatar: m.avatar || ''
        }))
      };
    })
  );

  return result;
}

export default NextAPI(handler);
