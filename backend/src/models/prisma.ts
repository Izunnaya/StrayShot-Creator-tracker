import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.ts'

/**
 * The connection to Postgres, made once and shared.
 *
 * One client means one pool: a second would open its own connections, and a
 * hosted database counts them. Everything that reads or writes imports this.
 *
 * Prisma 7 talks to Postgres through a driver adapter, so the connection
 * string is handed to `pg` here rather than read from the schema. A missing
 * or wrong URL is not thrown at startup on purpose — the server still comes
 * up and answers /api/health, and /api/ready is what reports 503.
 */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
