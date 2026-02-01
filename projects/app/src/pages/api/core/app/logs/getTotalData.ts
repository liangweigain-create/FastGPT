import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type {
  getTotalDataQuery,
  getTotalDataResponse
} from '@fastgpt/global/openapi/core/app/log/api';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';

/**
 * [Privatization] Local getTotalData API
 * Returns basic total statistics for the app.
 */
async function handler(req: any, res: any) {
  await authCert({ req, authToken: true });

  const { appId } = req.query as getTotalDataQuery;

  if (!appId) {
    throw new Error('appId is required');
  }

  // Get basic counts from MongoDB
  const totalChats = await MongoChat.countDocuments({ appId });

  // Get unique users count (outLinkUid for anonymous users, tmbId for team members)
  const uniqueUsers = await MongoChat.aggregate([
    { $match: { appId } },
    {
      $group: {
        _id: { $ifNull: ['$outLinkUid', '$tmbId'] }
      }
    },
    { $count: 'count' }
  ]);

  const response: getTotalDataResponse = {
    totalUsers: uniqueUsers[0]?.count || 0,
    totalChats,
    totalPoints: 0 // Points tracking not available in community version
  };

  return response;
}

export default NextAPI(handler);
