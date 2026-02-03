import { GET, POST } from '@/web/common/api/request';
import type { UserInformType } from '@fastgpt/global/support/user/inform/type';
import type { SystemMsgModalValueType } from '@fastgpt/global/openapi/admin/support/user/inform/api';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';

export const getInforms = (data: PaginationProps) =>
  POST<PaginationResponse<UserInformType>>(`/support/user/inform/list`, data);

export const getUnreadCount = () =>
  GET<{
    unReadCount: number;
    importantInforms: UserInformType[];
  }>(`/support/user/inform/countUnread`);
export const readInform = (id: string) => GET(`/support/user/inform/read`, { id });

export const getSystemMsgModalData = () =>
  GET<SystemMsgModalValueType>(`/support/user/inform/getSystemMsgModal`);
