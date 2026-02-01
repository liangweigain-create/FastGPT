import { NextAPI } from '@/service/middleware/entry';
import { addAuthCode } from '@fastgpt/service/support/user/auth/controller';
import type { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';

/**
 * [Privatization] Local sendAuthCode API
 * In development mode (SKIP_AUTH_CODE=true), it generates a fixed code '123456'.
 * In production, you should integrate with SMS/Email service here.
 */
async function handler(req: any, res: any) {
  const { username, type } = req.body as {
    username: string;
    type: `${UserAuthTypeEnum}`;
    googleToken?: string;
    captcha?: string;
    lang?: string;
  };

  if (!username || !type) {
    throw new Error('Missing username or type');
  }

  // In development mode, use a fixed code
  const isDev = process.env.SKIP_AUTH_CODE === 'true';
  const code = isDev ? '123456' : generateRandomCode();

  // Store the code (expires in 5 minutes)
  await addAuthCode({
    key: username,
    code,
    type,
    expiredTime: new Date(Date.now() + 5 * 60 * 1000)
  });

  if (isDev) {
    console.log(`[Dev Mode] Auth code for ${username}: ${code}`);
    return { message: 'Code sent (dev mode)', code }; // Return code in dev for convenience
  }

  // TODO: Production - integrate with SMS/Email service
  // Example:
  // await sendSMS({ phone: username, code });
  // await sendEmail({ email: username, code });

  return { message: 'Code sent' };
}

function generateRandomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default NextAPI(handler);
