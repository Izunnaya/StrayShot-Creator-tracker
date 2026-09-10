/**
 * Who is using the dashboard.
 *
 * A stand-in until the team surface has real authentication (open question
 * Q3, task 0.16). It exists so that "recorded by" can be stamped from the
 * session from the very first payment rather than typed into a box: a typed
 * name proves nothing on a finance record, and backfilling one later would
 * mean guessing who did what. When sessions arrive, this is the only module
 * that changes.
 */
export interface TeamMember {
  name: string
}

export const currentTeamMember: TeamMember = { name: 'A. Raouf' }
