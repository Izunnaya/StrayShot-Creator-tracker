import { createApp } from './app.ts'
import { readEnv } from './config/env.ts'

/**
 * The entry point: read the environment, build the app, listen.
 *
 * Everything that could fail on a bad setting fails here, before the port is
 * open, so a misconfigured server never accepts a request it cannot serve.
 */
const env = readEnv()
const app = createApp(env.nodeEnv)

const server = app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`)
})

/* Docker and most hosts stop a container with SIGTERM, Ctrl+C sends SIGINT.
   Both are answered the same way: stop taking new connections, let the ones
   in flight finish, then exit -- rather than cutting off a request midway. */
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
  })
}
