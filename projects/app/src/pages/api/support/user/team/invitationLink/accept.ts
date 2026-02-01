import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

async function handler(req: any, res: any) {
  const { userId } = await authCert({ req, authToken: true });
  const { linkId } = req.body as { linkId: string };

  const link = await MongoInvitationLink.findOne({ linkId });

  if (!link) throw new Error('Link not found');
  if (link.expires < new Date() || link.forbidden) throw new Error('Link invalid or expired');
  if (link.usedTimesLimit !== -1 && link.members.length >= (link.usedTimesLimit ?? -1))
    throw new Error('Link limit reached');

  // Check if user already in team
  const existingMember = await MongoTeamMember.findOne({ teamId: link.teamId, userId });
  if (existingMember) {
    // If member exists, checking status?
    // For now, just return success if already member
    return 'Already joined';
  }

  await mongoSessionRun(async (session) => {
    // Add member
    const [tmb] = await MongoTeamMember.create(
      [
        {
          teamId: link.teamId,
          userId,
          name: 'Member',
          role: TeamMemberRoleEnum.member,
          status: TeamMemberStatusEnum.active,
          createTime: new Date()
        }
      ],
      { session }
    );

    // Update link usage
    link.members.push(String(tmb._id));
    await link.save({ session });
  });

  return 'Joined successfully';
}

export default NextAPI(handler);
