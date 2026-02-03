import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.unmock('@fastgpt/service/common/mongo/init');

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
import { connectMongo } from '../../../packages/service/common/mongo/init';
import { connectionMongo, MONGO_URL } from '../../../packages/service/common/mongo';

const connectToDatabase = async () => {
  try {
    await connectionMongo.disconnect();
  } catch (e) {}
  await connectMongo({
    db: connectionMongo,
    url: 'mongodb://127.0.0.1:27017/fastgpt_test?directConnection=true'
  });
};

const closeDatabase = async () => {
  //  await connectionMongo.disconnect(); // connectionMongo doesn't have disconnect on top level, accessible via connection
  await connectionMongo.connection.close();
};

describe('Inform Service', () => {
  let userId: string;

  beforeAll(async () => {
    await connectToDatabase();
    // Create a dummy user
    const user = await MongoUser.create({
      username: 'test-inform-user',
      password: 'password'
    });
    userId = String(user._id);
  });

  afterAll(async () => {
    await MongoUser.deleteOne({ _id: userId });
    await MongoUserInform.deleteMany({ userId });
    await closeDatabase();
  });

  it('should create an inform', async () => {
    await createInform({
      userId,
      teamId: '',
      level: InformLevelEnum.common,
      templateCode: SendInformTemplateCodeEnum.CUSTOM,
      templateParam: { content: 'test content' }
    });

    const count = await MongoUserInform.countDocuments({ userId });
    expect(count).toBe(1);
  });

  it('should get informs list', async () => {
    const { list, total } = await getInformsHandler({ userId, current: 1, pageSize: 10 });
    expect(total).toBe(1);
    expect(list[0].title).toBe(SendInformTemplateCodeEnum.CUSTOM);
  });

  it('should count unread', async () => {
    const count = await getUnreadCountHandler(userId);
    expect(count).toBe(1);
  });

  it('should read inform', async () => {
    const { list } = await getInformsHandler({ userId, current: 1, pageSize: 10 });
    const informId = String(list[0]._id);

    await readInformHandler({ userId, id: informId });

    const count = await getUnreadCountHandler(userId);
    expect(count).toBe(0);
  });
});
