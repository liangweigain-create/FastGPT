import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import type { SystemMsgModalValueType } from '@fastgpt/global/openapi/admin/support/user/inform/api';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<SystemMsgModalValueType> {
  return undefined;
}

export default NextAPI(handler);
