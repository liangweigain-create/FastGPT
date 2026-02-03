import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { getInformsHandler } from '@fastgpt/service/support/user/inform/controller';
import type { UserInformType } from '@fastgpt/global/support/user/inform/type';
import type { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { NextAPI } from '@/service/middleware/entry';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<PaginationResponse<UserInformType>> {
  const { current = 1, pageSize = 20 } = req.body;
  const { userId } = await authCert({
    req,
    authToken: true
  });

  return getInformsHandler({
    userId,
    current,
    pageSize
  });
}

export default NextAPI(handler);
