import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * What the Prisma CLI needs to know: where the schema is, where migrations
 * go, and which database to talk to.
 *
 * The connection string is read here, from the environment, because Prisma 7
 * no longer takes it in the schema's datasource block — `dotenv/config` first
 * and then `process.env`, the same way `src/server.ts` reads its settings.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL },
})
