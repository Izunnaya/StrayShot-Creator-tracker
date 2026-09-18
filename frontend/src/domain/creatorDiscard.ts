import type { Creator } from '@/data/types'

/**
 * Whether a creator record can be thrown away.
 *
 * Deleting a creator is not the same kind of act as deleting a draft: their
 * payments are in the ledger and their code is what installs are attributed
 * through, so removing the record would take money out of a total that has to
 * reconcile against a bank statement. That is the same reasoning that makes
 * payments append-only (DECISIONS.md, Q6) and the team directory
 * deactivate-only (Q4).
 *
 * So discarding is deliberately narrow: it is for the duplicate and the test
 * entry, a record nothing has happened to yet. The moment a creator has been
 * paid, has streamed, or has claimed their portal account, the record is
 * evidence of something and stays. Q51.
 */

export type DiscardBlocker = 'has-payments' | 'has-streams' | 'invite-claimed'

/**
 * Every reason this creator cannot be discarded, in the order they are worth
 * reading: money first, then delivery, then the account they now hold.
 *
 * Reversed payments count. A payment and its reversal sum to nothing but are
 * still two records in the ledger, and the ledger is what would lose them.
 */
export function getDiscardBlockers(
  creator: Creator,
  /** How many streams have been detected for this creator. */
  streamCount: number,
): DiscardBlocker[] {
  const blockers: DiscardBlocker[] = []
  if (creator.payments.length > 0) blockers.push('has-payments')
  if (streamCount > 0) blockers.push('has-streams')
  if (creator.portalInviteState === 'claimed') blockers.push('invite-claimed')
  return blockers
}

export function canDiscardCreator(creator: Creator, streamCount: number): boolean {
  return getDiscardBlockers(creator, streamCount).length === 0
}
