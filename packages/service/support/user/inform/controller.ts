import { MongoUserInform } from './schema';
import type { SendInform2UserProps } from '@fastgpt/global/support/user/inform/type';
import { addLog } from '../../../common/system/log';
import { MongoTeam } from '../team/teamSchema';

export async function createInform(data: SendInform2UserProps & { userId: string }) {
  try {
    await MongoUserInform.create({
      userId: data.userId,
      teamId: data.teamId,
      level: data.level,
      title: data.templateCode, // Simplified title using template code for now
      content: JSON.stringify(data.templateParam) // Store params as content or format it? 
    });
  } catch (error) {
    addLog.error('createInform error', error);
  }
}

// Formatting title/content usually happens on frontend or using templates.
// For now, let's just store simple data. 
// Ideally we should process templateCode + templateParam into localized text.

/* 
  Since we don't have the template engine here, allow passing explicit title/content 
  or fallback to simplified string.
*/

export const getInformsHandler = async ({
  userId,
  current = 1,
  pageSize = 20
}: {
  userId: string;
  current: number;
  pageSize: number;
}) => {
  const match = { userId };
  const [total, list] = await Promise.all([
    MongoUserInform.countDocuments(match),
    MongoUserInform.find(match)
      .sort({ time: -1 })
      .skip((current - 1) * pageSize)
      .limit(pageSize)
      .lean()
  ]);

  const teamIds = list.map((item) => item.teamId).filter(Boolean);
  const teams = await MongoTeam.find({ _id: { $in: teamIds } }, 'name icon').lean();

  return {
    total,
    list: list.map((item) => {
      const team = teams.find((t: any) => String(t._id) === String(item.teamId));
      return {
        ...item,
        teamName: team?.name
      };
    })
  };
};

export const getUnreadCountHandler = async (userId: string) => {
  const count = await MongoUserInform.countDocuments({
    userId,
    read: false
  });
  return count;
};

export const readInformHandler = async ({ userId, id }: { userId: string; id: string }) => {
  await MongoUserInform.updateOne(
    {
      _id: id,
      userId
    },
    {
      read: true
    }
  );
};
