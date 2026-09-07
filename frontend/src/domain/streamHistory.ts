import type { Stream } from '@/data/types'

/**
 * Reading a creator's detected streams out of the full set.
 *
 * Streams arrive from the platform integrations (Modules 14 and 15) already
 * matched to a campaign (Module 16), so nothing here decides whether a stream
 * counts — that judgement belongs to the matching service. This module only
 * selects and orders what has already been matched.
 */

/** Every stream detected for one creator, in whatever order they were given. */
export function getStreamsForCreator(streams: Stream[], creatorId: number): Stream[] {
  return streams.filter((stream) => stream.creatorId === creatorId)
}

/**
 * Most recent stream first. The same ordering the creator portal uses, so
 * both sides of the product tell the story in the same direction.
 */
export function sortStreamsNewestFirst(streams: Stream[]): Stream[] {
  return [...streams].sort((left, right) => right.streamedOn.localeCompare(left.streamedOn))
}

/** One creator's streams, newest first. What the detail screen renders. */
export function getStreamHistoryForCreator(streams: Stream[], creatorId: number): Stream[] {
  return sortStreamsNewestFirst(getStreamsForCreator(streams, creatorId))
}
