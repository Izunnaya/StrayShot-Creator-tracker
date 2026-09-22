import type { Request, Response } from 'express'
import { healthView } from '../views/health.view.ts'

/**
 * Is the server up, and which environment answered?
 *
 * Deliberately shallow: it says the process is listening and nothing more.
 * A check that also reaches the database belongs with the database (0.15),
 * and wants its own address, so a load balancer can keep asking this one
 * cheaply.
 *
 * A controller's whole job is this: read the request, call the work, answer
 * with a view. No business rules live here.
 */
export function getHealth(_request: Request, response: Response): void {
  response.json(healthView(new Date(), response.app.locals.environment as string))
}
