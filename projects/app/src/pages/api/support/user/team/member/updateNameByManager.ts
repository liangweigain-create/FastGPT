import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

export type UpdateNameByManagerProps = {
  tmbId: string;
  name: string;
};

/**
 * [Privatization] Update a team member's display name (by manager/admin)
 */
async function handler(req: ApiRequestProps<UpdateNameByManagerProps>) {
  const { tmbId: targetTmbId, name } = req.body;
  const { tmbId, teamId } = await authCert({ req, authToken: true });

  if (!targetTmbId || !name || typeof name !== 'string') {
    throw new Error('tmbId and name are required');
  }

  // Verify target member is in the same team
  const targetMember = await MongoTeamMember.findOne({
    _id: targetTmbId,
    teamId
  });

  if (!targetMember) {
    throw new Error('Team member not found');
  }

  await MongoTeamMember.updateOne(
    { _id: targetTmbId },
    { $set: { name: name.trim(), updateTime: new Date() } }
  );

  return { success: true };
}

export default NextAPI(handler);
