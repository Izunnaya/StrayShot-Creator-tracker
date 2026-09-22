import type { Request, Response } from 'express'

/**
 * Is the server up?
 *
 * Deliberately shallow: it says the process is listening and nothing more. A
 * check that also reaches the database belongs with the database (0.15), and
 * wants its own address, so a load balancer can keep asking this one cheaply.
 *
 * A controller reads the request, calls the work, and answers. No business
 * rules live here.
 */
export function getHealth(_request: Request, response: Response) {
  response.json({
    status: 'ok',
    checkedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  })
}
