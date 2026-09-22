import express, { type Express } from 'express'
import { errorHandler } from './middlewares/errorHandler.ts'
import { notFound } from './middlewares/notFound.ts'
import { apiRoutes } from './routes/index.ts'

/**
 * The application, built but not listening.
 *
 * Kept apart from server.ts so a test can drive the whole stack — routes,
 * middlewares and all — without opening a port, and so whatever runs it in
 * production decides how it is served.
 *
 * Order matters: the body parser before the routes that read a body, the
 * routes, then the not-found answer, then the error handler last, since
 * Express only reaches a four-argument handler after everything before it.
 */
export function createApp(environment: string): Express {
  const app = express()

  app.locals.environment = environment

  app.use(express.json())
  app.use('/api', apiRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
