import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { updateFavouriteApps } from '@fastgpt/service/support/user/favourite/controller';
import { ChatFavouriteAppModelSchema } from '@fastgpt/global/core/chat/favouriteApp/type';
import { z } from 'zod';

const UpdateSchema = z.array(
  ChatFavouriteAppModelSchema.pick({
    appId: true,
    order: true
  }).extend({
    favouriteTags: z.array(z.string()).optional()
  })
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });
  const body = UpdateSchema.parse(req.body);
  await updateFavouriteApps(teamId, body);
  return {};
}

export default NextAPI(handler);
