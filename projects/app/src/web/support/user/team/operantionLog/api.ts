import { GET, POST, PUT } from '@/web/common/api/request';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type { TeamAuditListItemType } from '@fastgpt/global/support/user/audit/type';
import type { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

// [Privatization] local API
export const getOperationLogs = (
  props: PaginationProps & {
    tmbIds?: string[];
    events?: AuditEventEnum[];
  }
) => POST<PaginationResponse<TeamAuditListItemType>>(`/support/user/audit/list`, props);
