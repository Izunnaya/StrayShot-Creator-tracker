import type { Request, Response } from 'express'
import { prisma } from '../models/prisma.ts'

/**
 * Can the server do its job?
 *
 * /api/health says the process is listening. This says it can serve a
 * request, which today means one thing: Postgres answers. `SELECT 1` is the
 * cheapest round trip there is — it proves the connection, the credentials
 * and the network, and deliberately proves nothing about any table, since
 * there are none yet (1.16 onward).
 *
 * The status code is the answer: 200 to send traffic, 503 to hold it back, so
 * a database that has gone away takes the instance out of rotation instead of
 * failing every request that reaches it.
 *
 * Why it failed goes to the log, never to the body. A driver's message names
 * hosts, users and ports, which is a gift to whoever is poking at the API.
 */
export async function getReadiness(_request: Request, response: Response) {
  const startedAt = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    console.error('Readiness: the database did not answer.', error)
    response.status(503).json({ status: 'not_ready', database: 'down' })
    return
  }

  response.json({
    status: 'ready',
    database: 'up',
    databaseLatencyMs: Date.now() - startedAt,
    checkedAt: new Date().toISOString(),
  })
}
