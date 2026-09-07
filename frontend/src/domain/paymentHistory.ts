import type { Payment } from '../data/types'

/**
 * Ordering rules for a creator's payment records.
 *
 * The payment list is the finance record, so it is never mutated in place —
 * every function here returns a new array and leaves its input alone.
 */

/**
 * Most recent payment first, which is the order the detail screen reads in:
 * the team almost always wants the last thing that went out, not the first.
 *
 * ISO dates compare correctly as strings, so no Date objects are involved.
 * Two payments made on the same day keep the order they were recorded in.
 */
export function sortPaymentsNewestFirst(payments: Payment[]): Payment[] {
  return [...payments].sort((left, right) => right.paidOn.localeCompare(left.paidOn))
}

/** How many payments make up the amount paid so far. */
export function countPayments(payments: Payment[]): number {
  return payments.length
}
