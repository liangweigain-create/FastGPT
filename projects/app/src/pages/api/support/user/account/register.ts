import { NextAPI } from '@/service/middleware/entry';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { createDefaultTeam } from '@fastgpt/service/support/user/team/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { authCode } from '@fastgpt/service/support/user/auth/controller';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { setCookie } from '@fastgpt/service/support/permission/auth/common';
import { createUserSession } from '@fastgpt/service/support/user/session';
import type { AccountRegisterBody } from '@fastgpt/global/support/user/login/api.d';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

/**
 * [Privatization] Local Registration API
 * Skips auth code verification if SKIP_AUTH_CODE=true (for development)
 */
async function handler(req: any, res: any) {
  const { username, password, code, inviterId, bd_vid, msclkid, fastgpt_sem, sourceDomain } =
    req.body as AccountRegisterBody;

  if (!username || !password) {
    throw new Error('Missing username or password');
  }

  // Check if user already exists
  const existingUser = await MongoUser.findOne({ username });
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Verify auth code (skip in dev mode)
  const skipAuthCode = process.env.SKIP_AUTH_CODE === 'true';
  if (!skipAuthCode) {
    if (!code) {
      throw new Error('Auth code is required');
    }
    await authCode({
      key: username,
      type: UserAuthTypeEnum.register,
      code
    });
  } else {
    console.log('[Dev Mode] Skipping auth code verification');
  }

  // Create user and team in a transaction
  const result = await mongoSessionRun(async (session) => {
    // Create user
    const [user] = await MongoUser.create(
      [
        {
          username,
          password, // Will be hashed by schema setter
          inviterId,
          fastgpt_sem,
          sourceDomain
        }
      ],
      { session }
    );

    // Create default team for the user
    const tmb = await createDefaultTeam({
      userId: user._id,
      teamName: username, // Use username as default team name
      session
    });

    return { user, tmb };
  });

  if (!result || !result.tmb || !result.user) {
    throw new Error('Failed to create user or team');
  }

  const { user, tmb } = result;

  // Create session and set cookie
  const sessionKey = await createUserSession({
    userId: String(user._id),
    teamId: String(tmb.teamId),
    tmbId: String(tmb._id)
  });
  setCookie(res, sessionKey);

  // Get user detail for response
  const userDetail = await getUserDetail({ tmbId: String(tmb._id) });

  return {
    user: userDetail,
    token: sessionKey
  };
}

export default NextAPI(handler);
