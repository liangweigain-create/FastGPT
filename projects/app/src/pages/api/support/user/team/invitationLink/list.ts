import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { Permission } from '@fastgpt/global/support/permission/controller';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

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

  const list = await MongoInvitationLink.find({ teamId }).sort({ createTime: -1 });

  // Format list to match InvitationType
  // InvitationType has members? The schema has members: [String].
  // But type.ts says members: { tmbId, avatar, name }[] in InvitationType.
  // The schema stores member IDs (string).
  // We need to fetch member info if we want to show who used it?
  // But usually schema members stores who USED it.

  // Impl: fetch member details for 'members' array.
  // We can populate? No, members is [String].
  // We need to fetch MongoTeamMember where _id IN members.

  const result = await Promise.all(
    list.map(async (item) => {
      // @ts-ignore
      const members = await import('@fastgpt/service/support/user/team/teamMemberSchema').then(
        ({ MongoTeamMember }) =>
          MongoTeamMember.find({ _id: { $in: item.members } }, '_id name avatar').lean()
      );

      return {
        ...item.toObject(),
        members: members.map((m: any) => ({
          tmbId: String(m._id),
          name: m.name,
          avatar: m.avatar
        }))
      };
    })
  );

  return result;
}

export default NextAPI(handler);
