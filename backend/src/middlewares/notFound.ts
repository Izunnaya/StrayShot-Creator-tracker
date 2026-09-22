import type { Request, Response } from 'express'

/**
 * An address the API does not serve.
 *
 * Answered as JSON rather than Express's HTML page, because every caller
 * here is a fetch() expecting JSON, and an HTML body makes a wrong URL look
 * like a parsing bug. The error shape is settled properly in task 0.17.
 */
export function notFound(request: Request, response: Response): void {
  response.status(404).json({
    error: { code: 'not_found', message: `Nothing here: ${request.method} ${request.originalUrl}` },
  })
}
