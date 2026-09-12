import type { Campaign, Creator, Payment } from '@/data/types'
import { getCampaignName } from './campaigns'
import { EVERY_CAMPAIGN, type CampaignFilter } from './creatorFiltering'
import { hasBeenReversed, isReversal } from './paymentRecording'

/**
 * Every payment the team has made, across every creator, as one record.
 *
 * The creator detail screen answers "what have we paid this person"; this
 * answers "what has left the account", which is the question asked while
 * reconciling against a bank statement. Nothing here is stored: the ledger is
 * derived from the creator records on every read, so a payment recorded
 * anywhere is in it immediately and cannot disagree with the screen it was
 * recorded on.
 */

/** One line of the ledger: a payment, and who it went to. */
export interface LedgerEntry {
  payment: Payment
  creatorId: number
  creatorName: string
  creatorCode: string
  campaignId: number
  /** Resolved here so a renamed campaign reads correctly without a lookup. */
  campaignName: string
  /** This entry cancels an earlier payment. */
  isReversal: boolean
  /** This payment was later cancelled by one. */
  wasReversed: boolean
}

export interface LedgerTotals {
  /**
   * What the payments in view actually cost, reversals already deducted.
   * The same figure the dashboard calls paid, which is why it is the headline
   * rather than the gross.
   */
  netInCents: number
  /** What was paid before anything was cancelled. */
  grossInCents: number
  /** How much has been cancelled, as a positive figure. */
  reversedInCents: number
  entryCount: number
  /** How many different creators appear, however many times each. */
  creatorCount: number
}

/**
 * Newest first, and within a day the most recently recorded first.
 *
 * A creator's own history keeps the order payments were entered in for a
 * single day, because that is the order that creator was paid in. Across
 * creators there is no such order to preserve, so the id decides it — and the
 * id is the only thing that can, since two payments made on the same day to
 * two people are otherwise indistinguishable.
 */
export function buildPaymentLedger(creators: Creator[], campaigns: Campaign[]): LedgerEntry[] {
  const entries = creators.flatMap((creator) =>
    creator.payments.map((payment) => ({
      payment,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorCode: creator.creatorCode,
      campaignId: creator.campaignId,
      campaignName: getCampaignName(campaigns, creator.campaignId),
      isReversal: isReversal(payment),
      wasReversed: hasBeenReversed(payment, creator.payments),
    })),
  )

  return entries.sort(
    (left, right) =>
      right.payment.paidOn.localeCompare(left.payment.paidOn) || right.payment.id - left.payment.id,
  )
}

export function filterLedgerByCampaign(
  entries: LedgerEntry[],
  campaign: CampaignFilter,
): LedgerEntry[] {
  if (campaign === EVERY_CAMPAIGN) return entries
  return entries.filter((entry) => entry.campaignId === campaign)
}

/**
 * What the entries in view add up to.
 *
 * Gross and net are both reported because they answer different questions: a
 * bank statement shows every line that moved money, including the pair that
 * cancelled out, while what the campaign cost is the net of them.
 */
export function summariseLedger(entries: LedgerEntry[]): LedgerTotals {
  const paidCreators = new Set<number>()
  let grossInCents = 0
  let reversedInCents = 0

  for (const entry of entries) {
    paidCreators.add(entry.creatorId)
    if (entry.payment.amountInCents < 0) reversedInCents -= entry.payment.amountInCents
    else grossInCents += entry.payment.amountInCents
  }

  return {
    netInCents: grossInCents - reversedInCents,
    grossInCents,
    reversedInCents,
    entryCount: entries.length,
    creatorCount: paidCreators.size,
  }
}
