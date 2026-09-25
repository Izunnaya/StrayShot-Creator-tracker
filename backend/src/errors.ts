/** One reason a request was refused. `field` only when it points at one. */
export type Reason = { code: string; message: string; field?: string }

/**
 * A failure the caller is allowed to hear about, carrying the status, the code
 * and the message that reach them. Throwing it is how a rule refuses without
 * knowing what a response is; `middlewares/errorHandler.ts` turns it into
 * JSON, and anything else thrown is a bug that answers 500.
 *
 * The codes and the shapes they come out in are in `docs/api.md`.
 */
export class ApiError extends Error {
  /* Declared and assigned by hand because erasableSyntaxOnly rules out
     TypeScript's parameter properties. */
  status: number
  code: string
  reasons?: Reason[]

  constructor(status: number, code: string, message: string, reasons?: Reason[]) {
    super(message)
    this.status = status
    this.code = code
    this.reasons = reasons
  }
}
