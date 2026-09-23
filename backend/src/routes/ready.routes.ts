import { Router } from 'express'
import { getReadiness } from '../controllers/ready.controller.ts'

/**
 * Addresses only, as every route file: the readiness check lives apart from
 * /health so a load balancer can ask the cheap question as often as it likes
 * without touching the database.
 */
export const readyRoutes = Router()

readyRoutes.get('/ready', getReadiness)
