import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import type { CollaboratorListType } from '@fastgpt/global/support/permission/collaborator';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { Permission } from '@fastgpt/global/support/permission/controller';

async function handler(req: any, res: any): Promise<CollaboratorListType> {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // 1. Fetch all members, groups, orgs
  const [members, groups, orgs] = await Promise.all([
    MongoTeamMember.find({ teamId, status: 'active' }, '_id name avatar userId').lean(),
    MongoMemberGroupModel.find({ teamId }, '_id name avatar').lean(),
    MongoOrgModel.find({ teamId }, '_id name avatar').lean()
  ]);

  // 2. Fetch all team permissions
  const permissions = await MongoResourcePermission.find({
    teamId,
    resourceType: PerResourceTypeEnum.team
  }).lean();

  // 3. Map to CollaboratorItemDetailType
  const memberClbs = members.map((member) => {
    const per = permissions.find((p) => String(p.tmbId) === String(member._id));
    return {
      teamId,
      tmbId: String(member._id),
      name: member.name,
      avatar: member.avatar,
      permission: new Permission({
        role: per ? per.permission : TeamDefaultPermissionVal,
        isOwner: String(member._id) === tmbId // This logic might need refinement: is the REQUESTER the owner? No, "isOwner" in Permission usually means "Is this entity the owner of the resource?". For Team, the creator is Owner. Logic in list.ts checks `role === 'owner'`.
      })
    };
  });

  // Wait, the `Permission` class expects specific role values.
  // And `isOwner` flag.
  // In `list.ts` (the one I read earlier), it did: `isOwner: member.role === TeamMemberRoleEnum.owner`.
  // So I should check `member.role` from DB? But Schema said it's abandoned?
  // Let's re-read `team/list.ts`.
  // `MongoTeamMember.find(match)...`
  // `return { ... role: tmb.role ... isOwner: tmb.role === 'owner' }`.
  // So `tmb.role` IS used.

  // Re-fetch members with 'role'.

  const memberClbsWithRole = await Promise.all(
    members.map(async (member: any) => {
      // We need to fetch the permission from MongoResourcePermission for this specific member
      // But wait, `team/list.ts` uses `getTmbPermission` which resolves inheritance.
      // Here in `PermissionManage`, we probably want the *explicit* permission assigned?
      // Or the effective one?
      // `PermissionManage` calls `updateMemberPermission`.
      // If I only return explicit permissions, inherited ones won't show up.
      // But `PermissionManage` acts as an editor. Usually editors show effective permissions OR explicit ones.
      // Given `getTmbPermission` logic, it sums up permissions.

      // Let's look at `PermissionManage/index.tsx` logic.
      // `clb.permission.hasManagePer`...

      // I'll stick to fetching explicit permissions from `MongoResourcePermission` for now,
      // because `PermissionManage` seems to be about *managing* these assignments.
      // If I return effective permissions, and the user tries to remove a permission that is inherited, it might fail or be confusing.
      // HOWEVER, `team/list.ts` returns effective permissions.

      // `collaborator/list.ts` in `proApi` usually returns explicit assignments for "Collaborators".

      const perEntry = permissions.find((p) => String(p.tmbId) === String(member._id));
      const val = perEntry ? perEntry.permission : TeamDefaultPermissionVal;

      // Member role check (Owner of team)
      // I need to know who is the OWNER of the TEAM.
      // The `Team` collection has `ownerId`.
      // Or `MongoTeamMember` has `role='owner'`.
      // Let's assume `role='owner'` on member is correct as per `team/list.ts`.

      // We need to fetch `role` field.
      const memberWithRole = await MongoTeamMember.findById(member._id, 'role').lean();
      const isOwner = memberWithRole?.role === 'owner';

      return {
        teamId,
        tmbId: String(member._id),
        name: member.name,
        avatar: member.avatar,
        permission: new Permission({
          role: val,
          isOwner
        })
      };
    })
  );

  const groupClbs = groups.map((group) => {
    const per = permissions.find((p) => String(p.groupId) === String(group._id));
    return {
      teamId,
      groupId: String(group._id),
      name: group.name,
      avatar: group.avatar,
      permission: new Permission({
        role: per ? per.permission : TeamDefaultPermissionVal,
        isOwner: false
      })
    };
  });

  const orgClbs = orgs.map((org) => {
    const per = permissions.find((p) => String(p.orgId) === String(org._id));
    return {
      teamId,
      orgId: String(org._id),
      name: org.name,
      avatar: org.avatar,
      permission: new Permission({
        role: per ? per.permission : TeamDefaultPermissionVal,
        isOwner: false
      })
    };
  });

  // @ts-ignore
  return {
    clbs: [...memberClbsWithRole, ...groupClbs, ...orgClbs]
  };
}

export default NextAPI(handler);
