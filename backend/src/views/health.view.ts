/**
 * Views are the shapes that go over the wire.
 *
 * A controller answers with one of these rather than with a record straight
 * from the database: the API's contract is then written down in one place,
 * and a column added to a table does not quietly become a public field. When
 * the client and server share types (Q47), these are what they share.
 */

export interface HealthView {
  status: 'ok'
  /** Server time in ISO 8601, so a caller can see clock drift. */
  checkedAt: string
  environment: string
}

export function healthView(now: Date, environment: string): HealthView {
  return { status: 'ok', checkedAt: now.toISOString(), environment }
}
