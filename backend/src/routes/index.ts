import { Router } from 'express'
import { healthRoutes } from './health.routes.ts'

/**
 * Every route the API serves, gathered under /api.
 *
 * Campaigns, creators and payments (Modules 1, 4 and 6) mount here as they
 * are built, each in its own route file.
 */
export const apiRoutes = Router()

apiRoutes.use(healthRoutes)
