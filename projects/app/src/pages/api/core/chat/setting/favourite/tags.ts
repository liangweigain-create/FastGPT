import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { updateFavouriteAppTags } from '@fastgpt/service/support/user/favourite/controller';
import { z } from 'zod';

const TagsSchema = z.array(
  z.object({
    id: z.string(),
    tags: z.array(z.string())
  })
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });
  const body = TagsSchema.parse(req.body);
  await updateFavouriteAppTags(teamId, body);
  return {};
}

export default NextAPI(handler);
