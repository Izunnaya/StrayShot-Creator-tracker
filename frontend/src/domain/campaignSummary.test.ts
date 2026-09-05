import { describe, expect, it } from 'vitest'
import { creators as fixtureCreators } from '../data/fixtures'
import { createTestCreator, createTestPayment } from '../testing/createTestCreator'
import { calculateCampaignSummary } from './campaignSummary'

describe('calculateCampaignSummary', () => {
  it('adds up money, installs and views across every creator given to it', () => {
    const summary = calculateCampaignSummary([
      createTestCreator({
        id: 1,
        contractedAmount: 4000,
        installsAttributed: 1000,
        totalViews: 50000,
        payments: [createTestPayment({ amount: 1000 })],
      }),
      createTestCreator({
        id: 2,
        contractedAmount: 6000,
        installsAttributed: 3000,
        totalViews: 150000,
        payments: [createTestPayment({ amount: 6000 })],
      }),
    ])

    expect(summary.totalAmountPaid).toBe(7000)
    expect(summary.totalContractedAmount).toBe(10000)
    expect(summary.totalInstalls).toBe(4000)
    expect(summary.totalViews).toBe(200000)
  })

  it('counts only the creators who are actually owed something', () => {
    const summary = calculateCampaignSummary([
      createTestCreator({
        id: 1,
        contractedAmount: 4000,
        payments: [createTestPayment({ amount: 1000 })],
      }),
      createTestCreator({
        id: 2,
        contractedAmount: 6000,
        payments: [createTestPayment({ amount: 6000 })],
      }),
    ])

    expect(summary.totalOutstandingBalance).toBe(3000)
    expect(summary.creatorsWithOutstandingBalanceCount).toBe(1)
  })

  it('blends cost per install across the whole set rather than averaging each one', () => {
    // A big creator should pull the blended figure more than a small one, which
    // averaging per-creator rates would not do.
    const summary = calculateCampaignSummary([
      createTestCreator({
        id: 1,
        installsAttributed: 9000,
        payments: [createTestPayment({ amount: 9000 })],
      }),
      createTestCreator({
        id: 2,
        installsAttributed: 1000,
        payments: [createTestPayment({ amount: 11000 })],
      }),
    ])

    // 20,000 paid across 10,000 installs, not the mean of $1.00 and $11.00.
    expect(summary.blendedCostPerInstall).toBe(2)
  })

  it('reports no blended figure when no installs have landed', () => {
    const summary = calculateCampaignSummary([
      createTestCreator({ installsAttributed: 0, payments: [createTestPayment({ amount: 500 })] }),
    ])

    expect(summary.blendedCostPerInstall).toBe(Infinity)
  })

  it('returns zeros for an empty set rather than failing', () => {
    // Happens as soon as a filter matches nothing.
    const summary = calculateCampaignSummary([])

    expect(summary.totalAmountPaid).toBe(0)
    expect(summary.totalContractedAmount).toBe(0)
    expect(summary.totalOutstandingBalance).toBe(0)
    expect(summary.creatorsWithOutstandingBalanceCount).toBe(0)
    expect(summary.totalInstalls).toBe(0)
    expect(summary.totalViews).toBe(0)
    expect(summary.blendedCostPerInstall).toBe(Infinity)
  })
})

describe('the unfiltered dashboard figures', () => {
  // A regression guard on the real fixture data: these are the numbers the
  // design was signed off against, and the ones quoted in the README.
  const summary = calculateCampaignSummary(fixtureCreators)

  it('shows $47,000 paid of $55,200 committed', () => {
    expect(summary.totalAmountPaid).toBe(47000)
    expect(summary.totalContractedAmount).toBe(55200)
  })

  it('shows $8,200 outstanding across 5 creators', () => {
    expect(summary.totalOutstandingBalance).toBe(8200)
    expect(summary.creatorsWithOutstandingBalanceCount).toBe(5)
  })

  it('shows 25,545 installs from 2,275,000 views', () => {
    expect(summary.totalInstalls).toBe(25545)
    expect(summary.totalViews).toBe(2275000)
  })

  it('shows a blended cost per install of $1.84', () => {
    expect(summary.blendedCostPerInstall.toFixed(2)).toBe('1.84')
  })
})
