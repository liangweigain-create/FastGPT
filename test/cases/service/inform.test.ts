import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import {
  createInform,
  getInformsHandler,
  getUnreadCountHandler,
  readInformHandler
} from '../../../packages/service/support/user/inform/controller';
import { MongoUser } from '../../../packages/service/support/user/schema';
import { MongoUserInform } from '../../../packages/service/support/user/inform/schema';
import {
  InformLevelEnum,
  SendInformTemplateCodeEnum
} from '../../../packages/global/support/user/inform/constants';

describe('Inform Service', () => {
  let userId: string;

  beforeEach(async () => {
    // Create a dummy user for each test (since DB is dropped)
    const user = await MongoUser.create({
      username: 'test-inform-user-' + Date.now(),
      password: 'password'
    });
    userId = String(user._id);
  });

  afterAll(async () => {
    // No explicit cleanup needed as setup.ts handles DB drop
  });

  const createTestInform = async () => {
    await createInform({
      userId,
      teamId: userId,
      level: InformLevelEnum.common,
      templateCode: SendInformTemplateCodeEnum.CUSTOM,
      templateParam: { content: 'test content' }
    });
  };

  it('should create an inform', async () => {
    await createTestInform();
    const count = await MongoUserInform.countDocuments({ userId });
    expect(count).toBe(1);
  });

  it('should get informs list', async () => {
    await createTestInform();
    const { list, total } = await getInformsHandler({ userId, current: 1, pageSize: 10 });
    expect(total).toBe(1);
    expect(list[0].title).toBe(SendInformTemplateCodeEnum.CUSTOM);
  });

  it('should count unread', async () => {
    await createTestInform();
    const count = await getUnreadCountHandler(userId);
    expect(count).toBe(1);
  });

  it('should read inform', async () => {
    await createTestInform();
    const { list } = await getInformsHandler({ userId, current: 1, pageSize: 10 });
    const informId = String(list[0]._id);

    await readInformHandler({ userId, id: informId });

    const count = await getUnreadCountHandler(userId);
    expect(count).toBe(0);
  });
});
