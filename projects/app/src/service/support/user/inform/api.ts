import { type SendInform2UserProps } from '@fastgpt/global/support/user/inform/type';
import { createInform } from '@fastgpt/service/support/user/inform/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export async function sendOneInform(data: SendInform2UserProps) {
  // Find team owner
  const owner = await MongoTeamMember.findOne({
    teamId: data.teamId,
    role: TeamMemberRoleEnum.owner
  });

  if (owner) {
    await createInform({
      ...data,
      userId: String(owner.userId)
    });
  }
}
