import { TeamMemberRoleEnum } from './constant';

/**
 * Get team member role safely.
 * Since the role field is optional and deprecated in schema, it might be missing in some cases.
 * This function provides a default fallback and logs warning for missing roles.
 */
export const getSafeTeamMemberRole = (member: {
  role?: string;
  _id?: string;
  userId?: string;
  tmbId?: string;
}): TeamMemberRoleEnum => {
  if (!member.role) {
    const id = member._id || member.tmbId || member.userId || 'unknown';
    console.warn(
      `[Role Check Warning]: Member ${id} has no role field. Fallback to 'member'. This might be a legacy data issue.`
    );
    return TeamMemberRoleEnum.member;
  }
  return member.role as TeamMemberRoleEnum;
};
