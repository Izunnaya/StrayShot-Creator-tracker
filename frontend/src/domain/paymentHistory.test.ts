import { describe, expect, it } from 'vitest'
import { creators as fixtureCreators } from '@/data/fixtures'
import { createTestPayment } from '@/testing/createTestCreator'
import { countPayments, sortPaymentsNewestFirst } from './paymentHistory'

const july = createTestPayment({ id: 1, paidOn: '2026-07-18', amount: 4500 })
const august = createTestPayment({ id: 2, paidOn: '2026-08-20', amount: 4500 })
const september = createTestPayment({ id: 3, paidOn: '2026-09-02', amount: 1000 })

describe('sortPaymentsNewestFirst', () => {
  it('puts the most recent payment first', () => {
    const sorted = sortPaymentsNewestFirst([july, september, august])

    expect(sorted.map((payment) => payment.id)).toEqual([3, 2, 1])
  })

  it('leaves the payments it was given untouched', () => {
    const original = [july, september, august]

    sortPaymentsNewestFirst(original)

    expect(original.map((payment) => payment.id)).toEqual([1, 3, 2])
  })

  it('keeps payments made on the same day in the order they were recorded', () => {
    const first = createTestPayment({ id: 10, paidOn: '2026-08-20' })
    const second = createTestPayment({ id: 11, paidOn: '2026-08-20' })

    expect(sortPaymentsNewestFirst([first, second]).map((payment) => payment.id)).toEqual([10, 11])
  })

  it('handles a creator with no payments', () => {
    expect(sortPaymentsNewestFirst([])).toEqual([])
  })

  it('orders a real creator record newest first', () => {
    const grimTactix = fixtureCreators.find((creator) => creator.creatorCode === 'GRIM')!

    const sorted = sortPaymentsNewestFirst(grimTactix.payments)

    expect(sorted[0]!.paidOn).toBe('2026-08-18')
  })
})

describe('countPayments', () => {
  it('counts the records that make up the amount paid', () => {
    expect(countPayments([july, august])).toBe(2)
    expect(countPayments([])).toBe(0)
  })
})
