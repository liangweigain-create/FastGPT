import { describe, expect, it } from 'vitest';
import { checkCanUpdatePermission, checkCanRemovePermission } from './validation';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { Permission } from '@fastgpt/global/support/permission/controller';
import { ManageRoleVal, ReadRoleVal } from '@fastgpt/global/support/permission/constant';
import { TeamAppCreateRoleVal } from '@fastgpt/global/support/permission/user/constant';

describe('Permission Validation', () => {
  const ownerPer = new Permission({ role: ManageRoleVal, isOwner: true });
  const managerPer = new Permission({ role: ManageRoleVal });
  const memberPer = new Permission({ role: ReadRoleVal });

  describe('checkCanUpdatePermission', () => {
    it('should fail if updating self', () => {
      expect(
        checkCanUpdatePermission({
          operatorTmbId: '1',
          operatorRole: TeamMemberRoleEnum.admin,
          operatorPermission: managerPer,
          targetTmbId: '1',
          targetRole: TeamMemberRoleEnum.admin,
          targetPermission: managerPer
        })
      ).toBe(false);
    });

    it('should pass if owner updates anyone', () => {
      expect(
        checkCanUpdatePermission({
          operatorTmbId: '1',
          operatorRole: TeamMemberRoleEnum.owner,
          operatorPermission: ownerPer,
          targetTmbId: '2',
          targetRole: TeamMemberRoleEnum.admin,
          targetPermission: managerPer
        })
      ).toBe(true);
    });

    it('should fail if non-owner updates owner', () => {
      expect(
        checkCanUpdatePermission({
          operatorTmbId: '2',
          operatorRole: TeamMemberRoleEnum.admin,
          operatorPermission: managerPer,
          targetTmbId: '1',
          targetRole: TeamMemberRoleEnum.owner,
          targetPermission: ownerPer
        })
      ).toBe(false);
    });

    it('should fail if non-manager updates anyone', () => {
      expect(
        checkCanUpdatePermission({
          operatorTmbId: '3',
          operatorRole: TeamMemberRoleEnum.member,
          operatorPermission: memberPer,
          targetTmbId: '4',
          targetRole: TeamMemberRoleEnum.member,
          targetPermission: memberPer
        })
      ).toBe(false);
    });

    it('should pass if manager updates normal member', () => {
      expect(
        checkCanUpdatePermission({
          operatorTmbId: '2',
          operatorRole: TeamMemberRoleEnum.admin,
          operatorPermission: managerPer,
          targetTmbId: '4',
          targetRole: TeamMemberRoleEnum.member,
          targetPermission: memberPer,
          updatePermission: new Permission({ role: TeamAppCreateRoleVal })
        })
      ).toBe(true);
    });

    it('should fail if manager updates another manager', () => {
      expect(
        checkCanUpdatePermission({
          operatorTmbId: '2',
          operatorRole: TeamMemberRoleEnum.admin,
          operatorPermission: managerPer,
          targetTmbId: '5',
          targetRole: TeamMemberRoleEnum.admin,
          targetPermission: managerPer
        })
      ).toBe(false);
    });

    it('should fail if manager tries to give manage permission', () => {
      const updatePer = new Permission({ role: ManageRoleVal });
      expect(
        checkCanUpdatePermission({
          operatorTmbId: '2',
          operatorRole: TeamMemberRoleEnum.admin,
          operatorPermission: managerPer,
          targetTmbId: '4',
          targetRole: TeamMemberRoleEnum.member,
          targetPermission: memberPer,
          updatePermission: updatePer
        })
      ).toBe(false);
    });
  });

  describe('checkCanRemovePermission', () => {
    it('should pass if owner removes anyone', () => {
      expect(
        checkCanRemovePermission({
          operatorTmbId: '1',
          operatorRole: TeamMemberRoleEnum.owner,
          operatorPermission: ownerPer,
          targetTmbId: '2',
          targetRole: TeamMemberRoleEnum.admin
        })
      ).toBe(true);
    });
    it('should fail if manager removes owner', () => {
      expect(
        checkCanRemovePermission({
          operatorTmbId: '2',
          operatorRole: TeamMemberRoleEnum.admin,
          operatorPermission: managerPer,
          targetTmbId: '1',
          targetRole: TeamMemberRoleEnum.owner
        })
      ).toBe(false);
    });
  });
});
