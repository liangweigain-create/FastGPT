import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamAudit } from '@fastgpt/service/support/user/audit/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type { TeamAuditListItemType } from '@fastgpt/global/support/user/audit/type';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';

export type AuditListQuery = PaginationProps<{
  tmbIds?: string[];
  events?: string[];
}>;

/**
 * [Privatization] List audit logs for the current team
 * Returns data in format expected by frontend Audit component
 */
async function handler(
  req: ApiRequestProps<AuditListQuery>
): Promise<PaginationResponse<TeamAuditListItemType>> {
  const { offset: rawOffset = 0, pageSize: rawPageSize = 20, tmbIds, events } = req.body;
  const offset = Number(rawOffset);
  const pageSize = Number(rawPageSize);
  const { teamId } = await authCert({ req, authToken: true });

  const query: Record<string, any> = { teamId };
  if (tmbIds && tmbIds.length > 0) {
    query.tmbId = { $in: tmbIds };
  }
  if (events && events.length > 0) {
    query.event = { $in: events };
  }

  const [total, list] = await Promise.all([
    MongoTeamAudit.countDocuments(query),
    MongoTeamAudit.find(query).sort({ timestamp: -1 }).skip(offset).limit(pageSize).lean()
  ]);

  // Enrich with full member info for sourceMember
  const tmbIdSet = [...new Set(list.map((item) => String(item.tmbId)))];
  const members = await MongoTeamMember.find(
    { _id: { $in: tmbIdSet } },
    'name avatar status'
  ).lean();
  const memberMap = new Map(
    members.map((m) => [
      String(m._id),
      {
        name: m.name || 'Unknown',
        avatar: m.avatar || '',
        status: m.status || TeamMemberStatusEnum.active
      }
    ])
  );

  const enrichedList: TeamAuditListItemType[] = list.map((item) => ({
    _id: String(item._id),
    sourceMember: memberMap.get(String(item.tmbId)) || {
      name: 'Unknown',
      avatar: '',
      status: TeamMemberStatusEnum.active
    },
    event: item.event,
    timestamp: item.timestamp,
    metadata: item.metadata || {}
  }));

  return {
    total,
    list: enrichedList
  };
}

export default NextAPI(handler);
