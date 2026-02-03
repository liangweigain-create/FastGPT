import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getFavouriteApps } from '@fastgpt/service/support/user/favourite/controller';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });
  return await getFavouriteApps(teamId);
}

export default NextAPI(handler);
