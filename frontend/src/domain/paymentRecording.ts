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

/**
 * What counts as an amount someone has typed: an optional sign, an optional
 * currency symbol, then either plain digits or digits grouped in threes by
 * commas, with an optional decimal part.
 *
 * The grouping is checked rather than tolerated. "1,2" is not an amount
 * anyone means, and stripping its comma first would turn a typo into a
 * confident $12.
 */
const TYPED_AMOUNT = /^-?\$?\s*(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?|\.\d+)$/

/**
 * Reads an amount a person typed into cents.
 *
 * Accepts what people actually type — a currency symbol, thousands
 * separators, surrounding spaces — and refuses anything it cannot read rather
 * than guessing, since a misread amount is worse than a rejected one. The
 * syntax is checked before any separator is removed, so a malformed amount
 * can never be normalised into a different, valid-looking one.
 *
 * Returns null when there is no amount in there to read.
 */
export function parseAmountToCents(typedAmount: string): number | null {
  const trimmed = typedAmount.trim()
  if (!TYPED_AMOUNT.test(trimmed)) return null

  // Safe now: the only separators left are ones the pattern allowed.
  return readDecimalAsCents(trimmed.replace(/[$,\s]/g, ''))
}

/**
 * Reads a plain decimal string as whole cents, without it ever being a float.
 *
 * Multiplying by 100 and rounding looks equivalent and is not. 1.005 is held
 * as a fraction under itself, so 1.005 * 100 lands below 100.5 and rounds
 * down to 100 -- while 10.005 lands above 1000.5 and rounds up to 1001. The
 * same half cent goes either way depending on where the binary value happens
 * to fall, which is no rule at all. Reading the digits settles it once.
 */
function readDecimalAsCents(decimal: string): number | null {
  const isNegative = decimal.startsWith('-')
  const [whole = '', fraction = ''] = decimal.replace('-', '').split('.')

  const cents = Number(whole || '0') * 100 + Number(fraction.slice(0, 2).padEnd(2, '0'))
  // Beyond this, cents cannot be counted exactly, and a payment that cannot
  // be counted is one to refuse rather than approximate.
  if (!Number.isSafeInteger(cents)) return null

  /* Half a cent or more rounds away from zero, so that a reversal is the
     exact mirror of the payment it undoes rather than a cent off it. */
  const roundsUp = (fraction[2] ?? '0') >= '5'
  const magnitude = roundsUp ? cents + 1 : cents
  if (!Number.isSafeInteger(magnitude)) return null

  return isNegative ? -magnitude : magnitude
}

/**
 * Everything wrong with a draft, in one place.
 *
 * Separate from the review because the review also answers what the payment
 * would do to a creator's balance, and none of these rules depend on who is
 * being paid -- an unreadable date is unreadable whoever the money is for.
 * Keeping them here is what lets the builder enforce exactly what the form
 * enforces, rather than a copy of it that falls behind the next rule added.
 */
function findPaymentProblems(draft: PaymentDraft, today: string): PaymentProblem[] {
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

  return problems
}

export function reviewPaymentDraft(
  draft: PaymentDraft,
  creator: Creator,
  today: string,
): PaymentDraftReview {
  const problems = findPaymentProblems(draft, today)
  const amountInCents = parseAmountToCents(draft.amount)

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

/**
 * The record a saved form becomes.
 *
 * It checks the whole draft again rather than trusting that review was run.
 * A payment is the one record here that is never edited afterwards (Q6), so
 * an entry with no method, or dated next March, is not a mistake anyone can
 * tidy up later -- it is a permanent line in the ledger. The date needs
 * today to be judged against, which is why the caller supplies it.
 */
export function buildPayment(
  draft: PaymentDraft,
  details: { id: number; recordedByTeamMemberId: string; today: string },
): Payment {
  const problems = findPaymentProblems(draft, details.today)
  const amountInCents = parseAmountToCents(draft.amount)

  if (problems.length > 0 || amountInCents === null) {
    throw new Error(
      `buildPayment was given a draft that never passed review: ${problems.join(', ')}`,
    )
  }

  return {
    id: details.id,
    paidOn: draft.paidOn.trim(),
    amountInCents,
    method: draft.method.trim(),
    reference: draft.reference.trim(),
    recordedByTeamMemberId: details.recordedByTeamMemberId,
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
  details: { id: number; reversedOn: string; recordedByTeamMemberId: string },
): Payment {
  return {
    id: details.id,
    paidOn: details.reversedOn,
    amountInCents: -payment.amountInCents,
    method: payment.method,
    reference: payment.reference,
    recordedByTeamMemberId: details.recordedByTeamMemberId,
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
