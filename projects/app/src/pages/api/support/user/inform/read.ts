import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { readInformHandler } from '@fastgpt/service/support/user/inform/controller';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { id } = req.query as { id: string };
  const { userId } = await authCert({
    req,
    authToken: true
  });

  await readInformHandler({ userId, id });
  return {};
}

export default NextAPI(handler);
