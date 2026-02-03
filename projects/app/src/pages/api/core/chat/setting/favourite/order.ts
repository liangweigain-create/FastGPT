import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { updateFavouriteAppOrder } from '@fastgpt/service/support/user/favourite/controller';
import { z } from 'zod';

const OrderSchema = z.array(
  z.object({
    id: z.string(),
    order: z.number()
  })
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });
  const body = OrderSchema.parse(req.body);
  await updateFavouriteAppOrder(teamId, body);
  return {};
}

export default NextAPI(handler);
