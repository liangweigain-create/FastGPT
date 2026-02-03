import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { authCode } from '@fastgpt/service/support/user/auth/controller';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { hashStr } from '@fastgpt/global/common/string/tools';

export type UpdatePasswordByCodeProps = {
  username: string;
  code: string;
  password: string; // Already hashed by frontend
};

/**
 * [Privatization] Reset password using verification code
 * Flow:
 * 1. Frontend calls `sendAuthCode` with type `findPassword`.
 * 2. User receives code (or logs it in dev mode).
 * 3. Frontend calls this API with username, code, and new password.
 */
async function handler(req: ApiRequestProps<UpdatePasswordByCodeProps>) {
  const { username, code, password } = req.body;

  if (!username || !code || !password) {
    throw new Error('Username, code, and password are required');
  }

  // Verify the code
  await authCode({
    key: username,
    type: UserAuthTypeEnum.findPassword,
    code
  });

  // Find user and update password
  const user = await MongoUser.findOne({ username });
  if (!user) {
    throw new Error('User not found');
  }

  // Password is already hashed by frontend, but MongoUser schema also hashes on set.
  // To avoid double hashing, we update directly without going through schema setter.
  // Actually, the schema setter uses hashStr, so we need to update with plain value
  // or skip the setter. Let's check if frontend sends hashed or plain.
  // Frontend: hashStr(password) -> so it's already hashed.
  // Schema setter: hashStr(val) -> would double hash.
  // Solution: Use updateOne with $set to bypass setter, OR expect frontend to send plain.
  // Current frontend sends hashed. So we bypass setter:
  await MongoUser.updateOne(
    { _id: user._id },
    { $set: { password: password, passwordUpdateTime: new Date() } }
  );

  return { success: true };
}

export default NextAPI(handler);
