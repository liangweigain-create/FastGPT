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

  const list = await MongoInvitationLink.find({ teamId }).sort({ createTime: -1 });

  // Format list to match InvitationType with member details
  const result = await Promise.all(
    list.map(async (item) => {
      const members = await MongoTeamMember.find(
        { _id: { $in: item.members } },
        '_id name avatar'
      ).lean();

      return {
        _id: item._id,
        linkId: item.linkId,
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
