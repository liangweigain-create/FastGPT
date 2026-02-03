import { MongoChatSetting } from './schema';
import type { ChatSettingType } from '@fastgpt/global/core/chat/setting/type';

export async function getChatSetting(teamId: string) {
  const setting = await MongoChatSetting.findOne({ teamId }).lean();
  return setting;
}

export async function updateChatSetting(teamId: string, data: Partial<ChatSettingType>) {
  await MongoChatSetting.updateOne(
    { teamId },
    {
      $set: {
        ...data,
        teamId // Ensure teamId is in $set for upsert
      }
    },
    { upsert: true }
  );
}
