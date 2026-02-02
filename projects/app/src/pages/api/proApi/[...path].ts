import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = [], ...query } = req.query as any;
  const requestPath = `/proApi/${path?.join('/')}`;
  const method = req.method;

  // [Privatization] Log the blocked/mocked request for debugging
  console.warn(`[Privatization Mock] triggered: ${method} ${requestPath}`, {
    query,
    body: req.body
  });

  // Determine mock response based on path
  let responseData: any = {
    mock: true,
    hint: 'To implement this feature, create a local API route in projects/app/src/pages/api/...'
  };

  if (requestPath.includes('/support/wallet/usage/getUsage')) {
    responseData = {
      list: [],
      total: 0
    };
  } else if (requestPath.includes('/support/wallet/usage/getDashboardData')) {
    responseData = [];
  } else if (requestPath.includes('/support/user/team/plan/getTeamPlans')) {
    responseData = [];
  } else if (requestPath.includes('/support/user/team/member/count')) {
    responseData = { count: 1 };
  } else if (requestPath.includes('/core/dataset/file/read')) {
    responseData = '# Mock File Content';
  }

  // [Privatization] Return a generic success response to prevent UI crashes,
  // but with a clear message that this is a mock.
  jsonRes(res, {
    code: 200,
    message: `[Privatization] This feature depends on the Commercial API and has not been implemented locally yet. (Path: ${requestPath})`,
    data: responseData
  });
}
