import { describe, expect, it } from 'vitest'
import { readEnv } from './env.ts'

/**
 * A bad setting has to stop the server at boot, saying which one. These are
 * the cases that would otherwise become a server listening on a port nobody
 * meant, or one that starts and then behaves as the wrong environment.
 */

describe('reading the environment', () => {
  it('defaults to port 4000 in development', () => {
    expect(readEnv({})).toEqual({ port: 4000, nodeEnv: 'development' })
  })

  it('takes the port and environment that were set', () => {
    expect(readEnv({ PORT: '8080', NODE_ENV: 'production' })).toEqual({
      port: 8080,
      nodeEnv: 'production',
    })
  })

  it('refuses a port that is not a whole number', () => {
    expect(() => readEnv({ PORT: '80.5' })).toThrow(/whole number/)
    expect(() => readEnv({ PORT: 'four thousand' })).toThrow(/whole number/)
  })

  it('refuses a port outside the range a machine can listen on', () => {
    expect(() => readEnv({ PORT: '0' })).toThrow(/between 1 and 65535/)
    expect(() => readEnv({ PORT: '70000' })).toThrow(/between 1 and 65535/)
  })

  it('refuses an environment it does not know', () => {
    expect(() => readEnv({ NODE_ENV: 'staging' })).toThrow(/development, test or production/)
  })
})
