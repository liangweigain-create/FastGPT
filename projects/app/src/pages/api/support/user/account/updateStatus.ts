/**
 * [Privatization] ROOT-only API to enable/disable user accounts.
 * Disabled users cannot login but retain all their data.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

export type UpdateUserStatusBody = {
  userId: string;
  status: `${UserStatusEnum}`;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, status } = req.body as UpdateUserStatusBody;

  if (!userId || !status) {
    return Promise.reject(CommonErrEnum.invalidParams);
  }

  // [Privatization] Only ROOT user can update user status
  const { isRoot, teamId, tmbId } = await authCert({ req, authToken: true });
  if (!isRoot) {
    return Promise.reject('Permission denied: Only ROOT user can perform this action');
  }

  // Find target user
  const targetUser = await MongoUser.findById(userId);
  if (!targetUser) {
    return Promise.reject('User not found');
  }

  // [Privatization] Prevent ROOT from disabling themselves
  if (targetUser.username === 'root' && status === UserStatusEnum.forbidden) {
    return Promise.reject('Cannot disable ROOT user');
  }

  // Update status
  targetUser.status = status;
  await targetUser.save();

  // [Privatization] Log audit event
  addAuditLog({
    tmbId,
    teamId,
    event:
      status === UserStatusEnum.forbidden
        ? AuditEventEnum.FORBIDDEN_MEMBER
        : AuditEventEnum.UNFORBIDDEN_MEMBER,
    params: {
      targetUsername: targetUser.username
    }
  });

  return { success: true };
}

export default NextAPI(handler);
