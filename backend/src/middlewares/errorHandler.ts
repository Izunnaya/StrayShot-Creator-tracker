import type { NextFunction, Request, Response } from 'express'

/**
 * The last thing in the stack: whatever a route threw, turned into one
 * answer.
 *
 * It says nothing about how the failure happened. A stack trace or a
 * database message in a response body is a gift to whoever is poking at the
 * API, and means nothing to the client anyway; the server log is where the
 * detail belongs. Task 0.17 replaces this with the agreed error contract and
 * proper logging.
 *
 * Express 5 routes an error here even when it comes out of an async handler,
 * which Express 4 did not.
 */
export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  /* Headers already sent means the response is part-written; Express's own
     handler has to finish it, and anything written here would land mid-body. */
  if (response.headersSent) {
    next(error)
    return
  }

  console.error(error)
  response.status(500).json({
    error: { code: 'internal_error', message: 'The server could not complete that request.' },
  })
}
