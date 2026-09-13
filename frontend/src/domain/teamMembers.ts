import type { TeamMember } from '@/data/session'

/**
 * Turning a recorded team-member id back into a name to show.
 *
 * The same shape as looking a campaign up by id, and for the same reason: the
 * record stores what cannot change, and the name is resolved at the moment it
 * is rendered. A name copied onto a payment would be right on the day and
 * wrong after a marriage, a correction, or a second M. Devlin joining.
 */

export function findTeamMember(teamMembers: TeamMember[], id: string): TeamMember | undefined {
  return teamMembers.find((teamMember) => teamMember.id === id)
}

/**
 * The name to show against a payment, or a plain statement that it cannot be
 * resolved.
 *
 * An id with nobody behind it should not read as a missing value: the payment
 * was recorded by someone, and the record still says exactly who. It is the
 * directory that has lost them, which is a different problem from an entry
 * nobody signed — and one the append-only directory exists to prevent.
 */
export function getTeamMemberName(teamMembers: TeamMember[], id: string): string {
  return findTeamMember(teamMembers, id)?.name ?? 'Unknown team member'
}
