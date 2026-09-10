import { describe, expect, it } from 'vitest'
import { createTestCreator, createTestPayment } from '@/testing/createTestCreator'
import {
  getAmountPaid,
  getCostPerInstall,
  getLifecycleStatus,
  getOutstandingBalance,
  getPaymentProgressPercent,
  getUndeliveredStreamCount,
  hasDeliveredEveryCommittedStream,
  hasMeasurableCostPerInstall,
  hasOutstandingBalance,
  isAwaitingPayment,
  isPaidButUndelivered,
} from './creatorCalculations'

describe('getAmountPaid', () => {
  it('is zero when no payment has been recorded', () => {
    expect(getAmountPaid(createTestCreator({ payments: [] }))).toBe(0)
  })

  it('adds up every payment, so paying in stages accumulates', () => {
    const creator = createTestCreator({
      payments: [
        createTestPayment({ id: 1, amountInCents: 160000 }),
        createTestPayment({ id: 2, amountInCents: 160000 }),
        createTestPayment({ id: 3, amountInCents: 40000 }),
      ],
    })

    expect(getAmountPaid(creator)).toBe(360_000)
  })
})

describe('getOutstandingBalance', () => {
  it('is the whole contracted amount before anything is paid', () => {
    const creator = createTestCreator({ contractedAmountInCents: 480000, payments: [] })

    expect(getOutstandingBalance(creator)).toBe(480_000)
    expect(hasOutstandingBalance(creator)).toBe(true)
  })

  it('falls as partial payments come in', () => {
    const creator = createTestCreator({
      contractedAmountInCents: 480000,
      payments: [createTestPayment({ amountInCents: 160000 })],
    })

    expect(getOutstandingBalance(creator)).toBe(320_000)
  })

  it('is zero once the contract is fully paid', () => {
    const creator = createTestCreator({
      contractedAmountInCents: 240000,
      payments: [createTestPayment({ amountInCents: 240000 })],
    })

    expect(getOutstandingBalance(creator)).toBe(0)
    expect(hasOutstandingBalance(creator)).toBe(false)
  })

  it('never goes negative when a creator is overpaid', () => {
    // Documents current behaviour: overpayment is hidden rather than shown as
    // credit. This is open question Q5 — if overpayment should be visible,
    // this test is the one that has to change.
    const creator = createTestCreator({
      contractedAmountInCents: 100000,
      payments: [createTestPayment({ amountInCents: 150000 })],
    })

    expect(getOutstandingBalance(creator)).toBe(0)
  })
})

describe('getPaymentProgressPercent', () => {
  it('reports how far through the contracted amount we are', () => {
    const creator = createTestCreator({
      contractedAmountInCents: 400000,
      payments: [createTestPayment({ amountInCents: 100000 })],
    })

    expect(getPaymentProgressPercent(creator)).toBe(25)
  })

  it('is 100 when the balance closes', () => {
    const creator = createTestCreator({
      contractedAmountInCents: 400000,
      payments: [createTestPayment({ amountInCents: 400000 })],
    })

    expect(getPaymentProgressPercent(creator)).toBe(100)
  })

  it('is zero rather than a division error when nothing is contracted', () => {
    // A prospect with no deal yet has a contracted amount of zero.
    const creator = createTestCreator({ contractedAmountInCents: 0, payments: [] })

    expect(getPaymentProgressPercent(creator)).toBe(0)
  })
})

describe('getCostPerInstall', () => {
  it('divides money actually paid by installs credited', () => {
    const creator = createTestCreator({
      installsAttributed: 4000,
      payments: [createTestPayment({ amountInCents: 800000 })],
    })

    expect(getCostPerInstall(creator)).toBe(200)
    expect(hasMeasurableCostPerInstall(creator)).toBe(true)
  })

  it('is not measurable when nothing has been paid yet', () => {
    // The important one. Returning 0 here would rank an unpaid creator as the
    // cheapest on the campaign, which is the bug the design prototype had.
    const creator = createTestCreator({ installsAttributed: 5000, payments: [] })

    expect(getCostPerInstall(creator)).toBe(Infinity)
    expect(hasMeasurableCostPerInstall(creator)).toBe(false)
  })

  it('is not measurable when no installs have landed yet', () => {
    const creator = createTestCreator({
      installsAttributed: 0,
      payments: [createTestPayment({ amountInCents: 200000 })],
    })

    expect(getCostPerInstall(creator)).toBe(Infinity)
  })
})

describe('stream delivery', () => {
  it('counts a creator as delivered once they meet their commitment', () => {
    const creator = createTestCreator({ streamsCommitted: 3, streamsDelivered: 3 })

    expect(hasDeliveredEveryCommittedStream(creator)).toBe(true)
    expect(getUndeliveredStreamCount(creator)).toBe(0)
  })

  it('reports how many streams are still owed', () => {
    const creator = createTestCreator({ streamsCommitted: 4, streamsDelivered: 1 })

    expect(hasDeliveredEveryCommittedStream(creator)).toBe(false)
    expect(getUndeliveredStreamCount(creator)).toBe(3)
  })

  it('does not report a negative count when a creator overdelivers', () => {
    const creator = createTestCreator({ streamsCommitted: 2, streamsDelivered: 5 })

    expect(hasDeliveredEveryCommittedStream(creator)).toBe(true)
    expect(getUndeliveredStreamCount(creator)).toBe(0)
  })
})

describe('getLifecycleStatus', () => {
  it('is contracted when a deal exists but nothing has been streamed', () => {
    const creator = createTestCreator({ streamsCommitted: 3, streamsDelivered: 0 })

    expect(getLifecycleStatus(creator)).toBe('contracted')
  })

  it('is active once streaming starts', () => {
    const creator = createTestCreator({ streamsCommitted: 3, streamsDelivered: 1 })

    expect(getLifecycleStatus(creator)).toBe('active')
  })

  it('stays active while delivered in full but not yet fully paid', () => {
    const creator = createTestCreator({
      streamsCommitted: 2,
      streamsDelivered: 2,
      contractedAmountInCents: 200000,
      payments: [createTestPayment({ amountInCents: 50000 })],
    })

    expect(getLifecycleStatus(creator)).toBe('active')
  })

  it('stays active while fully paid but still owing streams', () => {
    const creator = createTestCreator({
      streamsCommitted: 4,
      streamsDelivered: 2,
      contractedAmountInCents: 200000,
      payments: [createTestPayment({ amountInCents: 200000 })],
    })

    expect(getLifecycleStatus(creator)).toBe('active')
  })

  it('is completed only when every stream is delivered and the balance is closed', () => {
    const creator = createTestCreator({
      streamsCommitted: 2,
      streamsDelivered: 2,
      contractedAmountInCents: 200000,
      payments: [createTestPayment({ amountInCents: 200000 })],
    })

    expect(getLifecycleStatus(creator)).toBe('completed')
  })
})

describe('the two status panels', () => {
  it('lists a delivered creator who is still owed money as awaiting payment', () => {
    const creator = createTestCreator({
      streamsCommitted: 2,
      streamsDelivered: 2,
      contractedAmountInCents: 300000,
      payments: [createTestPayment({ amountInCents: 100000 })],
    })

    expect(isAwaitingPayment(creator)).toBe(true)
    expect(isPaidButUndelivered(creator)).toBe(false)
  })

  it('lists a part-paid creator who still owes streams as paid but undelivered', () => {
    const creator = createTestCreator({
      streamsCommitted: 4,
      streamsDelivered: 1,
      contractedAmountInCents: 300000,
      payments: [createTestPayment({ amountInCents: 100000 })],
    })

    expect(isPaidButUndelivered(creator)).toBe(true)
    expect(isAwaitingPayment(creator)).toBe(false)
  })

  it('leaves a fully settled creator out of both panels', () => {
    const creator = createTestCreator({
      streamsCommitted: 2,
      streamsDelivered: 2,
      contractedAmountInCents: 200000,
      payments: [createTestPayment({ amountInCents: 200000 })],
    })

    expect(isAwaitingPayment(creator)).toBe(false)
    expect(isPaidButUndelivered(creator)).toBe(false)
  })

  it('leaves an unpaid creator who has not started out of both panels', () => {
    const creator = createTestCreator({ streamsCommitted: 3, streamsDelivered: 0, payments: [] })

    expect(isAwaitingPayment(creator)).toBe(false)
    expect(isPaidButUndelivered(creator)).toBe(false)
  })
})
