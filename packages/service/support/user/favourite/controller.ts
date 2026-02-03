import { MongoChatFavouriteApp } from './schema';
import type { ChatFavouriteAppModelType } from '@fastgpt/global/core/chat/favouriteApp/type';

export async function getFavouriteApps(teamId: string) {
  return MongoChatFavouriteApp.find({ teamId })
    .sort({ order: 1 })
    .populate('appId', 'name avatar type intro')
    .lean();
}

export async function updateFavouriteApps(
  teamId: string,
  list: Partial<ChatFavouriteAppModelType>[]
) {
  // Simple implementation: delete all and recreate (not efficient but functionally correct for MVP)
  // Or upsert one by one. given the list is usually small.
  // Plan:
  // 1. Remove all for this team (or better, intelligent diff)
  // 2. Insert new ones
  
  if (!list || list.length === 0) {
    // If empty list, clear all
    await MongoChatFavouriteApp.deleteMany({ teamId });
    return;
  }

  // Transaction for atomicity recommended but optional for MVP
  // 1. Delete all existing for this team
    await MongoChatFavouriteApp.deleteMany({ teamId });
  
  // 2. Insert new ones
  const docs = list.map((item) => ({
    teamId,
    appId: item.appId,
    favouriteTags: item.favouriteTags || [],
    order: item.order
  }));

  await MongoChatFavouriteApp.insertMany(docs);
}

export async function updateFavouriteAppOrder(
  teamId: string,
  list: { id: string; order: number }[]
) {
  const ops = list.map((item) => ({
    updateOne: {
      filter: { _id: item.id, teamId },
      update: { $set: { order: item.order } }
    }
  }));
  await MongoChatFavouriteApp.bulkWrite(ops);
}

export async function updateFavouriteAppTags(
  teamId: string,
  list: { id: string; tags: string[] }[]
) {
  const ops = list.map((item) => ({
    updateOne: {
      filter: { _id: item.id, teamId },
      update: { $set: { favouriteTags: item.tags } }
    }
  }));
  await MongoChatFavouriteApp.bulkWrite(ops);
}

export async function deleteFavouriteApp(teamId: string, id: string) {
  await MongoChatFavouriteApp.deleteOne({ _id: id, teamId });
}
