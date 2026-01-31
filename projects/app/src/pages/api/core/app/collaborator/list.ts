import type { NextApiRequest, NextApiResponse } from 'next';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import type { CollaboratorListType } from '@fastgpt/global/support/permission/collaborator';
import { AppPermission } from '@fastgpt/global/support/permission/app/controller';
import { ManagePermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<CollaboratorListType> {
  const { appId } = req.query as { appId: string };

  if (!appId) {
    throw new Error('appId is required');
  }

  // Auth: check valid app and permission
  await authApp({
    req,
    authToken: true,
    appId,
    per: ManagePermissionVal
  });

  // Get resource permissions
  const permissions = await MongoResourcePermission.find({
    resourceType: PerResourceTypeEnum.app,
    resourceId: appId
  }).lean();

  const members = await MongoTeamMember.find({
    _id: { $in: permissions.map((p) => p.tmbId) }
  }).lean();

  const clbs = permissions
    .map((p) => {
      const member = members.find((m) => String(m._id) === String(p.tmbId));
      if (!member) return null;
      return {
        teamId: String(member.teamId),
        tmbId: String(member._id),
        permission: new AppPermission({
          role: p.permission,
          isOwner: false // Explicit permissions are not owners usually
        }),
        name: member.name,
        avatar: member.avatar
      };
    })
    .filter(Boolean) as any;

  console.log('API List Response:', JSON.stringify(clbs, null, 2));

  return {
    clbs,
    parentClbs: []
  };
}

export default NextAPI(handler);
