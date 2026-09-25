import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors.ts'

/**
 * An address the API does not serve.
 *
 * It throws rather than answering, so there is one place that writes an error
 * body and one shape it can come out in (docs/api.md). A missing record
 * throws the same `not_found` from its controller.
 *
 * The method and path are repeated back because a wrong URL is usually a
 * typo, and being told which one missed saves the reader opening devtools.
 * The body is JSON, never Express's HTML page: every caller here is a fetch()
 * expecting JSON, and an HTML body makes a wrong URL look like a parsing bug.
 */
export function notFound(request: Request, _response: Response, next: NextFunction): void {
  next(new ApiError(404, 'not_found', `Nothing here: ${request.method} ${request.originalUrl}`))
}
