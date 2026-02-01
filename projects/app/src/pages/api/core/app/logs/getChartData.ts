import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type {
  getChartDataBody,
  getChartDataResponse
} from '@fastgpt/global/openapi/core/app/log/api';

/**
 * [Privatization] Local getChartData API
 * Returns empty chart data structure to prevent UI errors.
 * TODO: Implement actual aggregation from MongoChatItem when needed.
 */
async function handler(req: any, res: any) {
  await authCert({ req, authToken: true });

  const { appId, dateStart, dateEnd, source, offset, userTimespan, chatTimespan, appTimespan } =
    req.body as getChartDataBody;

  // Return empty but properly structured data
  const response: getChartDataResponse = {
    userData: [],
    chatData: [],
    appData: []
  };

  return response;
}

export default NextAPI(handler);
