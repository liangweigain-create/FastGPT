import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { deleteFavouriteApp } from '@fastgpt/service/support/user/favourite/controller';
import { z } from 'zod';

const DeleteSchema = z.object({
  id: z.string()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });
  const { id } = DeleteSchema.parse(req.query);
  await deleteFavouriteApp(teamId, id);
  return {};
}

export default NextAPI(handler);
