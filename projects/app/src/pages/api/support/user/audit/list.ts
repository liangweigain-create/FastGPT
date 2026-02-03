import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamAudit } from '@fastgpt/service/support/user/audit/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type { TeamAuditSchemaType } from '@fastgpt/global/support/user/audit/type';

export type AuditListQuery = PaginationProps<{
  tmbId?: string;
  event?: string;
}>;

export type TeamAuditListItemType = TeamAuditSchemaType & {
  memberName?: string;
};

/**
 * [Privatization] List audit logs for the current team
 */
async function handler(
  req: ApiRequestProps<AuditListQuery>
): Promise<PaginationResponse<TeamAuditListItemType>> {
  const { offset: rawOffset = 0, pageSize: rawPageSize = 20, tmbId: filterTmbId, event } = req.body;
  const offset = Number(rawOffset);
  const pageSize = Number(rawPageSize);
  const { teamId } = await authCert({ req, authToken: true });

  const query: Record<string, any> = { teamId };
  if (filterTmbId) {
    query.tmbId = filterTmbId;
  }
  if (event) {
    query.event = event;
  }

  const [total, list] = await Promise.all([
    MongoTeamAudit.countDocuments(query),
    MongoTeamAudit.find(query).sort({ timestamp: -1 }).skip(offset).limit(pageSize).lean()
  ]);

  // Enrich with member names
  const tmbIds = [...new Set(list.map((item) => String(item.tmbId)))];
  const members = await MongoTeamMember.find({ _id: { $in: tmbIds } }, 'name').lean();
  const memberMap = new Map(members.map((m) => [String(m._id), m.name]));

  const enrichedList: TeamAuditListItemType[] = list.map((item) => ({
    ...item,
    memberName: memberMap.get(String(item.tmbId)) || 'Unknown'
  }));

  return {
    total,
    list: enrichedList
  };
}

export default NextAPI(handler);
