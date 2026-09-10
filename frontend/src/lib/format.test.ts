import { describe, expect, it } from 'vitest'
import { createTestCreator, createTestPayment } from '@/testing/createTestCreator'
import { getAmountPaid, getOutstandingBalance } from '@/domain/creatorCalculations'
import { formatCostPerInstall, formatMoney, formatPaymentAmount } from './format'

/**
 * Money is held in cents everywhere and only becomes dollars here.
 *
 * These tests exist because the failure they guard against is silent: a total
 * that is a penny out looks entirely reasonable on screen, and only surfaces
 * when someone reconciles it against a bank statement.
 */

describe('formatMoney', () => {
  it('reads whole dollars, for totals where the design shows no cents', () => {
    expect(formatMoney(480_000)).toBe('$4,800')
    expect(formatMoney(4_700_000)).toBe('$47,000')
    expect(formatMoney(0)).toBe('$0')
  })

  it('puts the sign before the currency, for the negative half of a reversal', () => {
    expect(formatMoney(-160_000)).toBe('-$1,600')
    expect(formatPaymentAmount(-160_000)).toBe('-$1,600.00')
  })

  it('rounds to the nearest dollar rather than truncating', () => {
    expect(formatMoney(10_049)).toBe('$100')
    expect(formatMoney(10_050)).toBe('$101')
  })
})

describe('formatPaymentAmount', () => {
  it('keeps the exact amount, because these rows are read against a statement', () => {
    expect(formatPaymentAmount(10_049)).toBe('$100.49')
    expect(formatPaymentAmount(1)).toBe('$0.01')
    expect(formatPaymentAmount(160_000)).toBe('$1,600.00')
  })
})

describe('formatCostPerInstall', () => {
  it('reads cents per install as dollars', () => {
    expect(formatCostPerInstall(183.99)).toBe('$1.84')
    expect(formatCostPerInstall(200)).toBe('$2.00')
  })

  it('renders an em dash when there is nothing to measure', () => {
    expect(formatCostPerInstall(Infinity)).toBe('—')
  })
})

describe('money held in cents', () => {
  it('sums exactly, where dollars as floats would drift', () => {
    const creator = createTestCreator({
      contractedAmountInCents: 100_000,
      payments: [
        createTestPayment({ id: 1, amountInCents: 10 }),
        createTestPayment({ id: 2, amountInCents: 20 }),
        createTestPayment({ id: 3, amountInCents: 70 }),
      ],
    })

    // The same figures as dollars: 0.1 + 0.2 + 0.7 is 0.9999999999999999.
    expect(getAmountPaid(creator)).toBe(100)
    expect(formatPaymentAmount(getAmountPaid(creator))).toBe('$1.00')
  })

  it('survives a payment with cents through the whole balance calculation', () => {
    const creator = createTestCreator({
      contractedAmountInCents: 25_000,
      payments: [createTestPayment({ amountInCents: 10_049 })],
    })

    expect(getOutstandingBalance(creator)).toBe(14_951)
    expect(formatPaymentAmount(getOutstandingBalance(creator))).toBe('$149.51')
  })
})
