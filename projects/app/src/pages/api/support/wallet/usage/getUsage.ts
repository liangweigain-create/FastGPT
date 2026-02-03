import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { MongoUsageItem } from '@fastgpt/service/support/wallet/usage/usageItemSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import type { UsageListItemType } from '@fastgpt/global/support/wallet/usage/type';
import { NextAPI } from '@/service/middleware/entry';
import type { GetUsageProps } from '@fastgpt/global/support/wallet/usage/api.d';
import type { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import dayjs from 'dayjs';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<PaginationResponse<UsageListItemType>> {
  const {
    current = 1,
    pageSize = 20,
    dateStart,
    dateEnd,
    sources,
    teamMemberIds,
    projectName
  } = req.body as GetUsageProps & {
    current: number;
    pageSize: number;
  };

  const { teamId } = await authCert({
    req,
    authToken: true
  });

  const match = {
    teamId,
    time: {
      $gte: new Date(dateStart),
      $lte: new Date(dateEnd)
    },
    ...(sources && sources.length > 0 && { source: { $in: sources } }),
    ...(teamMemberIds && teamMemberIds.length > 0 && { tmbId: { $in: teamMemberIds } }),
    ...(projectName && { appName: new RegExp(projectName, 'i') })
  };

  const [total, usages] = await Promise.all([
    MongoUsage.countDocuments(match),
    MongoUsage.find(match)
      .sort({ time: -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean()
  ]);

  const usageIds = usages.map((u) => u._id);
  const tmbIds = usages.map((u) => u.tmbId);

  // Parallel fetch: usage items and members
  const [usageItems, members, users] = await Promise.all([
    MongoUsageItem.find({ usageId: { $in: usageIds } }).lean(),
    MongoTeamMember.find({ _id: { $in: tmbIds } }).lean(),
    // Also fetch users for avatar/name if member not found or for fallback
    MongoUser.find({
      _id: { $in: usages.map((u) => u.tmbId) } // tmbId technically refers to TeamMember, but let's double check if we need user info
    }).lean()
  ]);

  // Note: tmbId in MongoUsage refers to MongoTeamMember._id
  // We need to map tmbId -> Member Info
  // If member is deleted, we might need some fallback or it will be null

  const memberMap = new Map(members.map((m) => [String(m._id), m]));
  const itemMap = new Map<string, typeof usageItems>();

  usageItems.forEach((item) => {
    const usageId = String(item.usageId);
    if (!itemMap.has(usageId)) {
      itemMap.set(usageId, []);
    }
    itemMap.get(usageId)?.push(item);
  });

  const list: UsageListItemType[] = usages.map((u) => {
    const member = memberMap.get(String(u.tmbId));

    // Fallback source member if member not found (e.g. deleted)
    const sourceMember = member
      ? {
          tmbId: String(member._id),
          name: member.name,
          avatar: member.avatar,
          status: member.status
        }
      : {
          tmbId: String(u.tmbId),
          name: 'Unknown',
          avatar: '',
          status: 'leave' as any // Fallback status
        };

    const items = itemMap.get(String(u._id)) || [];

    return {
      id: String(u._id),
      time: u.time,
      appName: u.appName,
      source: u.source,
      totalPoints: u.totalPoints,
      list: items.map((item) => ({
        ...item,
        moduleName: item.name // UsageItemSchema uses 'name', Type uses 'moduleName'
      })),
      sourceMember
    };
  });

  return {
    total,
    list
  };
}

export default NextAPI(handler);
