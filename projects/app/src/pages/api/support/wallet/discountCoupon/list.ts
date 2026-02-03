import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return [];
}

export default NextAPI(handler);
