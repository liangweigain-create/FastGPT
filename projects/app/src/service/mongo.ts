import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { createDefaultTeam } from '@fastgpt/service/support/user/team/controller';
import { exit } from 'process';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export async function initRootUser(retry = 3): Promise<any> {
  try {
    const rootUser = await MongoUser.findOne({
      username: 'root'
    });
    const psw = process.env.DEFAULT_ROOT_PSW || '123456';

    let rootId = rootUser?._id || '';

    await mongoSessionRun(async (session) => {
      // init root user
      if (rootUser) {
        await rootUser.updateOne({
          password: hashStr(psw)
        });
      } else {
        const [{ _id }] = await MongoUser.create(
          [
            {
              username: 'root',
              password: hashStr(psw)
            }
          ],
          { session, ordered: true }
        );
        rootId = _id;
      }
      // init root team
      await createDefaultTeam({ userId: rootId, session });
    });

    console.log(`root user init:`, {
      username: 'root',
      password: psw
    });
  } catch (error) {
    if (retry > 0) {
      console.log('retry init root user');
      return initRootUser(retry - 1);
    } else {
      console.error('init root user error', error);
      exit(1);
    }
  }
}

export async function initSystemUsers(retry = 3): Promise<any> {
  const users = [
    { username: 'user1', password: '123' },
    { username: 'user2', password: '123' },
    { username: 'user3', password: '123' }
  ];

  try {
    const rootUser = await MongoUser.findOne({ username: 'root' });
    if (!rootUser) {
      console.log('Root user not found, skip init system users');
      return;
    }

    // Find root user's team
    const rootMember = await MongoTeamMember.findOne({ userId: rootUser._id, role: 'owner' });
    if (!rootMember) {
      console.log('Root team not found, skip init system users');
      return;
    }
    const teamId = rootMember.teamId;

    await mongoSessionRun(async (session) => {
      for (const user of users) {
        let userObj = await MongoUser.findOne({ username: user.username });
        if (userObj) {
          await userObj.updateOne({ password: hashStr(user.password) }, { session });
        } else {
          const [newUser] = await MongoUser.create(
            [{ username: user.username, password: hashStr(user.password) }],
            { session }
          );
          userObj = newUser;
        }

        // Check if user is in the root team
        const member = await MongoTeamMember.findOne({ teamId, userId: userObj._id });
        if (!member) {
          await MongoTeamMember.create(
            [
              {
                teamId,
                userId: userObj._id,
                name: user.username,
                role: 'owner',
                status: 'active',
                createTime: new Date()
              }
            ],
            { session }
          );
          console.log(`User ${user.username} - Added to root team`);
        } else {
          // Fix existing user role
          if (member.role !== 'owner') {
            await MongoTeamMember.updateOne(
              { _id: member._id },
              { $set: { role: 'owner' } },
              { session }
            );
            console.log(`User ${user.username} - Role updated to owner`);
          }
        }
      }
    });

    // Update root team limits
    const { MongoTeamSub } = require('@fastgpt/service/support/wallet/sub/schema');
    const { SubTypeEnum } = require('@fastgpt/global/support/wallet/sub/constants');

    await MongoTeamSub.updateOne(
      { teamId, type: SubTypeEnum.standard },
      {
        $set: {
          maxTeamMember: 1000,
          maxApp: 1000,
          maxDataset: 1000,
          totalPoints: 999999999,
          surplusPoints: 999999999
        }
      }
    );
    console.log('Root team limits updated to 1000');

    console.log('System users init success');
  } catch (error) {
    if (retry > 0) {
      console.log('retry init system users');
      return initSystemUsers(retry - 1);
    } else {
      console.error('init system users error', error);
    }
  }
}
