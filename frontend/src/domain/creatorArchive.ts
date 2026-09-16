import type { Creator } from '@/data/types'
import { getOutstandingBalance } from './creatorCalculations'

/**
 * Taking a creator out of the roster once the work is over.
 *
 * Discarding is for a record of nothing (see creatorDiscard). Archiving is
 * the opposite case: someone real, whose campaign is finished, who would
 * otherwise sit in the table for years. Everything they carry stays —
 * payments in the ledger, installs and spend in the campaign's figures, their
 * code theirs — and only the working roster hides them. It is reversible,
 * which is the other half of why it is safe. Q51.
 */

export type ArchiveBlocker = 'has-open-balance'

/**
 * Why this creator cannot be archived yet.
 *
 * Only one thing stops it: money still owed. Archiving says the work is
 * over, and a debt is the one fact that makes that untrue — hiding a creator
 * who is still owed would take the amount out of the roster while leaving it
 * in the outstanding total, which is how a team stops paying someone by
 * accident. Pay them, or reverse what was agreed, and then archive.
 */
export function getArchiveBlockers(creator: Creator): ArchiveBlocker[] {
  return getOutstandingBalance(creator) > 0 ? ['has-open-balance'] : []
}

export function canArchiveCreator(creator: Creator): boolean {
  return getArchiveBlockers(creator).length === 0
}

export function isArchived(creator: Creator): boolean {
  return creator.archivedOn !== undefined
}

/** The same creator, archived on the given day. */
export function archiveCreator(creator: Creator, archivedOn: string): Creator {
  return { ...creator, archivedOn }
}

/** The same creator, back in the roster. */
export function restoreCreator(creator: Creator): Creator {
  const { archivedOn: _archivedOn, ...rest } = creator
  return rest
}

/**
 * The creators in the working roster, and those out of it.
 *
 * Every screen that answers "who are we working with" reads the first one.
 * The ledger, the campaign figures and the budget read the whole list, since
 * an archived creator's money was still spent and their installs still
 * landed.
 */
export function filterOutArchived(creators: Creator[]): Creator[] {
  return creators.filter((creator) => !isArchived(creator))
}

export function filterArchived(creators: Creator[]): Creator[] {
  return creators.filter(isArchived)
}
