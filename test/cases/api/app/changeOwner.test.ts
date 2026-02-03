import type { AppChangeOwnerBody } from '@/pages/api/core/app/changeOwner';
import changeOwnerAPI from '@/pages/api/core/app/changeOwner';
import type { CreateAppBody } from '@/pages/api/core/app/create';
import createAppAPI from '@/pages/api/core/app/create';
import listAPI from '@/pages/api/core/app/collaborator/list';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import {
  ManageRoleVal,
  OwnerRoleVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import type { CollaboratorListType } from '@fastgpt/global/support/permission/collaborator';
import { TeamAppCreatePermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { getFakeUsers } from '@test/datas/users';
import { Call } from '@test/utils/request';
import { describe, expect, it } from 'vitest';

describe('POST /api/core/app/changeOwner', () => {
  it('should downgrade old owner to Manage and upgrade new owner to Owner', async () => {
    // Setup: Create users and grant permission (must be done in each test due to DB cleanup)
    const users = await getFakeUsers(3);
    await MongoResourcePermission.findOneAndUpdate(
      {
        resourceType: 'team',
        teamId: users.members[0].teamId,
        resourceId: null,
        tmbId: users.members[0].tmbId
      },
      {
        permission: TeamAppCreatePermissionVal
      },
      { upsert: true }
    );

    // Arrange: Create app with members[0] as owner
    const createRes = await Call<CreateAppBody, {}, string>(createAppAPI, {
      auth: users.members[0],
      body: {
        modules: [],
        name: 'test-change-owner-app',
        type: AppTypeEnum.simple
      }
    });
    expect(createRes.error).toBeUndefined();
    expect(createRes.code).toBe(200);
    expect(createRes.data).toBeDefined();
    const appId = createRes.data;

    const oldOwnerTmbId = users.members[0].tmbId;
    const newOwnerTmbId = users.members[1].tmbId;

    // Act: Call changeOwner API
    const changeRes = await Call<AppChangeOwnerBody, {}, void>(changeOwnerAPI, {
      auth: users.members[0],
      body: {
        appId,
        ownerId: newOwnerTmbId
      }
    });
    expect(changeRes.error).toBeUndefined();
    expect(changeRes.code).toBe(200);

    // Assert: Check DB state
    // 1. Old owner should have ManageRoleVal
    const oldOwnerPer = await MongoResourcePermission.findOne({
      resourceType: PerResourceTypeEnum.app,
      resourceId: appId,
      tmbId: oldOwnerTmbId
    }).lean();
    expect(oldOwnerPer).toBeDefined();
    expect(oldOwnerPer?.permission).toBe(ManageRoleVal);

    // 2. New owner should have OwnerRoleVal
    const newOwnerPer = await MongoResourcePermission.findOne({
      resourceType: PerResourceTypeEnum.app,
      resourceId: appId,
      tmbId: newOwnerTmbId
    }).lean();
    expect(newOwnerPer).toBeDefined();
    expect(newOwnerPer?.permission).toBe(OwnerRoleVal);

    // 3. App.tmbId should be updated
    const updatedApp = await MongoApp.findById(appId).lean();
    expect(updatedApp).toBeDefined();
    expect(String(updatedApp?.tmbId)).toBe(newOwnerTmbId);
  });

  it('should reject if caller is not the owner', async () => {
    // Setup
    const users = await getFakeUsers(3);
    await MongoResourcePermission.findOneAndUpdate(
      {
        resourceType: 'team',
        teamId: users.members[0].teamId,
        resourceId: null,
        tmbId: users.members[0].tmbId
      },
      {
        permission: TeamAppCreatePermissionVal
      },
      { upsert: true }
    );

    // Arrange: Create app with members[0] as owner
    const createRes = await Call<CreateAppBody, {}, string>(createAppAPI, {
      auth: users.members[0],
      body: {
        modules: [],
        name: 'test-change-owner-reject',
        type: AppTypeEnum.simple
      }
    });
    expect(createRes.error).toBeUndefined();
    expect(createRes.code).toBe(200);
    expect(createRes.data).toBeDefined();
    const appId = createRes.data;

    // Act: Non-owner (members[2]) tries to transfer
    const changeRes = await Call<AppChangeOwnerBody, {}, void>(changeOwnerAPI, {
      auth: users.members[2], // Not the owner
      body: {
        appId,
        ownerId: users.members[1].tmbId
      }
    });

    // Assert: Should fail
    expect(changeRes.code).not.toBe(200);
  });

  it('should do nothing if new owner is same as current owner', async () => {
    // Setup
    const users = await getFakeUsers(3);
    await MongoResourcePermission.findOneAndUpdate(
      {
        resourceType: 'team',
        teamId: users.members[0].teamId,
        resourceId: null,
        tmbId: users.members[0].tmbId
      },
      {
        permission: TeamAppCreatePermissionVal
      },
      { upsert: true }
    );

    // Arrange: Create app with members[0] as owner
    const createRes = await Call<CreateAppBody, {}, string>(createAppAPI, {
      auth: users.members[0],
      body: {
        modules: [],
        name: 'test-change-owner-self',
        type: AppTypeEnum.simple
      }
    });
    expect(createRes.error).toBeUndefined();
    expect(createRes.code).toBe(200);
    expect(createRes.data).toBeDefined();
    const appId = createRes.data;

    // Act: Owner transfers to self
    const changeRes = await Call<AppChangeOwnerBody, {}, void>(changeOwnerAPI, {
      auth: users.members[0],
      body: {
        appId,
        ownerId: users.members[0].tmbId
      }
    });

    // Assert: Should succeed without error (noop)
    expect(changeRes.code).toBe(200);

    // App.tmbId should remain unchanged
    const updatedApp = await MongoApp.findById(appId).lean();
    expect(String(updatedApp?.tmbId)).toBe(users.members[0].tmbId);
  });

  it('should return new owner with isOwner=true in list API', async () => {
    // Setup: Create users and grant permission
    const users = await getFakeUsers(3);
    await MongoResourcePermission.findOneAndUpdate(
      {
        resourceType: 'team',
        teamId: users.members[0].teamId,
        resourceId: null,
        tmbId: users.members[0].tmbId
      },
      {
        permission: TeamAppCreatePermissionVal
      },
      { upsert: true }
    );

    // Arrange: Create app with members[0] as owner
    const createRes = await Call<CreateAppBody, {}, string>(createAppAPI, {
      auth: users.members[0],
      body: {
        modules: [],
        name: 'test-change-owner-list-api',
        type: AppTypeEnum.simple
      }
    });
    expect(createRes.error).toBeUndefined();
    expect(createRes.code).toBe(200);
    const appId = createRes.data;

    const newOwnerTmbId = users.members[1].tmbId;

    // Act: Transfer ownership
    const changeRes = await Call<AppChangeOwnerBody, {}, void>(changeOwnerAPI, {
      auth: users.members[0],
      body: {
        appId,
        ownerId: newOwnerTmbId
      }
    });
    expect(changeRes.error).toBeUndefined();
    expect(changeRes.code).toBe(200);

    // Assert: Call list API and check isOwner
    const listRes = await Call<{}, { appId: string }, CollaboratorListType>(listAPI, {
      auth: users.members[1], // New owner should be able to read
      query: { appId }
    });
    expect(listRes.error).toBeUndefined();
    expect(listRes.code).toBe(200);
    expect(listRes.data).toBeDefined();

    // Find new owner in collaborators list
    const newOwnerClb = listRes.data!.clbs.find((clb) => clb.tmbId === newOwnerTmbId);
    expect(newOwnerClb).toBeDefined();
    expect(newOwnerClb!.permission.isOwner).toBe(true);
    expect(newOwnerClb!.permission.role).toBe(OwnerRoleVal);
  });
});
