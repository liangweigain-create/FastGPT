import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getChatSetting } from '@fastgpt/service/support/user/chat/controller';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });
  const data = await getChatSetting(teamId);
  return data || {}; // Return empty object if no settings found, as frontend expects object
}

export default NextAPI(handler);
