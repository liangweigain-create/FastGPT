import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getUnreadCountHandler } from '@fastgpt/service/support/user/inform/controller';
import { NextAPI } from '@/service/middleware/entry';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<{
  unReadCount: number;
  importantInforms: any[]; // UserInformType[]
}> {
  const { userId } = await authCert({
    req,
    authToken: true
  });

  const count = await getUnreadCountHandler(userId);

  return {
    unReadCount: count,
    importantInforms: [] // Not implementing important informs logic for now
  };
}

export default NextAPI(handler);
