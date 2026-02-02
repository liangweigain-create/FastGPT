import { CommonPerKeyEnum, CommonRolePerMap } from '../constant';
import type {
  PermissionListType,
  PermissionValueType,
  RoleListType,
  RolePerMapType
} from '../type';
import { CommonRoleList, CommonPerList } from '../constant';
import { i18nT } from '../../../../web/i18n/utils';
import { sumPer } from '../utils';

export enum TeamPerKeyEnum {
  appCreate = 'appCreate',
  datasetCreate = 'datasetCreate',
  apikeyCreate = 'apikeyCreate',
  invitationManage = 'invitationManage'
}

export enum TeamRoleKeyEnum {
  appCreate = 'appCreate',
  datasetCreate = 'datasetCreate',
  apikeyCreate = 'apikeyCreate',
  invitationManage = 'invitationManage'
}

export const TeamPerList: PermissionListType<TeamPerKeyEnum> = {
  ...CommonPerList,
  apikeyCreate: 0b100000,
  appCreate: 0b001000,
  datasetCreate: 0b010000,
  invitationManage: 0b1000000
};

export const TeamRoleList: RoleListType<TeamRoleKeyEnum> = {
  [CommonPerKeyEnum.read]: {
    ...CommonRoleList[CommonPerKeyEnum.read],
    name: i18nT('common:permission.common_member'),
    value: 0b000100
  },
  [CommonPerKeyEnum.write]: {
    ...CommonRoleList[CommonPerKeyEnum.write],
    value: 0b000010,
    checkBoxType: 'hidden'
  },
  [CommonPerKeyEnum.manage]: {
    ...CommonRoleList[CommonPerKeyEnum.manage],
    value: 0b000001
  },
  [TeamRoleKeyEnum.appCreate]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_appCreate'),
    value: 0b001000
  },
  [TeamRoleKeyEnum.datasetCreate]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_datasetCreate'),
    value: 0b010000
  },
  [TeamRoleKeyEnum.apikeyCreate]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_apikeyCreate'),
    value: 0b100000
  },
  [TeamRoleKeyEnum.invitationManage]: {
    checkBoxType: 'multiple',
    description: '',
    name: i18nT('account_team:permission_invitationManage'),
    value: 0b1000000
  }
};

export const TeamRolePerMap: RolePerMapType = new Map([
  ...CommonRolePerMap,
  [
    TeamRoleList['appCreate'].value,
    sumPer(TeamPerList.appCreate, CommonPerList.read, CommonPerList.write) as PermissionValueType
  ],
  [
    TeamRoleList['datasetCreate'].value,
    sumPer(
      TeamPerList.datasetCreate,
      CommonPerList.read,
      CommonPerList.write
    ) as PermissionValueType
  ],
  [
    TeamRoleList['apikeyCreate'].value,
    sumPer(TeamPerList.apikeyCreate, CommonPerList.read, CommonPerList.write) as PermissionValueType
  ],
  [
    TeamRoleList['invitationManage'].value,
    sumPer(
      TeamPerList.invitationManage,
      CommonPerList.read,
      CommonPerList.write
    ) as PermissionValueType
  ]
]);

export const TeamReadRoleVal = TeamRoleList['read'].value;
export const TeamWriteRoleVal = TeamRoleList['write'].value;
export const TeamManageRoleVal = TeamRoleList['manage'].value;
export const TeamAppCreateRoleVal = TeamRoleList['appCreate'].value;
export const TeamDatasetCreateRoleVal = TeamRoleList['datasetCreate'].value;
export const TeamApikeyCreateRoleVal = TeamRoleList['apikeyCreate'].value;
export const TeamInvitationManageRoleVal = TeamRoleList['invitationManage'].value;
export const TeamDefaultRoleVal = TeamReadRoleVal;

export const TeamReadPermissionVal = TeamPerList.read;
export const TeamWritePermissionVal = TeamPerList.write;
export const TeamManagePermissionVal = TeamPerList.manage;
export const TeamAppCreatePermissionVal = TeamPerList.appCreate;
export const TeamDatasetCreatePermissionVal = TeamPerList.datasetCreate;
export const TeamApikeyCreatePermissionVal = TeamPerList.apikeyCreate;
export const TeamInvitationManagePermissionVal = TeamPerList.invitationManage;
export const TeamDefaultPermissionVal = TeamReadPermissionVal;

// Admin preset: Sum of all functional permissions
export const TeamAdminPermissionVal = sumPer(
  TeamManagePermissionVal,
  TeamAppCreatePermissionVal,
  TeamDatasetCreatePermissionVal,
  TeamApikeyCreatePermissionVal,
  TeamInvitationManagePermissionVal,
  TeamReadPermissionVal, // Admin implies read
  TeamWritePermissionVal // Admin implies write
) as PermissionValueType;
