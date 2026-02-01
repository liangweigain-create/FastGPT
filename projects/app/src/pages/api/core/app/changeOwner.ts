import { MongoApp } from '@fastgpt/service/core/app/schema';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';

export type AppChangeOwnerBody = {
  appId: string;
  ownerId: string;
};

async function handler(req: ApiRequestProps<AppChangeOwnerBody>) {
  const { appId, ownerId } = req.body;

  // 1. Auth: User must be the current owner to transfer ownership
  const { app, teamId } = await authApp({
    req,
    authToken: true,
    appId,
    per: ReadPermissionVal // Base permission to read the app
  });

  if (!app.permission.isOwner) {
    throw new Error('Only the owner can transfer the app');
  }

  if (String(ownerId) === String(app.tmbId)) {
    return;
  }

  // 2. Validate new owner
  const newOwner = await MongoTeamMember.findOne({
    _id: ownerId,
    teamId
  });

  if (!newOwner) {
    throw new Error('Member not found in this team');
  }

  // 3. Execute in transaction
  await mongoSessionRun(async (session) => {
    // A. Update App Owner
    await MongoApp.findByIdAndUpdate(
      appId,
      {
        tmbId: ownerId
      },
      { session }
    );

    // B. Clean up new owner's previous permission (if they were a collaborator)
    // Since they are now the owner, they don't need explicit permission records.
    await MongoResourcePermission.deleteOne(
      {
        resourceType: PerResourceTypeEnum.app,
        resourceId: appId,
        tmbId: ownerId
      },
      { session }
    );
  });
}

export default NextAPI(handler);
