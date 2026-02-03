import { connectionMongo, getMongoModel } from '../../../common/mongo';
const { Schema } = connectionMongo;
import type { UserInformSchema } from '@fastgpt/global/support/user/inform/type';
import { userCollectionName } from '../schema';

export const UserInformCollectionName = 'user_informs';

const UserInformSchemaDef = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: userCollectionName,
    required: true
  },
  teamId: {
    type: Schema.Types.ObjectId
  },
  time: {
    type: Date,
    default: () => new Date()
  },
  level: {
    type: String,
    enum: ['common', 'important', 'emergency'],
    default: 'common'
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
});

// Index
UserInformSchemaDef.index({ userId: 1, read: 1, time: -1 });
UserInformSchemaDef.index({ time: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto expire after 30 days

export const MongoUserInform = getMongoModel<UserInformSchema>(
  UserInformCollectionName,
  UserInformSchemaDef
);
