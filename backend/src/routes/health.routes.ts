import { Router } from 'express'
import { getHealth } from '../controllers/health.controller.ts'

/**
 * Addresses only. A route file says which path and method reach which
 * controller, and nothing else, so the API's surface can be read without
 * opening the controllers.
 */
export const healthRoutes = Router()

healthRoutes.get('/health', getHealth)
