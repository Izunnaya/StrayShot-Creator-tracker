import { describe, expect, it } from 'vitest'
import { createTestCreator, createTestPayment } from '@/testing/createTestCreator'
import { getAmountPaid, getOverpaymentAmount, isOverpaid } from './creatorCalculations'
import {
  buildPayment,
  buildReversal,
  canReverse,
  getStandingPayments,
  hasBeenReversed,
  isReversal,
  parseAmountToCents,
  reviewPaymentDraft,
  type PaymentDraft,
} from './paymentRecording'

const TODAY = '2026-09-10'

const draft = (overrides: Partial<PaymentDraft> = {}): PaymentDraft => ({
  amount: '1000',
  paidOn: '2026-09-01',
  method: 'Bank transfer',
  reference: 'TRF-1',
  ...overrides,
})

/** Agreed $5,000, already paid $2,000, so $3,000 is open. */
const partlyPaidCreator = createTestCreator({
  contractedAmountInCents: 500_000,
  payments: [createTestPayment({ id: 1, amountInCents: 200_000 })],
})

describe('parseAmountToCents', () => {
  it('reads what people actually type', () => {
    expect(parseAmountToCents('1600')).toBe(160_000)
    expect(parseAmountToCents('$1,600.50')).toBe(160_050)
    expect(parseAmountToCents('  100.49  ')).toBe(10_049)
    expect(parseAmountToCents('.5')).toBe(50)
  })

  it('rounds to the nearest cent rather than carrying a fraction of one', () => {
    expect(parseAmountToCents('10.005')).toBe(1001)
    expect(parseAmountToCents('10.004')).toBe(1000)
  })

  it('rounds the same half cent the same way, whatever the amount', () => {
    /* Multiplying by 100 and rounding sent these in different directions:
       1.005 * 100 lands below 100.5 in binary and went down to 100, while
       10.005 lands above 1000.5 and went up. Same half cent, two answers. */
    expect(parseAmountToCents('1.005')).toBe(101)
    expect(parseAmountToCents('1.015')).toBe(102)
    expect(parseAmountToCents('0.005')).toBe(1)
    expect(parseAmountToCents('2.675')).toBe(268)
    expect(parseAmountToCents('1,234,567.895')).toBe(123_456_790)
  })

  it('rounds a reversal to the mirror of what it undoes', () => {
    // A reversal a cent away from its payment leaves a balance behind it.
    expect(parseAmountToCents('-1.005')).toBe(-101)
    expect(parseAmountToCents('-10.005')).toBe(-1001)
  })

  it('refuses an amount too large to count in exact cents', () => {
    expect(parseAmountToCents('999999999999999999')).toBeNull()
  })

  it('refuses what it cannot read rather than guessing', () => {
    expect(parseAmountToCents('')).toBeNull()
    expect(parseAmountToCents('   ')).toBeNull()
    expect(parseAmountToCents('twelve')).toBeNull()
    expect(parseAmountToCents('1600 USD')).toBeNull()
    expect(parseAmountToCents('1.2.3')).toBeNull()
  })

  it('refuses misgrouped separators instead of normalising them into a number', () => {
    // Stripping the comma first would read each of these as a real amount.
    expect(parseAmountToCents('1,2')).toBeNull()
    expect(parseAmountToCents('12,34')).toBeNull()
    expect(parseAmountToCents('1,00,000')).toBeNull()
    expect(parseAmountToCents('1,6000')).toBeNull()
    expect(parseAmountToCents(',500')).toBeNull()
    expect(parseAmountToCents('1 600')).toBeNull()
  })

  it('still accepts properly grouped thousands, at any size', () => {
    expect(parseAmountToCents('1,600')).toBe(160_000)
    expect(parseAmountToCents('12,000')).toBe(1_200_000)
    expect(parseAmountToCents('1,234,567.89')).toBe(123_456_789)
  })
})

describe('reviewPaymentDraft', () => {
  it('accepts a straightforward payment and says what the balance becomes', () => {
    const review = reviewPaymentDraft(draft({ amount: '1000' }), partlyPaidCreator, TODAY)

    expect(review.problems).toEqual([])
    expect(review.canSave).toBe(true)
    expect(review.amountInCents).toBe(100_000)
    expect(review.amountPaidAfterInCents).toBe(300_000)
    expect(review.outstandingAfterInCents).toBe(200_000)
    expect(review.settlesBalance).toBe(false)
  })

  it('recognises the payment that closes the balance', () => {
    const review = reviewPaymentDraft(draft({ amount: '3000' }), partlyPaidCreator, TODAY)

    expect(review.settlesBalance).toBe(true)
    expect(review.outstandingAfterInCents).toBe(0)
    expect(review.overpaymentAfterInCents).toBe(0)
  })

  it('allows an overpayment and reports it rather than blocking the save', () => {
    const review = reviewPaymentDraft(draft({ amount: '3500' }), partlyPaidCreator, TODAY)

    expect(review.canSave).toBe(true)
    expect(review.problems).toEqual([])
    expect(review.overpaymentAfterInCents).toBe(50_000)
    expect(review.outstandingAfterInCents).toBe(0)
  })

  it('rejects an amount that is missing, unreadable or not positive', () => {
    expect(reviewPaymentDraft(draft({ amount: '' }), partlyPaidCreator, TODAY).problems).toEqual([
      'amount-missing',
    ])
    expect(
      reviewPaymentDraft(draft({ amount: 'twelve' }), partlyPaidCreator, TODAY).problems,
    ).toEqual(['amount-unreadable'])
    expect(reviewPaymentDraft(draft({ amount: '0' }), partlyPaidCreator, TODAY).problems).toEqual([
      'amount-not-positive',
    ])
    expect(reviewPaymentDraft(draft({ amount: '-50' }), partlyPaidCreator, TODAY).problems).toEqual(
      ['amount-not-positive'],
    )
  })

  it('rejects a payment dated in the future, since it has not happened', () => {
    const review = reviewPaymentDraft(draft({ paidOn: '2026-09-11' }), partlyPaidCreator, TODAY)

    expect(review.problems).toEqual(['date-in-future'])
  })

  it('rejects a date that never happened, rather than comparing it as a string', () => {
    // Lexicographically this sits before TODAY and would sail through.
    const review = reviewPaymentDraft(draft({ paidOn: '2026-02-30' }), partlyPaidCreator, TODAY)

    expect(review.problems).toEqual(['date-unreadable'])
    expect(review.canSave).toBe(false)
  })

  it('rejects dates that are not written as YYYY-MM-DD', () => {
    const problemsFor = (paidOn: string) =>
      reviewPaymentDraft(draft({ paidOn }), partlyPaidCreator, TODAY).problems

    expect(problemsFor('2026-9-1')).toEqual(['date-unreadable'])
    expect(problemsFor('01/09/2026')).toEqual(['date-unreadable'])
    expect(problemsFor('yesterday')).toEqual(['date-unreadable'])
    expect(problemsFor('2026-13-01')).toEqual(['date-unreadable'])
    expect(problemsFor('2026-09-00')).toEqual(['date-unreadable'])
  })

  it('accepts the last day of a real month, including a leap day', () => {
    expect(
      reviewPaymentDraft(draft({ paidOn: '2026-02-28' }), partlyPaidCreator, TODAY).canSave,
    ).toBe(true)
    expect(
      reviewPaymentDraft(draft({ paidOn: '2024-02-29' }), partlyPaidCreator, TODAY).canSave,
    ).toBe(true)
    expect(
      reviewPaymentDraft(draft({ paidOn: '2026-02-29' }), partlyPaidCreator, TODAY).problems,
    ).toEqual(['date-unreadable'])
  })

  it('accepts a payment dated today', () => {
    expect(reviewPaymentDraft(draft({ paidOn: TODAY }), partlyPaidCreator, TODAY).canSave).toBe(
      true,
    )
  })

  it('reports every problem at once rather than one at a time', () => {
    const review = reviewPaymentDraft(
      draft({ amount: '', paidOn: '', method: '' }),
      partlyPaidCreator,
      TODAY,
    )

    expect(review.problems).toEqual(['amount-missing', 'date-missing', 'method-missing'])
    expect(review.canSave).toBe(false)
  })

  it('leaves the projected balance untouched when the amount cannot be read', () => {
    const review = reviewPaymentDraft(draft({ amount: 'twelve' }), partlyPaidCreator, TODAY)

    expect(review.amountInCents).toBeNull()
    expect(review.amountPaidAfterInCents).toBe(200_000)
    expect(review.outstandingAfterInCents).toBe(300_000)
  })
})

describe('buildPayment', () => {
  it('stamps who recorded it rather than taking it from the form', () => {
    const payment = buildPayment(draft({ amount: '$1,600.50', reference: '  TRF-9  ' }), {
      id: 42,
      recordedByTeamMemberId: 'tm-kosei',
      today: TODAY,
    })

    expect(payment).toEqual({
      id: 42,
      paidOn: '2026-09-01',
      amountInCents: 160_050,
      method: 'Bank transfer',
      reference: 'TRF-9',
      recordedByTeamMemberId: 'tm-kosei',
    })
  })

  it('refuses a draft that never passed review', () => {
    const build = (overrides: Partial<PaymentDraft>) =>
      buildPayment(draft(overrides), { id: 1, recordedByTeamMemberId: 'tm-kosei', today: TODAY })

    // Everything review rejects, this rejects: reaching it with one of these
    // means the caller skipped review.
    expect(() => build({ amount: 'twelve' })).toThrow()
    expect(() => build({ amount: '' })).toThrow()
    expect(() => build({ amount: '0' })).toThrow()
    expect(() => build({ amount: '-50' })).toThrow()
  })

  it('refuses everything else review refuses, not only the amount', () => {
    /* A payment is never edited afterwards (Q6), so a record with no method
       or dated next March is a permanent line in the ledger rather than
       something anyone can tidy up. */
    const build = (overrides: Partial<PaymentDraft>) =>
      buildPayment(draft(overrides), { id: 1, recordedByTeamMemberId: 'tm-kosei', today: TODAY })

    expect(() => build({ method: '   ' })).toThrow(/method-missing/)
    expect(() => build({ paidOn: '' })).toThrow(/date-missing/)
    expect(() => build({ paidOn: '2026-02-30' })).toThrow(/date-unreadable/)
    expect(() => build({ paidOn: '2026-09-11' })).toThrow(/date-in-future/)
  })

  it('agrees with the review, rule for rule', () => {
    // The two read the same list, so neither can fall behind the other.
    const invalid = [
      { amount: 'twelve' },
      { amount: '' },
      { amount: '0' },
      { method: '' },
      { paidOn: '' },
      { paidOn: '2026-02-30' },
      { paidOn: '2026-09-11' },
    ]

    for (const overrides of invalid) {
      const refused =
        reviewPaymentDraft(draft(overrides), partlyPaidCreator, TODAY).canSave === false
      expect({ overrides, refused }).toEqual({ overrides, refused: true })
      expect(() =>
        buildPayment(draft(overrides), {
          id: 1,
          recordedByTeamMemberId: 'tm-kosei',
          today: TODAY,
        }),
      ).toThrow()
    }
  })
})

describe('reversing a payment', () => {
  const original = createTestPayment({ id: 7, amountInCents: 160_000, reference: 'TRF-9' })

  it('cancels the money without touching the original record', () => {
    const reversal = buildReversal(original, {
      id: 8,
      reversedOn: TODAY,
      recordedByTeamMemberId: 'tm-mdevlin',
    })

    expect(reversal.amountInCents).toBe(-160_000)
    expect(reversal.reversesPaymentId).toBe(7)
    expect(original.amountInCents).toBe(160_000)
  })

  it('nets to nothing once both records are summed', () => {
    const reversal = buildReversal(original, {
      id: 8,
      reversedOn: TODAY,
      recordedByTeamMemberId: 'tm-mdevlin',
    })
    const creator = createTestCreator({ payments: [original, reversal] })

    expect(getAmountPaid(creator)).toBe(0)
  })

  it('knows which records are reversals and which have been reversed', () => {
    const reversal = buildReversal(original, {
      id: 8,
      reversedOn: TODAY,
      recordedByTeamMemberId: 'tm-mdevlin',
    })
    const payments = [original, reversal]

    expect(isReversal(reversal)).toBe(true)
    expect(isReversal(original)).toBe(false)
    expect(hasBeenReversed(original, payments)).toBe(true)
    expect(hasBeenReversed(reversal, payments)).toBe(false)
  })

  it('will not reverse a reversal, or reverse the same payment twice', () => {
    const reversal = buildReversal(original, {
      id: 8,
      reversedOn: TODAY,
      recordedByTeamMemberId: 'tm-mdevlin',
    })
    const payments = [original, reversal]

    expect(canReverse(original, [original])).toBe(true)
    expect(canReverse(original, payments)).toBe(false)
    expect(canReverse(reversal, payments)).toBe(false)
  })

  it('leaves only the payments that still stand, for counting', () => {
    const untouched = createTestPayment({ id: 9, amountInCents: 50_000 })
    const reversal = buildReversal(original, {
      id: 8,
      reversedOn: TODAY,
      recordedByTeamMemberId: 'tm-mdevlin',
    })

    const standing = getStandingPayments([original, reversal, untouched])

    expect(standing.map((payment) => payment.id)).toEqual([9])
  })
})

describe('overpayment', () => {
  it('is reported separately from the outstanding balance', () => {
    const creator = createTestCreator({
      contractedAmountInCents: 100_000,
      payments: [createTestPayment({ amountInCents: 120_000 })],
    })

    expect(getOverpaymentAmount(creator)).toBe(20_000)
    expect(isOverpaid(creator)).toBe(true)
  })

  it('is zero for a creator paid exactly, or paid nothing', () => {
    const settled = createTestCreator({
      contractedAmountInCents: 100_000,
      payments: [createTestPayment({ amountInCents: 100_000 })],
    })
    const unpaid = createTestCreator({ contractedAmountInCents: 100_000, payments: [] })

    expect(getOverpaymentAmount(settled)).toBe(0)
    expect(getOverpaymentAmount(unpaid)).toBe(0)
  })
})
