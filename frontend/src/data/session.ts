/**
 * Who is using the dashboard, and who else could have.
 *
 * A stand-in until the team surface has real authentication (open question
 * Q3, task 0.16). It exists so that "recorded by" can be stamped from the
 * session from the very first payment rather than typed into a box: a typed
 * name proves nothing on a finance record, and backfilling one later would
 * mean guessing who did what. When sessions arrive, this is the only module
 * that changes.
 *
 * The directory is append-only, for the reason payments are (DECISIONS Q6).
 * Someone who leaves the team is deactivated, never removed: their id is
 * still on every payment they recorded, and deleting the row would turn
 * attribution that was once exact into "unknown team member" across the
 * whole history.
 */
export interface TeamMember {
  /**
   * Stable, immutable, and never reused.
   *
   * A string rather than the numbers used elsewhere, because this id does not
   * come from the same place. Campaign, creator and payment ids are minted by
   * the API; this one identifies an authenticated subject and will come from
   * whatever issues the session — where a subject claim is a string. Storing
   * it as a number now would guarantee the migration Q4 promised to avoid.
   */
  id: string
  /** For display only. It can change; nothing may be keyed on it. */
  name: string
}

export const teamMembers: TeamMember[] = [
  { id: 'tm-araouf', name: 'A. Raouf' },
  { id: 'tm-mdevlin', name: 'M. Devlin' },
  { id: 'tm-kosei', name: 'K. Osei' },
]

export const currentTeamMember: TeamMember = teamMembers[0]!
