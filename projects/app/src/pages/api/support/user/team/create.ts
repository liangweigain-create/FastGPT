import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { CreateTeamProps } from '@fastgpt/global/support/user/team/controller.d';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import { createRootOrg } from '@fastgpt/service/support/permission/org/controllers';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

async function handler(req: any, res: any) {
  const { userId } = await authCert({ req, authToken: true });
  const { name, avatar } = req.body as CreateTeamProps;

  const teamId = await mongoSessionRun(async (session) => {
    // 1. Create Team
    const [{ _id: insertedId }] = await MongoTeam.create(
      [
        {
          ownerId: userId,
          name,
          avatar,
          createTime: new Date()
        }
      ],
      { session }
    );

    // 2. Create Member (Owner)
    const [tmb] = await MongoTeamMember.create(
      [
        {
          teamId: insertedId,
          userId,
          name: 'Owner',
          role: TeamMemberRoleEnum.owner,
          status: TeamMemberStatusEnum.active,
          createTime: new Date()
        }
      ],
      { session }
    );

    // 3. Create Default Group
    await MongoMemberGroupModel.create(
      [
        {
          teamId: insertedId,
          name: DefaultGroupName,
          avatar
        }
      ],
      { session }
    );

    // 4. Create Root Org
    await createRootOrg({ teamId: insertedId, session });

    return insertedId;
  });

  return teamId;
}

export default NextAPI(handler);
