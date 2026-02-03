import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { MongoUsageItem } from '@fastgpt/service/support/wallet/usage/usageItemSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextAPI } from '@/service/middleware/entry';
import { generateCsv } from '@fastgpt/service/common/file/csv';
import dayjs from 'dayjs';
import { formatNumber } from '@fastgpt/global/common/math/tools';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const {
    dateStart,
    dateEnd,
    sources,
    teamMemberIds,
    projectName,
    appNameMap = {},
    sourcesMap = {}
  } = req.body as {
    dateStart: string;
    dateEnd: string;
    sources?: string[];
    teamMemberIds?: string[];
    projectName?: string;
    appNameMap?: Record<string, string>;
    sourcesMap?: Record<string, { label: string }>;
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

  const usages = await MongoUsage.find(match).sort({ time: -1 }).lean();

  const usageIds = usages.map((u) => u._id);
  const tmbIds = usages.map((u) => u.tmbId);

  const [usageItems, members] = await Promise.all([
    MongoUsageItem.find({ usageId: { $in: usageIds } }).lean(),
    MongoTeamMember.find({ _id: { $in: tmbIds } }).lean()
  ]);

  const memberMap = new Map(members.map((m) => [String(m._id), m]));
  const itemMap = new Map<string, typeof usageItems>();

  usageItems.forEach((item) => {
    const usageId = String(item.usageId);
    if (!itemMap.has(usageId)) {
      itemMap.set(usageId, []);
    }
    itemMap.get(usageId)?.push(item);
  });

  const data: string[][] = [];

  // Headers
  const headers = [
    'Time',
    'Member',
    'Source',
    'App Name',
    'Module Name',
    'Model',
    'Input Tokens',
    'Output Tokens',
    'Total Points'
  ];

  usages.forEach((u) => {
    const member = memberMap.get(String(u.tmbId));
    const memberName = member ? member.name : 'Unknown';
    const items = itemMap.get(String(u._id)) || [];

    const timeStr = dayjs(u.time).format('YYYY-MM-DD HH:mm:ss');
    const sourceLabel = sourcesMap[u.source]?.label || u.source;
    const appNameLabel = appNameMap[u.appName] || u.appName;

    if (items.length === 0) {
      data.push([
        timeStr,
        memberName,
        sourceLabel,
        appNameLabel,
        '-',
        '-',
        '-',
        '-',
        String(formatNumber(u.totalPoints))
      ]);
    } else {
      items.forEach((item) => {
        data.push([
          timeStr,
          memberName,
          sourceLabel,
          appNameLabel,
          appNameMap[item.name] || item.name,
          item.model || '-',
          item.inputTokens !== undefined ? String(item.inputTokens) : '-',
          item.outputTokens !== undefined ? String(item.outputTokens) : '-',
          String(formatNumber(item.amount))
        ]);
      });
    }
  });

  const csv = generateCsv(headers, data);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=usage.csv');
  res.send(csv);
}

export default NextAPI(handler);
