import { NextAPI } from '@/service/middleware/entry';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

async function handler(req: any, res: any) {
  // Accept both 'linkId' and 'invitelinkid' for backwards compatibility
  const linkId = (req.query.linkId || req.query.invitelinkid) as string;

  if (!linkId) {
    throw new Error('linkId is required');
  }

  const link = await MongoInvitationLink.findOne({ linkId }).lean();

  if (!link) {
    throw new Error('Link not found');
  }

  if (link.expires < new Date() || link.forbidden) {
    throw new Error('Link invalid or expired');
  }

  if ((link.usedTimesLimit ?? -1) !== -1 && link.members.length >= (link.usedTimesLimit ?? -1)) {
    throw new Error('Link limit reached');
  }

  const team = await MongoTeam.findById(link.teamId, 'name avatar').lean();

  if (!team) {
    throw new Error('Team not found');
  }

  return {
    ...link,
    teamName: team.name,
    teamAvatar: team.avatar
  };
}

export default NextAPI(handler);
