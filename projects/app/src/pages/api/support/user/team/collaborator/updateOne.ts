import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { Permission } from '@fastgpt/global/support/permission/controller';
import { checkCanUpdatePermission } from '@fastgpt/service/support/permission/auth/validation';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  const {
    tmbId: targetTmbId,
    groupId,
    orgId,
    permission: permissionVal
  } = req.body as {
    tmbId?: string;
    groupId?: string;
    orgId?: string;
    permission: number;
  };

  if (!targetTmbId && !groupId && !orgId) throw new Error('Missing ID');

  // 1. Get operator info
  const operator = await MongoTeamMember.findOne({ teamId, _id: tmbId }).lean();
  if (!operator) throw new Error('Operator not found');

  const operatorPermission = await getTmbPermission({
    teamId,
    tmbId,
    resourceType: PerResourceTypeEnum.team,
    resourceId: undefined
  });
  const opPermission = new Permission({
    role: operatorPermission,
    isOwner: operator.role === TeamMemberRoleEnum.owner
  });

  // 2. Validate permission update
  if (targetTmbId) {
    const targetMember = await MongoTeamMember.findOne({
      teamId,
      _id: targetTmbId
    }).lean();
    if (!targetMember) throw new Error('Member not found');

    const targetPermissionVal = await getTmbPermission({
      teamId,
      tmbId: targetTmbId,
      resourceType: PerResourceTypeEnum.team,
      resourceId: undefined
    });
    const targetPermission = new Permission({
      role: targetPermissionVal,
      isOwner: targetMember.role === TeamMemberRoleEnum.owner
    });

    const updatePermission = new Permission({ role: permissionVal });

    if (
      !checkCanUpdatePermission({
        operatorTmbId: tmbId,
        operatorRole: (operator.role || TeamMemberRoleEnum.member) as TeamMemberRoleEnum,
        operatorPermission: opPermission,
        targetTmbId: targetTmbId,
        targetRole: (targetMember.role || TeamMemberRoleEnum.member) as TeamMemberRoleEnum,
        targetPermission: targetPermission,
        updatePermission
      })
    ) {
      throw new Error('Permission denied');
    }
  } else if (groupId) {
    if (!opPermission.hasManagePer) {
      throw new Error('Permission denied');
    }
  } else if (orgId) {
    if (!opPermission.hasManagePer) {
      throw new Error('Permission denied');
    }
  }

  await MongoResourcePermission.updateOne(
    {
      teamId,
      resourceType: PerResourceTypeEnum.team,
      tmbId: targetTmbId,
      groupId,
      orgId
    },
    {
      permission: permissionVal
    },
    { upsert: true }
  );
}

export default NextAPI(handler);
