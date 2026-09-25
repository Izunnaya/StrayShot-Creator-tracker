/**
 * A failure the caller is allowed to hear about.
 *
 * Anything thrown that is not one of these is a bug, and answers 500 with a
 * fixed message — see `middlewares/errorHandler.ts`. Throwing this is how a
 * rule refuses without knowing what a response is: the rule says what is
 * wrong, the error handler turns it into JSON.
 *
 * `code` is what a caller branches on, so it is stable and snake_case;
 * `message` is written for a person reading it. Codes in use:
 *
 *   not_found          an address, or a record, that does not exist
 *   invalid_json       a body Express could not parse
 *   validation_failed  a body that parsed but is not usable (reasons say why)
 *   internal_error     anything unexpected. Never thrown deliberately
 *
 * Each module adds the refusals its own rules make — payment_already_reversed,
 * creator_has_balance — next to the rule that raises them.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /**
   * Every reason the request was refused, when there can be more than one.
   *
   * The frontend already produces refusals as lists (`creatorArchive.ts`,
   * `creatorDiscard.ts`, `paymentRecording.ts`) because a form shows all of
   * them at once. Sending one and making the client guess the rest would be
   * the same rule answering differently on each side.
   */
  readonly reasons?: { code: string; message: string; field?: string }[]

  constructor(
    status: number,
    code: string,
    message: string,
    reasons?: { code: string; message: string; field?: string }[],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    if (reasons) this.reasons = reasons
  }
}
