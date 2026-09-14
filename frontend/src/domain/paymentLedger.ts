import type { TeamMember } from '@/data/session'
import type { Campaign, Creator, Payment } from '@/data/types'
import { getCampaignName } from './campaigns'
import { EVERY_CAMPAIGN, normaliseSearch, type CampaignFilter } from './creatorFiltering'
import type { SortDirection } from './creatorSorting'
import { hasBeenReversed, isReversal } from './paymentRecording'
import { getTeamMemberName } from './teamMembers'

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
  campaignId: number | null
  /** Resolved here so a renamed campaign reads correctly without a lookup. */
  campaignName: string
  /** Resolved the same way, from the id the payment actually stores. */
  recordedByName: string
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
export function buildPaymentLedger(
  creators: Creator[],
  directories: { campaigns: Campaign[]; teamMembers: TeamMember[] },
): LedgerEntry[] {
  const entries = creators.flatMap((creator) =>
    creator.payments.map((payment) => ({
      payment,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorCode: creator.creatorCode,
      campaignId: creator.campaignId,
      campaignName: getCampaignName(directories.campaigns, creator.campaignId),
      recordedByName: getTeamMemberName(directories.teamMembers, payment.recordedByTeamMemberId),
      isReversal: isReversal(payment),
      wasReversed: hasBeenReversed(payment, creator.payments),
    })),
  )

  return entries.sort(
    (left, right) =>
      right.payment.paidOn.localeCompare(left.payment.paidOn) || right.payment.id - left.payment.id,
  )
}

/** Everything the ledger can be narrowed by. */
export interface LedgerFilter {
  campaign: CampaignFilter
  /** Matched against the creator's name or code, or the payment reference. */
  searchText: string
  /** ISO date, inclusive. Empty means no lower bound. */
  paidFrom: string
  /** ISO date, inclusive. Empty means no upper bound. */
  paidTo: string
}

export const UNFILTERED_LEDGER: LedgerFilter = {
  campaign: EVERY_CAMPAIGN,
  searchText: '',
  paidFrom: '',
  paidTo: '',
}

export function filterLedgerByCampaign(
  entries: LedgerEntry[],
  campaign: CampaignFilter,
): LedgerEntry[] {
  if (campaign === EVERY_CAMPAIGN) return entries
  return entries.filter((entry) => entry.campaignId === campaign)
}

/**
 * The entries matching every part of the filter at once.
 *
 * The reference is searched because it is what a bank statement line carries:
 * reconciling means finding the payment behind "WISE-8842-B", not the person.
 *
 * Both ends of the date range are inclusive, since "from the 1st to the 14th"
 * means the 14th too. Dates are ISO strings, which compare correctly as text.
 * A range that ends before it starts matches nothing rather than being
 * silently swapped — see isDateRangeBackwards, which lets the screen say why.
 *
 * A reversal is filtered on its own date and reference like any other entry.
 * Narrowing to a month can therefore show a payment without the reversal that
 * later cancelled it; the Reversed tag on the payment is what says so.
 */
export function filterLedger(entries: LedgerEntry[], filter: LedgerFilter): LedgerEntry[] {
  const needle = normaliseSearch(filter.searchText)

  return filterLedgerByCampaign(entries, filter.campaign).filter((entry) => {
    const { paidOn, reference } = entry.payment
    if (filter.paidFrom && paidOn < filter.paidFrom) return false
    if (filter.paidTo && paidOn > filter.paidTo) return false
    if (!needle) return true
    return (
      entry.creatorName.toLowerCase().includes(needle) ||
      entry.creatorCode.toLowerCase().includes(needle) ||
      reference.toLowerCase().includes(needle)
    )
  })
}

/** True when both dates are set and the range ends before it starts. */
export function isDateRangeBackwards(filter: Pick<LedgerFilter, 'paidFrom' | 'paidTo'>): boolean {
  return Boolean(filter.paidFrom && filter.paidTo && filter.paidFrom > filter.paidTo)
}

export type LedgerSortColumn = 'date' | 'amount'

export interface LedgerSortSelection {
  column: LedgerSortColumn
  direction: SortDirection
}

/** How the ledger opens: newest first, the order a statement is read in. */
export const DEFAULT_LEDGER_SORT: LedgerSortSelection = { column: 'date', direction: 'descending' }

/**
 * A sorted copy of the entries; the input is left alone.
 *
 * Amount sorts on the signed figure, so on largest-first a reversal falls to
 * the bottom, below every payment — it took money back rather than paying
 * any. Entries that tie are ordered newest first, then most recently recorded
 * first, whichever way the column runs: a tie says nothing about direction,
 * and the most recent is the one being looked for.
 */
export function sortLedger(entries: LedgerEntry[], selection: LedgerSortSelection): LedgerEntry[] {
  const sign = selection.direction === 'ascending' ? 1 : -1

  return [...entries].sort((left, right) => {
    const primary =
      selection.column === 'amount'
        ? left.payment.amountInCents - right.payment.amountInCents
        : left.payment.paidOn.localeCompare(right.payment.paidOn)

    return (
      primary * sign ||
      right.payment.paidOn.localeCompare(left.payment.paidOn) ||
      right.payment.id - left.payment.id
    )
  })
}

/**
 * What clicking a sortable column heading does: the column already sorted
 * reverses, and any other column takes over largest or newest first, which is
 * the end of the ledger that is usually wanted.
 */
export function ledgerSortAfterColumnClick(
  current: LedgerSortSelection,
  column: LedgerSortColumn,
): LedgerSortSelection {
  if (current.column === column) {
    return { column, direction: current.direction === 'ascending' ? 'descending' : 'ascending' }
  }
  return { column, direction: 'descending' }
}

/**
 * The phone ledger has no column headings to click, so one button steps
 * through every order: date newest first, date oldest first, amount largest
 * first, amount smallest first, and round again.
 */
export function nextLedgerSort(current: LedgerSortSelection): LedgerSortSelection {
  if (current.direction === 'descending') return { ...current, direction: 'ascending' }
  return { column: current.column === 'date' ? 'amount' : 'date', direction: 'descending' }
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
