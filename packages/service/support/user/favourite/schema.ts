import { connectionMongo, getMongoModel } from '../../../common/mongo';
const { Schema } = connectionMongo;
import { ChatFavouriteAppModelSchema } from '@fastgpt/global/core/chat/favouriteApp/type';
import { TeamCollectionName } from '@fastgpt/global/support/user/team/constant';

export const ChatFavouriteAppCollectionName = 'chat_favourite_apps';

const ChatFavouriteAppSchema = new Schema({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  appId: {
    type: Schema.Types.ObjectId,
    ref: 'apps', // Need to verify AppCollectionName
    required: true
  },
  favouriteTags: [String],
  order: {
    type: Number,
    default: 0
  }
});

// Index for efficient querying by team and order
ChatFavouriteAppSchema.index({ teamId: 1, order: 1 });
ChatFavouriteAppSchema.index({ teamId: 1, appId: 1 }, { unique: true });

export const MongoChatFavouriteApp = getMongoModel(
  ChatFavouriteAppCollectionName,
  ChatFavouriteAppSchema
);
