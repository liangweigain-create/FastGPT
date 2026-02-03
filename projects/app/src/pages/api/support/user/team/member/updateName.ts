import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

export type UpdateNameProps = {
  name: string;
};

/**
 * [Privatization] Update current user's display name in their team
 */
async function handler(req: ApiRequestProps<UpdateNameProps>) {
  const { name } = req.body;
  const { tmbId } = await authCert({ req, authToken: true });

  if (!name || typeof name !== 'string') {
    throw new Error('Name is required');
  }

  await MongoTeamMember.updateOne(
    { _id: tmbId },
    { $set: { name: name.trim(), updateTime: new Date() } }
  );

  return { success: true };
}

export default NextAPI(handler);
