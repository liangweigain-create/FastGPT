import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import { Permission } from '@fastgpt/global/support/permission/controller';
import { checkCanRemovePermission } from '@fastgpt/service/support/permission/auth/validation';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  // 1. Get operator info
  const operator = await MongoTeamMember.findById(tmbId).lean();
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

  const {
    tmbId: targetTmbId,
    groupId,
    orgId
  } = req.query as {
    tmbId?: string;
    groupId?: string;
    orgId?: string;
  };

  if (!targetTmbId && !groupId && !orgId) throw new Error('Missing ID');

  // 2. Get target member info
  const targetMember = targetTmbId ? await MongoTeamMember.findById(targetTmbId).lean() : null;

  if (
    !checkCanRemovePermission({
      operatorTmbId: tmbId,
      operatorRole: (operator.role || TeamMemberRoleEnum.member) as TeamMemberRoleEnum,
      operatorPermission: opPermission,
      targetTmbId: targetTmbId || '',
      targetRole: (targetMember?.role || TeamMemberRoleEnum.member) as TeamMemberRoleEnum
    })
  ) {
    throw new Error('You do not have permission to remove this resource.');
  }

  await MongoResourcePermission.deleteOne({
    teamId,
    resourceType: PerResourceTypeEnum.team,
    tmbId: targetTmbId,
    groupId,
    orgId
  });
}

export default NextAPI(handler);
