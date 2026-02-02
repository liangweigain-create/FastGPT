import { type TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
import type { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export type InvitationSchemaType = {
  _id: string;
  teamId: string;
  tmbId: string;
  role: `${TeamMemberRoleEnum}`;
  expires: Date;
  usedTimesLimit?: number;
  members: string[];
  forbidden?: boolean;
  createTime: Date;
};

export type InvitationType = Omit<InvitationSchemaType, 'members'> & {
  members: {
    tmbId: string;
    avatar: string;
    name: string;
  }[];
};

export type InvitationLinkExpiresType = '30m' | '7d' | '1y';

export type InvitationLinkCreateType = {
  description: string;
  role: `${TeamMemberRoleEnum}`;
  expires: InvitationLinkExpiresType;
  usedTimesLimit: 1 | -1;
};

// export type InvitationLinkUpdateType = Partial<
//   Omit<InvitationSchemaType, 'members' | 'teamId' | '_id'>
// >;

export type InvitationInfoType = InvitationSchemaType & {
  teamAvatar: string;
  teamName: string;
};
