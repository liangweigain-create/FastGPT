import type { NextApiRequest } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest): Promise<{ count: number }> {
  const { teamId } = await authCert({
    req,
    authToken: true
  });

  const count = await MongoTeamMember.countDocuments({
    teamId,
    status: { $ne: TeamMemberStatusEnum.leave }
  });

  return {
    count
  };
}

export default NextAPI(handler);
