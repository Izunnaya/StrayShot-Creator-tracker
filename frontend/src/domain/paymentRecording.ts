import type { Creator, Payment } from '@/data/types'
import { getAmountPaid, getOutstandingBalance } from './creatorCalculations'

/**
 * The rules for recording a payment, and for undoing one.
 *
 * This module judges a draft — is the amount readable, does the date make
 * sense, does it overshoot the balance — and builds the records that result.
 * It decides nothing about how any of that is worded or laid out: it returns
 * codes, and the modal turns them into sentences, the same split the
 * cost-per-install rating uses.
 */

/** A payment as it exists in the form, before anyone has agreed it is valid. */
export interface PaymentDraft {
  /** As typed, in dollars: "1,600", "$1600.50", "  " are all possible. */
  amount: string
  paidOn: string
  method: string
  reference: string
}

/**
 * Why a draft cannot be saved. Overpayment is deliberately absent: it is a
 * warning, not a problem, because the money has already left the bank —
 * refusing the record would only make the tracker disagree with the
 * statement. See DECISIONS.md, Q5.
 */
export type PaymentProblem =
  | 'amount-missing'
  | 'amount-unreadable'
  | 'amount-not-positive'
  | 'date-missing'
  | 'date-unreadable'
  | 'date-in-future'
  | 'method-missing'

export interface PaymentDraftReview {
  problems: PaymentProblem[]
  canSave: boolean
  /** Null when the amount could not be read at all. */
  amountInCents: number | null
  /** What the creator will have been paid once this saves, in cents. */
  amountPaidAfterInCents: number
  /** What will still be owed afterwards, in cents. Never negative. */
  outstandingAfterInCents: number
  /** How far past the agreed total this payment takes them, in cents. */
  overpaymentAfterInCents: number
  /** True when saving closes the balance exactly or beyond. */
  settlesBalance: boolean
}

/**
 * Reads an amount a person typed into cents.
 *
 * Accepts what people actually type — a currency symbol, thousands
 * separators, trailing spaces — and rejects anything it cannot read rather
 * than guessing, since a misread amount is worse than a rejected one.
 * Returns null when there is no number in there at all.
 */
/**
 * Whether a string is a date that exists.
 *
 * Dates are compared as strings elsewhere in this module, which is exact for
 * ISO dates and nonsense for anything else: "2026-02-30" sorts before
 * "2026-09-10" perfectly happily while being a day that never happened. The
 * date input in the modal will not produce one, but this rule also has to
 * hold for anything the API sends, so the check belongs here rather than
 * being assumed of the caller.
 */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number) as [number, number, number]
  const asDate = new Date(Date.UTC(year, month - 1, day))

  // A date that rolled over — 30 February becoming 2 March — is not the date
  // it was written as.
  return (
    asDate.getUTCFullYear() === year &&
    asDate.getUTCMonth() === month - 1 &&
    asDate.getUTCDate() === day
  )
}

export function parseAmountToCents(typedAmount: string): number | null {
  const cleaned = typedAmount.trim().replace(/[$,\s]/g, '')
  if (cleaned === '') return null
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null

  const asNumber = Number(cleaned)
  if (!Number.isFinite(asNumber)) return null

  return Math.round(asNumber * 100)
}

export function reviewPaymentDraft(
  draft: PaymentDraft,
  creator: Creator,
  today: string,
): PaymentDraftReview {
  const problems: PaymentProblem[] = []
  const amountInCents = parseAmountToCents(draft.amount)

  if (draft.amount.trim() === '') problems.push('amount-missing')
  else if (amountInCents === null) problems.push('amount-unreadable')
  else if (amountInCents <= 0) problems.push('amount-not-positive')

  const paidOn = draft.paidOn.trim()
  if (paidOn === '') problems.push('date-missing')
  else if (!isCalendarDate(paidOn)) problems.push('date-unreadable')
  else if (paidOn > today) problems.push('date-in-future')

  if (draft.method.trim() === '') problems.push('method-missing')

  const paymentTowardsBalance = amountInCents !== null && amountInCents > 0 ? amountInCents : 0
  const amountPaidAfterInCents = getAmountPaid(creator) + paymentTowardsBalance
  const outstandingAfterInCents = Math.max(
    0,
    creator.contractedAmountInCents - amountPaidAfterInCents,
  )

  return {
    problems,
    canSave: problems.length === 0,
    amountInCents,
    amountPaidAfterInCents,
    outstandingAfterInCents,
    overpaymentAfterInCents: Math.max(0, amountPaidAfterInCents - creator.contractedAmountInCents),
    settlesBalance: paymentTowardsBalance > 0 && outstandingAfterInCents === 0,
  }
}

/** The amount that would close the balance exactly, for the shortcut button. */
export function getAmountToSettle(creator: Creator): number {
  return getOutstandingBalance(creator)
}

export function buildPayment(
  draft: PaymentDraft,
  details: { id: number; recordedBy: string },
): Payment {
  const amountInCents = parseAmountToCents(draft.amount)
  if (amountInCents === null) {
    throw new Error('buildPayment was given a draft that never passed review')
  }

  return {
    id: details.id,
    paidOn: draft.paidOn,
    amountInCents,
    method: draft.method,
    reference: draft.reference.trim(),
    recordedBy: details.recordedBy,
  }
}

/**
 * The record that cancels a payment: the same money, signed the other way,
 * pointing back at what it undoes.
 *
 * The original is left exactly as it was. Both rows stay in the ledger, which
 * is the point — the history shows that something was recorded and then
 * corrected, rather than quietly showing a different number than it did last
 * month.
 */
export function buildReversal(
  payment: Payment,
  details: { id: number; reversedOn: string; recordedBy: string },
): Payment {
  return {
    id: details.id,
    paidOn: details.reversedOn,
    amountInCents: -payment.amountInCents,
    method: payment.method,
    reference: payment.reference,
    recordedBy: details.recordedBy,
    reversesPaymentId: payment.id,
  }
}

export function isReversal(payment: Payment): boolean {
  return payment.reversesPaymentId !== undefined
}

export function hasBeenReversed(payment: Payment, payments: Payment[]): boolean {
  return payments.some((other) => other.reversesPaymentId === payment.id)
}

/**
 * Whether this payment can still be reversed: a reversal cannot itself be
 * reversed, and nothing can be reversed twice.
 */
export function canReverse(payment: Payment, payments: Payment[]): boolean {
  return !isReversal(payment) && !hasBeenReversed(payment, payments)
}

/**
 * The payments that still stand — neither a reversal nor reversed by one.
 *
 * Used for counting ("paid across three payments"), never for summing: the
 * totals add up every record, and a reversal's negative amount is exactly
 * what makes that arithmetic come out right.
 */
export function getStandingPayments(payments: Payment[]): Payment[] {
  return payments.filter((payment) => !isReversal(payment) && !hasBeenReversed(payment, payments))
}
