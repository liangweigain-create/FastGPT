import { connectionMongo, getMongoModel } from '../../../common/mongo';
const { Schema } = connectionMongo;
import { ChatSettingModelSchema } from '@fastgpt/global/core/chat/setting/type';
import { TeamCollectionName } from '@fastgpt/global/support/user/team/constant';

export const ChatSettingCollectionName = 'chat_settings';

const ChatSettingSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true,
    unique: true
  },
  appId: {
    type: Schema.Types.ObjectId,
    ref: 'apps' // Need to verify AppCollectionName or string
  },
  slogan: String,
  dialogTips: String,
  enableHome: Boolean,
  homeTabTitle: String,
  wideLogoUrl: String,
  squareLogoUrl: String,
  quickAppIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'apps'
    }
  ],
  selectedTools: [
    {
      pluginId: {
        type: Schema.Types.ObjectId,
        ref: 'apps'
      },
      inputs: Object,
      name: String,
      avatar: String
    }
  ],
  favouriteTags: [
    {
      id: String,
      name: String
    }
  ]
});

export const MongoChatSetting = getMongoModel(ChatSettingCollectionName, ChatSettingSchema);
