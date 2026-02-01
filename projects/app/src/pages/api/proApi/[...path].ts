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

  // [Privatization] Return a generic success response to prevent UI crashes,
  // but with a clear message that this is a mock.
  jsonRes(res, {
    code: 200,
    message: `[Privatization] This feature depends on the Commercial API and has not been implemented locally yet. (Path: ${requestPath})`,
    data: {
      mock: true,
      hint: 'To implement this feature, create a local API route in projects/app/src/pages/api/...'
    }
  });
}
