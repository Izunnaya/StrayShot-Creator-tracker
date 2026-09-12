import { describe, expect, it } from 'vitest'
import {
  createTestCampaign,
  createTestCreator,
  createTestPayment,
} from '@/testing/createTestCreator'
import { EVERY_CAMPAIGN } from './creatorFiltering'
import { buildPaymentLedger, filterLedgerByCampaign, summariseLedger } from './paymentLedger'

const campaigns = [
  createTestCampaign({ id: 1, name: 'Season 2 Launch' }),
  createTestCampaign({ id: 2, name: 'Clan Wars Update' }),
]

const creators = [
  createTestCreator({
    id: 1,
    name: 'NovaKess',
    creatorCode: 'NOVA',
    campaignId: 1,
    payments: [
      createTestPayment({ id: 10, paidOn: '2026-08-01', amountInCents: 100_000 }),
      createTestPayment({ id: 12, paidOn: '2026-08-14', amountInCents: 60_000 }),
    ],
  }),
  createTestCreator({
    id: 2,
    name: 'AshFall',
    creatorCode: 'ASH',
    campaignId: 2,
    payments: [createTestPayment({ id: 11, paidOn: '2026-08-14', amountInCents: 40_000 })],
  }),
]

describe('building the ledger', () => {
  it('gathers every payment across every creator', () => {
    expect(buildPaymentLedger(creators, campaigns).map((entry) => entry.payment.id)).toHaveLength(3)
  })

  it('puts the most recent first, and the last recorded first within a day', () => {
    // 12 and 11 were both paid on the 14th; 12 was recorded after 11.
    expect(buildPaymentLedger(creators, campaigns).map((entry) => entry.payment.id)).toEqual([
      12, 11, 10,
    ])
  })

  it('names who was paid and which campaign it came out of', () => {
    const [newest] = buildPaymentLedger(creators, campaigns)

    expect(newest?.creatorName).toBe('NovaKess')
    expect(newest?.creatorCode).toBe('NOVA')
    expect(newest?.campaignName).toBe('Season 2 Launch')
  })

  it('says so rather than leaving a hole when the campaign has gone', () => {
    const stranded = [createTestCreator({ campaignId: 99, payments: [createTestPayment()] })]

    expect(buildPaymentLedger(stranded, campaigns)[0]?.campaignName).toBe('No campaign')
  })

  it('marks both halves of a cancelled pair', () => {
    const withReversal = [
      createTestCreator({
        payments: [
          createTestPayment({ id: 1, amountInCents: 100_000 }),
          createTestPayment({ id: 2, amountInCents: -100_000, reversesPaymentId: 1 }),
        ],
      }),
    ]

    const ledger = buildPaymentLedger(withReversal, campaigns)

    expect(ledger.find((entry) => entry.payment.id === 2)?.isReversal).toBe(true)
    expect(ledger.find((entry) => entry.payment.id === 1)?.wasReversed).toBe(true)
  })

  it('has nothing in it before anyone has been paid', () => {
    expect(buildPaymentLedger([createTestCreator({ payments: [] })], campaigns)).toEqual([])
  })
})

describe('narrowing the ledger to one campaign', () => {
  it('keeps only what that campaign paid for', () => {
    const ledger = buildPaymentLedger(creators, campaigns)

    expect(filterLedgerByCampaign(ledger, 2).map((entry) => entry.payment.id)).toEqual([11])
  })

  it('keeps everything when no campaign is chosen', () => {
    const ledger = buildPaymentLedger(creators, campaigns)

    expect(filterLedgerByCampaign(ledger, EVERY_CAMPAIGN)).toHaveLength(3)
  })
})

describe('what the entries in view add up to', () => {
  it('totals what was paid, and to how many people', () => {
    const totals = summariseLedger(buildPaymentLedger(creators, campaigns))

    expect(totals.netInCents).toBe(200_000)
    expect(totals.entryCount).toBe(3)
    expect(totals.creatorCount).toBe(2)
  })

  it('nets a reversal off, and still reports what was cancelled', () => {
    /* A bank statement shows both lines; what the campaign cost is the
       difference between them. The ledger has to answer either question. */
    const withReversal = [
      createTestCreator({
        payments: [
          createTestPayment({ id: 1, amountInCents: 100_000 }),
          createTestPayment({ id: 2, amountInCents: -100_000, reversesPaymentId: 1 }),
          createTestPayment({ id: 3, amountInCents: 25_000 }),
        ],
      }),
    ]

    const totals = summariseLedger(buildPaymentLedger(withReversal, campaigns))

    expect(totals.grossInCents).toBe(125_000)
    expect(totals.reversedInCents).toBe(100_000)
    expect(totals.netInCents).toBe(25_000)
    expect(totals.entryCount).toBe(3)
  })

  it('counts a creator once however many times they were paid', () => {
    const totals = summariseLedger(buildPaymentLedger([creators[0]!], campaigns))

    expect(totals.creatorCount).toBe(1)
    expect(totals.entryCount).toBe(2)
  })

  it('is all zeroes on an empty ledger rather than undefined', () => {
    expect(summariseLedger([])).toEqual({
      netInCents: 0,
      grossInCents: 0,
      reversedInCents: 0,
      entryCount: 0,
      creatorCount: 0,
    })
  })
})
