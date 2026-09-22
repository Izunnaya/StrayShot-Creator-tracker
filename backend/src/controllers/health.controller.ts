import type { Request, Response } from 'express'

/**
 * Is the server up, and which environment answered?
 *
 * Deliberately shallow: it says the process is listening and nothing more.
 * A check that also reaches the database belongs with the database (0.15),
 * and wants its own address, so a load balancer can keep asking this one
 * cheaply.
 *
 * A controller's whole job is this: read the request, call the work, answer.
 * No business rules live here. The response body is assembled here rather
 * than by a layer of its own -- the client is the view, and what a model
 * hands back is not automatically what goes over the wire.
 */
export function getHealth(_request: Request, response: Response): void {
  response.json({
    status: 'ok',
    /** Server time in ISO 8601, so a caller can see clock drift. */
    checkedAt: new Date().toISOString(),
    environment: response.app.locals.environment as string,
  })
}
