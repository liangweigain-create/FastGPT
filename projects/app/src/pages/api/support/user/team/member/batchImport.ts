import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { hashStr } from '@fastgpt/global/common/string/tools';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { jsonRes } from '@fastgpt/service/common/response';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export type BatchImportMemberItem = {
  username: string;
  password: string;
  role?: `${TeamMemberRoleEnum}`;
  email?: string;
  memberName?: string;
};

export type BatchImportRequest = {
  members: BatchImportMemberItem[];
};

export type BatchImportResponse = {
  success: number;
  failed: number;
  errors: { username: string; error: string }[];
};

/**
 * [Privatization] Batch import members
 * - Only root user can use this API
 * - All members are added to the root team
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tmbId, teamId, userId } = await authCert({ req, authToken: true });

  // Check if current user is root
  const currentUser = await MongoUser.findById(userId).lean();
  if (currentUser?.username !== 'root') {
    return jsonRes(res, {
      code: 403,
      error: 'Only root user can batch import members'
    });
  }

  const { members } = req.body as BatchImportRequest;

  if (!members || !Array.isArray(members) || members.length === 0) {
    return jsonRes(res, {
      code: 400,
      error: 'Members array is required'
    });
  }

  // Find root team (the team that root user owns)
  const rootTeam = await MongoTeam.findOne({ ownerId: userId }).lean();
  if (!rootTeam) {
    return jsonRes(res, {
      code: 500,
      error: 'Root team not found'
    });
  }
  const rootTeamId = rootTeam._id;

  const result: BatchImportResponse = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const member of members) {
    try {
      if (!member.username || !member.password) {
        result.failed++;
        result.errors.push({
          username: member.username || 'unknown',
          error: 'Username and password are required'
        });
        continue;
      }

      await mongoSessionRun(async (session) => {
        // Check if user already exists
        let user = await MongoUser.findOne({ username: member.username }).session(session);

        if (!user) {
          // Create new user
          const [newUser] = await MongoUser.create(
            [
              {
                username: member.username,
                password: hashStr(member.password),
                ...(member.email ? { email: member.email } : {})
              }
            ],
            { session }
          );
          user = newUser;
        }

        // Check if user is already in the root team
        const existingMember = await MongoTeamMember.findOne({
          teamId: rootTeamId,
          userId: user._id
        }).session(session);

        if (!existingMember) {
          // Add user to root team
          await MongoTeamMember.create(
            [
              {
                teamId: rootTeamId,
                userId: user._id,
                name: member.memberName || member.username,
                role: member.role || TeamMemberRoleEnum.member,
                status: TeamMemberStatusEnum.active,
                createTime: new Date()
              }
            ],
            { session }
          );
        } else {
          // User already in team - update role if provided
          if (member.role && existingMember.role !== member.role) {
            await MongoTeamMember.updateOne(
              { _id: existingMember._id },
              { $set: { role: member.role } },
              { session }
            );
          }
        }
      });

      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        username: member.username,
        error: error.message || 'Unknown error'
      });
    }
  }

  jsonRes(res, {
    code: 200,
    data: result
  });
}

export default NextAPI(handler);
