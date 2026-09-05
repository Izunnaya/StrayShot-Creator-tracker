import { describe, expect, it } from 'vitest'
import { creators as fixtureCreators, streams as fixtureStreams } from '../data/fixtures'
import type { Stream } from '../data/types'
import {
  getStreamHistoryForCreator,
  getStreamsForCreator,
  sortStreamsNewestFirst,
} from './streamHistory'

const createTestStream = (overrides: Partial<Stream> = {}): Stream => ({
  id: 1,
  creatorId: 1,
  streamedOn: '2026-08-26',
  title: 'Season 2 drop day grind',
  platform: 'YouTube',
  views: 10000,
  peakConcurrentViewers: 500,
  installsAttributed: 200,
  ...overrides,
})

describe('getStreamsForCreator', () => {
  it('returns only the streams belonging to that creator', () => {
    const streams = [
      createTestStream({ id: 1, creatorId: 1 }),
      createTestStream({ id: 2, creatorId: 2 }),
      createTestStream({ id: 3, creatorId: 1 }),
    ]

    expect(getStreamsForCreator(streams, 1).map((stream) => stream.id)).toEqual([1, 3])
  })

  it('returns nothing for a creator who has not streamed yet', () => {
    expect(getStreamsForCreator([createTestStream({ creatorId: 2 })], 99)).toEqual([])
  })
})

describe('sortStreamsNewestFirst', () => {
  it('puts the most recent stream first', () => {
    const streams = [
      createTestStream({ id: 1, streamedOn: '2026-07-24' }),
      createTestStream({ id: 2, streamedOn: '2026-08-26' }),
      createTestStream({ id: 3, streamedOn: '2026-08-08' }),
    ]

    expect(sortStreamsNewestFirst(streams).map((stream) => stream.id)).toEqual([2, 3, 1])
  })

  it('leaves the streams it was given untouched', () => {
    const original = [
      createTestStream({ id: 1, streamedOn: '2026-07-24' }),
      createTestStream({ id: 2, streamedOn: '2026-08-26' }),
    ]

    sortStreamsNewestFirst(original)

    expect(original.map((stream) => stream.id)).toEqual([1, 2])
  })
})

describe('the stream fixtures', () => {
  it('gives every creator exactly as many streams as they have delivered', () => {
    for (const creator of fixtureCreators) {
      expect(getStreamsForCreator(fixtureStreams, creator.id)).toHaveLength(
        creator.streamsDelivered,
      )
    }
  })

  it('splits views and installs so the stream rows add up to the creator totals', () => {
    for (const creator of fixtureCreators) {
      const streams = getStreamsForCreator(fixtureStreams, creator.id)
      if (streams.length === 0) continue

      const viewsAcrossStreams = streams.reduce((total, stream) => total + stream.views, 0)
      const installsAcrossStreams = streams.reduce(
        (total, stream) => total + stream.installsAttributed,
        0,
      )

      /* Rounding each row can move the total by at most half a unit per row. */
      expect(Math.abs(viewsAcrossStreams - creator.totalViews)).toBeLessThanOrEqual(streams.length)
      expect(Math.abs(installsAcrossStreams - creator.installsAttributed)).toBeLessThanOrEqual(
        streams.length,
      )
    }
  })

  it('reads newest first once ordered, and never exceeds the creator peak', () => {
    const novaKess = fixtureCreators.find((creator) => creator.creatorCode === 'NOVA')!
    const history = getStreamHistoryForCreator(fixtureStreams, novaKess.id)

    expect(history).toHaveLength(3)
    expect(history[0]!.streamedOn).toBe('2026-08-26')
    expect(history[history.length - 1]!.streamedOn).toBe('2026-08-08')

    for (const stream of history) {
      expect(stream.peakConcurrentViewers).toBeLessThanOrEqual(novaKess.peakConcurrentViewers)
      expect(stream.platform).toBe(novaKess.platform)
    }
  })
})
