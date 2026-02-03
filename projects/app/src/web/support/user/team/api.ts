import { GET, POST, PUT, DELETE } from '@/web/common/api/request';
import type {
  CollaboratorListType,
  DeletePermissionQuery,
  UpdateClbPermissionProps
} from '@fastgpt/global/support/permission/collaborator';
import type {
  CreateTeamProps,
  UpdateInviteProps,
  UpdateTeamProps
} from '@fastgpt/global/support/user/team/controller.d';
import type { TeamTagItemType, TeamTagSchema } from '@fastgpt/global/support/user/team/type';
import type {
  TeamTmbItemType,
  TeamMemberItemType,
  TeamMemberSchema
} from '@fastgpt/global/support/user/team/type.d';
import type {
  ClientTeamPlanStatusType,
  TeamSubSchemaType
} from '@fastgpt/global/support/wallet/sub/type';
import type { TeamInvoiceHeaderType } from '@fastgpt/global/support/user/team/type';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type {
  InvitationInfoType,
  InvitationLinkCreateType,
  InvitationType
} from '@fastgpt/service/support/user/team/invitationLink/type';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';

/* --------------- team  ---------------- */
/* --------------- team  ---------------- */
export const getTeamList = (status: `${TeamMemberSchema['status']}`) =>
  GET<TeamTmbItemType[]>(`/support/user/team/list`, { status });
export const postCreateTeam = (data: CreateTeamProps) =>
  POST<string>(`/support/user/team/create`, data);
export const putUpdateTeam = (data: UpdateTeamProps) => PUT(`/support/user/team/update`, data);
export const putSwitchTeam = (teamId: string) =>
  PUT<string>(`/support/user/team/switch`, { teamId });

/* --------------- team member ---------------- */
export const getTeamMembers = (
  props: PaginationProps<{
    status?: 'active' | 'inactive';
    withOrgs?: boolean;
    withPermission?: boolean;
    searchKey?: string;
    orgId?: string;
    groupId?: string;
  }>
) => POST<PaginationResponse<TeamMemberItemType>>(`/support/user/team/member/list`, props);
export const getTeamMemberCount = () => GET<{ count: number }>(`/support/user/team/member/count`);

// export const postInviteTeamMember = (data: InviteMemberProps) =>
//   POST<InviteMemberResponse>(`/proApi/support/user/team/member/invite`, data);
export const putUpdateMemberNameByManager = (tmbId: string, name: string) =>
  // [Privatization] local API
  PUT(`/support/user/team/member/updateNameByManager`, { tmbId, name });

export const putUpdateMemberName = (name: string) =>
  // [Privatization] local API
  PUT(`/support/user/team/member/updateName`, { name });
export const delRemoveMember = (tmbId: string) =>
  DELETE(`/proApi/support/user/team/member/delete`, { tmbId });
export const updateInviteResult = (data: UpdateInviteProps) =>
  PUT('/proApi/support/user/team/member/updateInvite', data);
export const postRestoreMember = (tmbId: string) =>
  POST('/proApi/support/user/team/member/restore', { tmbId });
export const delLeaveTeam = () => DELETE('/proApi/support/user/team/member/leave');

// [Privatization] Batch import members - only for root user
export type BatchImportMemberItem = {
  username: string;
  password: string;
  role?: 'owner' | 'admin' | 'member';
  email?: string;
  memberName?: string;
};
export type BatchImportResponse = {
  success: number;
  failed: number;
  errors: { username: string; error: string }[];
};
export const postBatchImportMembers = (members: BatchImportMemberItem[]) =>
  POST<BatchImportResponse>(`/support/user/team/member/batchImport`, { members });

/* -------------- team invitaionlink -------------------- */

/* -------------- team invitationlink -------------------- */
export const postCreateInvitationLink = (data: InvitationLinkCreateType) =>
  POST<string>(`/support/user/team/invitationLink/create`, data);

export const getInvitationLinkList = () =>
  GET<InvitationType[]>(`/support/user/team/invitationLink/list`);

export const postAcceptInvitationLink = (linkId: string) =>
  POST<string>(`/support/user/team/invitationLink/accept`, { linkId });

export const getInvitationInfo = (linkId: string) =>
  GET<InvitationInfoType>(`/support/user/team/invitationLink/info`, { linkId });
export const putForbidInvitationLink = (linkId: string) =>
  PUT<string>(`/support/user/team/invitationLink/forbid`, { linkId });
export const deleteInvitationLink = (_id: string) =>
  DELETE(`/support/user/team/invitationLink/delete`, { _id });

/* -------------- team collaborator -------------------- */
/* -------------- team collaborator -------------------- */
export const getTeamClbs = () => GET<CollaboratorListType>(`/support/user/team/collaborator/list`);
export const updateMemberPermission = (data: UpdateClbPermissionProps) =>
  POST('/support/user/team/collaborator/update', data);
export const updateOneMemberPermission = (data: {
  tmbId?: string;
  orgId?: string;
  groupId?: string;
  permission: PermissionValueType;
}) => POST('/support/user/team/collaborator/updateOne', data);
export const deleteMemberPermission = (id: DeletePermissionQuery) =>
  DELETE('/support/user/team/collaborator/delete', id);

/* --------------- team tags ---------------- */
export const getTeamsTags = () => GET<TeamTagSchema[]>(`/proApi/support/user/team/tag/list`);
export const loadTeamTagsByDomain = (domain: string) =>
  GET<TeamTagItemType[]>(`/proApi/support/user/team/tag/async`, { domain });

/* team limit */
export const checkTeamExportDatasetLimit = (datasetId: string) =>
  GET(`/support/user/team/limit/exportDatasetLimit`, { datasetId });
export const checkTeamWebSyncLimit = () => GET(`/support/user/team/limit/webSyncLimit`);
export const checkTeamDatasetSizeLimit = (size: number) =>
  GET(`/support/user/team/limit/datasetSizeLimit`, { size });

/* plans */
export const getTeamPlanStatus = () =>
  GET<ClientTeamPlanStatusType>(`/support/user/team/plan/getTeamPlanStatus`, { maxQuantity: 1 });
export const getTeamPlans = () =>
  GET<TeamSubSchemaType[]>(`/proApi/support/user/team/plan/getTeamPlans`);

export const redeemCoupon = (couponCode: string) =>
  GET(`/proApi/support/wallet/coupon/redeem`, { key: couponCode });

export const getTeamInvoiceHeader = () =>
  GET<TeamInvoiceHeaderType>(`/proApi/support/user/team/invoiceAccount/getTeamInvoiceHeader`);

export const updateTeamInvoiceHeader = (data: TeamInvoiceHeaderType) =>
  POST(`/proApi/support/user/team/invoiceAccount/update`, data);
