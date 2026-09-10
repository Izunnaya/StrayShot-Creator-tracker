import type { Creator, CreatorLifecycleStatus } from '@/data/types'

/**
 * Everything the application knows how to work out about a single creator.
 *
 * These are pure functions over a Creator. They do not know where the creator
 * came from (fixture or API) and they do not know how anything is displayed.
 */

/** Total of every payment recorded against this creator, in cents. */
export function getAmountPaid(creator: Creator): number {
  return creator.payments.reduce((runningTotal, payment) => runningTotal + payment.amountInCents, 0)
}

/**
 * What is still owed on the agreed contract, in cents. Never negative: paying more than
 * the contracted amount currently shows as a zero balance rather than credit,
 * which is open question Q5.
 */
export function getOutstandingBalance(creator: Creator): number {
  return Math.max(0, creator.contractedAmountInCents - getAmountPaid(creator))
}

/**
 * Money paid beyond the agreed total, in cents. Zero unless someone has
 * overpaid.
 *
 * Kept separate from the outstanding balance rather than letting that go
 * negative: nobody owes a negative amount, and the two are different facts
 * that the team acts on differently. An overpayment is a reconciliation job,
 * not a debt. See DECISIONS.md, Q5.
 */
export function getOverpaymentAmount(creator: Creator): number {
  return Math.max(0, getAmountPaid(creator) - creator.contractedAmountInCents)
}

export function isOverpaid(creator: Creator): boolean {
  return getOverpaymentAmount(creator) > 0
}

export function hasOutstandingBalance(creator: Creator): boolean {
  return getOutstandingBalance(creator) > 0
}

/** How far through the contracted amount we have paid, 0 to 100. */
export function getPaymentProgressPercent(creator: Creator): number {
  if (creator.contractedAmountInCents === 0) return 0
  return (getAmountPaid(creator) / creator.contractedAmountInCents) * 100
}

/**
 * What each install has cost so far in cents, measured on money actually paid
 * rather than money committed.
 *
 * Returns Infinity when nothing has been paid yet. That is deliberate: a
 * creator who has been paid nothing has no measurable cost per install, and
 * returning Infinity makes them render as "—", sort to the bottom of the
 * table, and fall outside every rating band without any special-casing at the
 * call sites. Returning 0 would rank them as the most efficient spend on the
 * campaign, which is how the prototype originally got this wrong.
 */
export function getCostPerInstall(creator: Creator): number {
  const amountPaid = getAmountPaid(creator)
  if (creator.installsAttributed === 0 || amountPaid === 0) return Infinity
  return amountPaid / creator.installsAttributed
}

export function hasMeasurableCostPerInstall(creator: Creator): boolean {
  return Number.isFinite(getCostPerInstall(creator))
}

/** Has this creator delivered every stream their deal commits them to? */
export function hasDeliveredEveryCommittedStream(creator: Creator): boolean {
  return creator.streamsDelivered >= creator.streamsCommitted
}

/** How many committed streams are still outstanding. Never negative. */
export function getUndeliveredStreamCount(creator: Creator): number {
  return Math.max(0, creator.streamsCommitted - creator.streamsDelivered)
}

/**
 * Where the creator sits in the working relationship.
 *
 * Derived from delivery and payment rather than stored, so it can never
 * contradict the underlying records. Whether the team should also be able to
 * set it by hand is open question Q24; if the answer is yes, this function
 * becomes the fallback for creators with no manual override, and this is the
 * only place that has to change.
 */
export function getLifecycleStatus(creator: Creator): CreatorLifecycleStatus {
  // Until deals have their own records, absence of all deal activity means prospect.
  if (
    creator.streamsCommitted === 0 &&
    creator.contractedAmountInCents === 0 &&
    creator.streamsDelivered === 0 &&
    creator.payments.length === 0
  )
    return 'prospect'

  const fullyDelivered = hasDeliveredEveryCommittedStream(creator)
  const fullyPaid = getAmountPaid(creator) >= creator.contractedAmountInCents

  if (fullyDelivered && fullyPaid) return 'completed'
  return creator.streamsDelivered > 0 ? 'active' : 'contracted'
}

/**
 * Delivered every committed stream but still owed money. These are the rows
 * the team needs to act on, and they drive the "Delivered, payment open" panel.
 */
export function isAwaitingPayment(creator: Creator): boolean {
  return hasDeliveredEveryCommittedStream(creator) && hasOutstandingBalance(creator)
}

/**
 * Has taken money but still owes streams. The mirror image of the above, and
 * the reason the dashboard shows a "Paid, not delivered" panel at all.
 */
export function isPaidButUndelivered(creator: Creator): boolean {
  return !hasDeliveredEveryCommittedStream(creator) && getAmountPaid(creator) > 0
}
