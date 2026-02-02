import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import type { Permission } from '@fastgpt/global/support/permission/controller';

/**
 * Check if the user can update the permission of the target member
 * 1. Can not update self permission
 * 2. Can not update owner permission
 * 3. Only owner can update manage permission
 */
export const checkCanUpdatePermission = ({
  operatorTmbId,
  operatorRole,
  operatorPermission,
  targetTmbId,
  targetRole,
  targetPermission,
  updatePermission
}: {
  operatorTmbId: string;
  operatorRole: TeamMemberRoleEnum;
  operatorPermission: Permission;
  targetTmbId: string;
  targetRole: TeamMemberRoleEnum;
  targetPermission: Permission;
  updatePermission?: Permission;
}) => {
  // 1. Can not update self permission
  if (operatorTmbId === targetTmbId) {
    return false;
  }

  // 2. Owner can do anything
  if (operatorRole === TeamMemberRoleEnum.owner) {
    return true;
  }

  // 3. Can not update owner permission
  if (targetRole === TeamMemberRoleEnum.owner) {
    return false;
  }

  // 4. Operator must have manage permission
  if (!operatorPermission.hasManagePer) {
    return false;
  }

  // 5. Only owner can update manage permission (prevent creating new admin)
  if (updatePermission) {
    // If trying to add/remove manage permission
    if (updatePermission.hasManagePer !== targetPermission.hasManagePer) {
      return false;
    }
  }

  // 6. Can not modify a target who already has manage permission (unless you are owner, handled above)
  if (targetPermission.hasManagePer) {
    return false;
  }

  return true;
};

export const checkCanRemovePermission = ({
  operatorTmbId,
  operatorRole,
  operatorPermission,
  targetTmbId,
  targetRole
}: {
  operatorTmbId: string;
  operatorRole: TeamMemberRoleEnum;
  operatorPermission: Permission;
  targetTmbId: string;
  targetRole: TeamMemberRoleEnum;
}) => {
  // 1. Can not remove self
  if (operatorTmbId === targetTmbId) {
    return false;
  }

  // 2. Owner can remove anyone
  if (operatorRole === TeamMemberRoleEnum.owner) {
    return true;
  }

  // 3. Can not remove owner
  if (targetRole === TeamMemberRoleEnum.owner) {
    return false;
  }

  // 4. Operator must have manage permission
  if (!operatorPermission.hasManagePer) {
    return false;
  }

  return true;
};
