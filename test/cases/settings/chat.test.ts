import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MongoUser } from '../../../packages/service/support/user/schema';
import { MongoTeam } from '../../../packages/service/support/user/team/teamSchema';
import { MongoChatSetting } from '../../../packages/service/support/user/chat/schema';
import { MongoChatFavouriteApp } from '../../../packages/service/support/user/favourite/schema';
import {
  getChatSetting,
  updateChatSetting
} from '../../../packages/service/support/user/chat/controller';
import {
  getFavouriteApps,
  updateFavouriteApps,
  updateFavouriteAppOrder,
  updateFavouriteAppTags,
  deleteFavouriteApp
} from '../../../packages/service/support/user/favourite/controller';
import { MongoApp } from '../../../packages/service/core/app/schema';

describe('Chat Settings Service', () => {
  let userId: string;
  let teamId: string;
  let appId: string;

  beforeEach(async () => {
    // 1. Create User
    const user = await MongoUser.create({
      username: 'test-chat-setting-' + Date.now(),
      password: 'password'
    });
    userId = String(user._id);

    // 2. Create Team
    const team = await MongoTeam.create({
      name: 'Test Team',
      ownerId: userId
    });
    teamId = String(team._id);

    // 3. Create App
    const app = await MongoApp.create({
      teamId,
      tmbId: userId, // Mock tmbId as userId for simplicity
      name: 'Test App',
      avatar: '/icon/logo.svg',
      type: 'simple',
      modules: []
    });
    appId = String(app._id);
  });

  afterEach(async () => {
    // Rely on global setup for cleanup, but good to be explicit/safe or use independent data
  });

  it('should return default settings if not exists', async () => {
    const settings = await getChatSetting(teamId);
    expect(settings).toBeNull();
  });

  // ... (middle test passed)

  it('should manage favourite apps', async () => {
    // 1. Add/Update Favourite
    const favList = [
      {
        appId,
        order: 0,
        favouriteTags: ['tag1']
      }
    ];

    await updateFavouriteApps(teamId, favList);

    const list = await getFavouriteApps(teamId);
    expect(list).toHaveLength(1);
    // appId is populated, so we check _id property
    expect(String((list[0].appId as any)._id)).toBe(appId);
    expect(list[0].favouriteTags).toContain('tag1');

    // 2. Update Order
    await updateFavouriteAppOrder(teamId, [{ id: String(list[0]._id), order: 10 }]);
    const listOrdered = await getFavouriteApps(teamId);
    expect(listOrdered[0].order).toBe(10);

    // 3. Update Tags
    await updateFavouriteAppTags(teamId, [{ id: String(list[0]._id), tags: ['tag2'] }]);
    const listTagged = await getFavouriteApps(teamId);
    expect(listTagged[0].favouriteTags).toContain('tag2');
    expect(listTagged[0].favouriteTags).not.toContain('tag1');

    // 4. Delete
    await deleteFavouriteApp(teamId, String(list[0]._id));
    const listDeleted = await getFavouriteApps(teamId);
    expect(listDeleted).toHaveLength(0);
  });
});
