import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { NextAPI } from '@/service/middleware/entry';
import type {
  GetUsageDashboardProps,
  GetUsageDashboardResponseItem
} from '@fastgpt/global/support/wallet/usage/api.d';
import dayjs from 'dayjs';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<GetUsageDashboardResponseItem[]> {
  const { dateStart, dateEnd, sources, teamMemberIds, projectName } =
    req.body as GetUsageDashboardProps;

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

  // Aggregate daily points
  const result = await MongoUsage.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$time', timezone: 'Asia/Shanghai' }
        },
        totalPoints: { $sum: '$totalPoints' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return result.map((item) => ({
    date: item._id,
    totalPoints: item.totalPoints
  }));
}

export default NextAPI(handler);
