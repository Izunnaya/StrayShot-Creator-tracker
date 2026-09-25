import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors.ts'

/**
 * The last thing in the stack: whatever a route threw, turned into one
 * answer, in the one shape docs/api.md promises.
 *
 * Three kinds of failure arrive here.
 *
 * An ApiError is a failure someone meant: it carries the status, the code and
 * the message a caller should see, and answers with them.
 *
 * A body Express could not parse never reaches a route at all — express.json
 * throws a SyntaxError carrying status 400. That is the caller's mistake, not
 * the server's, so it says so rather than claiming an internal error.
 *
 * Anything else is a bug. It answers 500 with a fixed message and says
 * nothing about how it happened: a stack trace or a database message in a
 * response body is a gift to whoever is poking at the API, and means nothing
 * to the client anyway. The server log is where the detail belongs.
 *
 * Express 5 routes an error here even when it comes out of an async handler,
 * which Express 4 did not.
 */
export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  /* Headers already sent means the response is part-written; Express's own
     handler has to finish it, and anything written here would land mid-body. */
  if (response.headersSent) {
    next(error)
    return
  }

  if (error instanceof ApiError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.reasons ? { reasons: error.reasons } : {}),
      },
    })
    return
  }

  if (isUnparseableBody(error)) {
    response.status(400).json({
      error: { code: 'invalid_json', message: 'The request body is not valid JSON.' },
    })
    return
  }

  /* Only the unexpected is logged. A 404 or a refused request is ordinary
     traffic, and logging it teaches everyone to ignore the log. */
  console.error(`Unhandled error on ${request.method} ${request.originalUrl}`, error)
  response.status(500).json({
    error: { code: 'internal_error', message: 'The server could not complete that request.' },
  })
}

/** A body express.json gave up on: a SyntaxError it tagged with status 400. */
function isUnparseableBody(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    'status' in error &&
    (error as SyntaxError & { status?: number }).status === 400
  )
}
