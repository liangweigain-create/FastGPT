import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { authCert, setCookie } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { createUserSession } from '@fastgpt/service/support/user/session';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';

export type SwitchTeamProps = {
  teamId: string;
};

async function handler(req: ApiRequestProps<SwitchTeamProps>, res: any) {
  const { teamId } = req.body;
  const { userId } = await authCert({ req, authToken: true });

  const member = await MongoTeamMember.findOne({
    teamId,
    userId,
    status: 'active'
  });

  if (!member) {
    return Promise.reject(ERROR_ENUM.unAuthorization);
  }

  // Create new session
  const token = await createUserSession({
    userId,
    teamId,
    tmbId: String(member._id),
    isRoot: false // Re-eval root status? Usually implicit from userId if root
  });

  setCookie(res, token);

  return token;
}

export default NextAPI(handler);
