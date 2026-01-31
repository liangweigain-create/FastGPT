import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { teamId, tmbId, userId } = await authCert({
      req,
      authToken: true
    });

    const team = await MongoTeam.findById(teamId).lean();
    const sub = await MongoTeamSub.findOne({ teamId, type: SubTypeEnum.standard }).lean();
    const members = await MongoTeamMember.find({ teamId }).lean();
    const currentMember = members.find((m) => String(m._id) === tmbId);

    return {
      currentUser: {
        userId,
        tmbId,
        role: currentMember?.role,
        username: currentMember?.name
      },
      team: {
        id: teamId,
        name: team?.name,
        limit: team?.limit // Old schema location
      },
      subscription: {
        maxApp: sub?.maxApp,
        maxDataset: sub?.maxDataset,
        totalPoints: sub?.totalPoints,
        currentSubLevel: sub?.currentSubLevel
      },
      members: members.map((m) => ({
        userId: m.userId,
        name: m.name,
        role: m.role,
        status: m.status
      }))
    };
  } catch (error) {
    return {
      error: String(error)
    };
  }
}

export default NextAPI(handler);
