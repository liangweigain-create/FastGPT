import { MongoApp } from '@fastgpt/service/core/app/schema';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  ReadPermissionVal,
  ManageRoleVal,
  OwnerRoleVal
} from '@fastgpt/global/support/permission/constant';

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

  await mongoSessionRun(async (session) => {
    // 1. Update old owner permission to Manage
    await MongoResourcePermission.updateOne(
      {
        resourceType: PerResourceTypeEnum.app,
        resourceId: appId,
        teamId,
        tmbId: app.tmbId
      },
      {
        $set: {
          permission: ManageRoleVal,
          teamId // Ensure teamId is set for upsert
        }
      },
      { session, upsert: true }
    );

    // 2. Update new owner permission to Owner
    await MongoResourcePermission.updateOne(
      {
        resourceType: PerResourceTypeEnum.app,
        resourceId: appId,
        teamId,
        tmbId: ownerId
      },
      {
        $set: {
          permission: OwnerRoleVal,
          teamId // Ensure teamId is set for upsert
        }
      },
      { session, upsert: true }
    );

    // 3. Update App Owner
    await MongoApp.findByIdAndUpdate(
      appId,
      {
        tmbId: ownerId
      },
      { session }
    );
  });
}

export default NextAPI(handler);
