import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { updateChatSetting } from '@fastgpt/service/support/user/chat/controller';
import {
  ChatSettingModelSchema,
  ChatSelectedToolSchema
} from '@fastgpt/global/core/chat/setting/type';
import { z } from 'zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await authCert({ req, authToken: true });

  // Validate body - Pick fields that are allowed to be updated
  // Note: ChatSettingModelSchema includes _id, teamId, appId etc.
  // We should pick the fields that are updatable.
  const body = ChatSettingModelSchema.omit({
    _id: true,
    teamId: true,
    quickAppIds: true,
    favouriteTags: true,
    selectedTools: true // Override detailed schema
  })
    .extend({
      selectedTools: z.array(ChatSelectedToolSchema).optional(),
      quickAppIds: z.array(z.string()).optional() // Allow quickAppIds update
    })
    .partial()
    .parse(req.body);

  await updateChatSetting(teamId, body);
  return {};
}

export default NextAPI(handler);
