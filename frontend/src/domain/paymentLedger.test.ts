import { describe, expect, it } from 'vitest'
import {
  createTestCampaign,
  createTestCreator,
  createTestPayment,
} from '@/testing/createTestCreator'
import { EVERY_CAMPAIGN } from './creatorFiltering'
import { teamMembers } from '@/data/session'
import {
  buildPaymentLedger,
  DEFAULT_LEDGER_SORT,
  filterLedger,
  filterLedgerByCampaign,
  isDateRangeBackwards,
  ledgerSortAfterColumnClick,
  nextLedgerSort,
  sortLedger,
  summariseLedger,
  UNFILTERED_LEDGER,
  type LedgerSortSelection,
} from './paymentLedger'

const campaigns = [
  createTestCampaign({ id: 1, name: 'Season 2 Launch' }),
  createTestCampaign({ id: 2, name: 'Clan Wars Update' }),
]

const directories = { campaigns, teamMembers }

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
    expect(buildPaymentLedger(creators, directories).map((entry) => entry.payment.id)).toHaveLength(
      3,
    )
  })

  it('puts the most recent first, and the last recorded first within a day', () => {
    // 12 and 11 were both paid on the 14th; 12 was recorded after 11.
    expect(buildPaymentLedger(creators, directories).map((entry) => entry.payment.id)).toEqual([
      12, 11, 10,
    ])
  })

  it('names who was paid and which campaign it came out of', () => {
    const [newest] = buildPaymentLedger(creators, directories)

    expect(newest?.creatorName).toBe('NovaKess')
    expect(newest?.creatorCode).toBe('NOVA')
    expect(newest?.campaignName).toBe('Season 2 Launch')
  })

  it('says so rather than leaving a hole when the campaign has gone', () => {
    const stranded = [createTestCreator({ campaignId: 99, payments: [createTestPayment()] })]

    expect(buildPaymentLedger(stranded, directories)[0]?.campaignName).toBe('No campaign')
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

    const ledger = buildPaymentLedger(withReversal, directories)

    expect(ledger.find((entry) => entry.payment.id === 2)?.isReversal).toBe(true)
    expect(ledger.find((entry) => entry.payment.id === 1)?.wasReversed).toBe(true)
  })

  it('has nothing in it before anyone has been paid', () => {
    expect(buildPaymentLedger([createTestCreator({ payments: [] })], directories)).toEqual([])
  })
})

describe('narrowing the ledger to one campaign', () => {
  it('keeps only what that campaign paid for', () => {
    const ledger = buildPaymentLedger(creators, directories)

    expect(filterLedgerByCampaign(ledger, 2).map((entry) => entry.payment.id)).toEqual([11])
  })

  it('keeps everything when no campaign is chosen', () => {
    const ledger = buildPaymentLedger(creators, directories)

    expect(filterLedgerByCampaign(ledger, EVERY_CAMPAIGN)).toHaveLength(3)
  })
})

describe('searching and dating the ledger', () => {
  const searchable = [
    createTestCreator({
      id: 1,
      name: 'NovaKess',
      creatorCode: 'NOVA',
      campaignId: 1,
      payments: [
        createTestPayment({ id: 1, paidOn: '2026-07-31', reference: 'TRF-2291-04' }),
        createTestPayment({ id: 2, paidOn: '2026-08-01', reference: 'WISE-8842-B' }),
      ],
    }),
    createTestCreator({
      id: 2,
      name: 'AshFall',
      creatorCode: 'ASH',
      campaignId: 2,
      payments: [createTestPayment({ id: 3, paidOn: '2026-08-14', reference: 'TRF-2413-11' })],
    }),
  ]
  const ledger = buildPaymentLedger(searchable, directories)
  const idsFor = (changes: Partial<typeof UNFILTERED_LEDGER>) =>
    filterLedger(ledger, { ...UNFILTERED_LEDGER, ...changes }).map((entry) => entry.payment.id)

  it('keeps everything when nothing is set', () => {
    expect(idsFor({})).toEqual([3, 2, 1])
  })

  it('finds a payment by its reference, ignoring case and stray spaces', () => {
    expect(idsFor({ searchText: ' wise-8842 ' })).toEqual([2])
  })

  it('finds every payment to a creator by name or by code', () => {
    expect(idsFor({ searchText: 'kess' })).toEqual([2, 1])
    expect(idsFor({ searchText: 'ash' })).toEqual([3])
  })

  it('includes both ends of the date range', () => {
    expect(idsFor({ paidFrom: '2026-08-01', paidTo: '2026-08-14' })).toEqual([3, 2])
  })

  it('takes either end of the range on its own', () => {
    expect(idsFor({ paidFrom: '2026-08-01' })).toEqual([3, 2])
    expect(idsFor({ paidTo: '2026-07-31' })).toEqual([1])
  })

  it('matches nothing for a range that ends before it starts', () => {
    const backwards = { paidFrom: '2026-08-14', paidTo: '2026-08-01' }

    expect(idsFor(backwards)).toEqual([])
    expect(isDateRangeBackwards(backwards)).toBe(true)
    expect(isDateRangeBackwards({ paidFrom: '2026-08-01', paidTo: '2026-08-01' })).toBe(false)
    expect(isDateRangeBackwards({ paidFrom: '2026-08-14', paidTo: '' })).toBe(false)
  })

  it('applies the campaign, the search and the dates together', () => {
    expect(idsFor({ campaign: 1, searchText: 'TRF', paidFrom: '2026-07-01' })).toEqual([1])
  })
})

describe('ordering the ledger', () => {
  const sortable = [
    createTestCreator({
      id: 1,
      payments: [
        createTestPayment({ id: 1, paidOn: '2026-07-18', amountInCents: 450_000 }),
        createTestPayment({ id: 2, paidOn: '2026-08-20', amountInCents: 450_000 }),
        createTestPayment({ id: 3, paidOn: '2026-08-08', amountInCents: 140_000 }),
        createTestPayment({
          id: 4,
          paidOn: '2026-08-21',
          amountInCents: -140_000,
          reversesPaymentId: 3,
        }),
      ],
    }),
  ]
  const ledger = buildPaymentLedger(sortable, directories)
  const idsSortedBy = (selection: LedgerSortSelection) =>
    sortLedger(ledger, selection).map((entry) => entry.payment.id)

  it('opens newest first', () => {
    expect(idsSortedBy(DEFAULT_LEDGER_SORT)).toEqual([4, 2, 3, 1])
  })

  it('runs oldest first when ascending', () => {
    expect(idsSortedBy({ column: 'date', direction: 'ascending' })).toEqual([1, 3, 2, 4])
  })

  it('puts the largest first, breaking a tie in favour of the more recent', () => {
    expect(idsSortedBy({ column: 'amount', direction: 'descending' })).toEqual([2, 1, 3, 4])
  })

  it('sorts a reversal by its signed amount, below every payment', () => {
    expect(idsSortedBy({ column: 'amount', direction: 'ascending' })).toEqual([4, 3, 2, 1])
  })

  it('leaves the ledger it was given untouched', () => {
    const before = ledger.map((entry) => entry.payment.id)
    sortLedger(ledger, { column: 'amount', direction: 'ascending' })

    expect(ledger.map((entry) => entry.payment.id)).toEqual(before)
  })
})

describe('changing the ledger order', () => {
  it('reverses the column already sorted', () => {
    expect(ledgerSortAfterColumnClick(DEFAULT_LEDGER_SORT, 'date')).toEqual({
      column: 'date',
      direction: 'ascending',
    })
  })

  it('starts another column largest first, whatever direction was in use', () => {
    expect(
      ledgerSortAfterColumnClick({ column: 'date', direction: 'ascending' }, 'amount'),
    ).toEqual({ column: 'amount', direction: 'descending' })
  })

  it('steps the phone button through all four orders and back to the start', () => {
    const steps = [DEFAULT_LEDGER_SORT]
    for (let step = 0; step < 4; step++) steps.push(nextLedgerSort(steps[steps.length - 1]!))

    expect(steps).toEqual([
      { column: 'date', direction: 'descending' },
      { column: 'date', direction: 'ascending' },
      { column: 'amount', direction: 'descending' },
      { column: 'amount', direction: 'ascending' },
      { column: 'date', direction: 'descending' },
    ])
  })
})

describe('what the entries in view add up to', () => {
  it('totals what was paid, and to how many people', () => {
    const totals = summariseLedger(buildPaymentLedger(creators, directories))

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

    const totals = summariseLedger(buildPaymentLedger(withReversal, directories))

    expect(totals.grossInCents).toBe(125_000)
    expect(totals.reversedInCents).toBe(100_000)
    expect(totals.netInCents).toBe(25_000)
    expect(totals.entryCount).toBe(3)
  })

  it('counts a creator once however many times they were paid', () => {
    const totals = summariseLedger(buildPaymentLedger([creators[0]!], directories))

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

describe('who recorded a payment', () => {
  /* The payment stores an id. A name copied onto it would be right on the day
     and wrong after a correction, a marriage, or a second M. Devlin. */
  it('resolves the name from the directory, not from the record', () => {
    const paid = [
      createTestCreator({
        payments: [createTestPayment({ recordedByTeamMemberId: 'tm-mdevlin' })],
      }),
    ]

    expect(buildPaymentLedger(paid, directories)[0]?.recordedByName).toBe('M. Devlin')
  })

  it('follows a rename without rewriting a single payment', () => {
    const paid = [
      createTestCreator({
        payments: [createTestPayment({ recordedByTeamMemberId: 'tm-mdevlin' })],
      }),
    ]
    const renamed = teamMembers.map((member) =>
      member.id === 'tm-mdevlin' ? { ...member, name: 'M. Devlin-Okafor' } : member,
    )

    expect(buildPaymentLedger(paid, { campaigns, teamMembers: renamed })[0]?.recordedByName).toBe(
      'M. Devlin-Okafor',
    )
  })

  it('says the directory has lost them rather than leaving a blank', () => {
    const paid = [
      createTestCreator({ payments: [createTestPayment({ recordedByTeamMemberId: 'tm-gone' })] }),
    ]

    expect(buildPaymentLedger(paid, directories)[0]?.recordedByName).toBe('Unknown team member')
  })
})
