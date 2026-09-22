/**
 * Everything the server reads from its environment, read once and checked
 * here rather than wherever it happens to be needed.
 *
 * A missing or nonsensical setting should stop the server at boot with a
 * sentence saying which one, not surface later as a request that fails for
 * no visible reason. The database URL joins this in task 0.15.
 */

export interface Env {
  port: number
  nodeEnv: 'development' | 'test' | 'production'
}

export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const nodeEnv = source.NODE_ENV ?? 'development'
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    throw new Error(`NODE_ENV must be development, test or production, not "${nodeEnv}"`)
  }

  const port = readPort(source.PORT)

  return { port, nodeEnv }
}

/** A port is a whole number a machine can actually listen on. */
function readPort(value: string | undefined): number {
  if (value === undefined || value === '') return 4000
  if (!/^\d+$/.test(value)) throw new Error(`PORT must be a whole number, not "${value}"`)

  const port = Number(value)
  if (port < 1 || port > 65_535) throw new Error(`PORT must be between 1 and 65535, not ${port}`)
  return port
}
