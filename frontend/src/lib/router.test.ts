import { describe, expect, it } from 'vitest'
import { parseRoute, pathForRoute } from './router'

describe('reading an address', () => {
  it('knows the three screens', () => {
    expect(parseRoute('/')).toEqual({ screen: 'overview' })
    expect(parseRoute('/payments')).toEqual({ screen: 'payments' })
    expect(parseRoute('/creators/12')).toEqual({ screen: 'creator', creatorId: 12 })
  })

  it('forgives a trailing slash', () => {
    expect(parseRoute('/payments/')).toEqual({ screen: 'payments' })
    expect(parseRoute('/creators/12/')).toEqual({ screen: 'creator', creatorId: 12 })
  })

  it('reads anything it does not know as the overview rather than a blank page', () => {
    expect(parseRoute('/nowhere')).toEqual({ screen: 'overview' })
    expect(parseRoute('/creators/abc')).toEqual({ screen: 'overview' })
    expect(parseRoute('/creators/')).toEqual({ screen: 'overview' })
  })
})

describe('writing an address', () => {
  it('round-trips every route', () => {
    for (const route of [
      { screen: 'overview' },
      { screen: 'payments' },
      { screen: 'creator', creatorId: 7 },
    ] as const) {
      expect(parseRoute(pathForRoute(route))).toEqual(route)
    }
  })
})
