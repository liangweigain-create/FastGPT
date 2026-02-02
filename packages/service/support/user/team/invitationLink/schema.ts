import { connectionMongo, getMongoModel } from '../../../../common/mongo';
const { Schema } = connectionMongo;
import {
  TeamCollectionName,
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import type { InvitationSchemaType } from './type';

export const InvitationLinkCollectionName = 'team_invitation_links';

const InvitationLinkSchema = new Schema({
  linkId: {
    type: String,
    required: true,
    unique: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: TeamCollectionName,
    required: true
  },
  usedTimesLimit: {
    type: Number,
    default: -1
  },
  forbidden: {
    type: Boolean,
    default: false
  },
  expires: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  members: {
    type: [String],
    default: []
  },
  role: {
    type: String,
    enum: Object.values(TeamMemberRoleEnum),
    default: TeamMemberRoleEnum.member
  },
  createTime: {
    type: Date,
    default: () => new Date()
  }
});

export const MongoInvitationLink = getMongoModel<InvitationSchemaType>(
  InvitationLinkCollectionName,
  InvitationLinkSchema
);
