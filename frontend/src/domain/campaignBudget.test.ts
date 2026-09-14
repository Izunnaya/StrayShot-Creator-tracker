import { describe, expect, it } from 'vitest'
import { createTestCampaign, createTestCreator } from '@/testing/createTestCreator'
import { getCampaignBudgetPosition } from './campaignBudget'

const campaign = createTestCampaign({ id: 1, totalBudgetInCents: 1_000_000 })

const onCampaign = (contractedAmountInCents: number, id: number) =>
  createTestCreator({ id, campaignId: 1, contractedAmountInCents })

describe('what a campaign has committed', () => {
  it('adds up the deals on it, and ignores deals on other campaigns', () => {
    const position = getCampaignBudgetPosition(campaign, [
      onCampaign(300_000, 1),
      onCampaign(200_000, 2),
      createTestCreator({ id: 3, campaignId: 2, contractedAmountInCents: 900_000 }),
    ])

    expect(position.committedInCents).toBe(500_000)
    expect(position.remainingInCents).toBe(500_000)
    expect(position.creatorCount).toBe(2)
  })

  it('counts what is agreed, not what has been paid', () => {
    // Nothing has been paid here; the money is still spoken for.
    const position = getCampaignBudgetPosition(campaign, [onCampaign(400_000, 1)])

    expect(position.committedInCents).toBe(400_000)
  })

  it('has committed nothing before there are any deals', () => {
    const position = getCampaignBudgetPosition(campaign, [])

    expect(position.committedInCents).toBe(0)
    expect(position.remainingInCents).toBe(1_000_000)
    expect(position.committedPercent).toBe(0)
    expect(position.isOvercommitted).toBe(false)
  })
})

describe('a campaign committed past its budget', () => {
  /* Allowed and reported, not refused: the deal was agreed, and DECISIONS Q5
     settles that the record follows what happened. */
  const position = getCampaignBudgetPosition(campaign, [
    onCampaign(800_000, 1),
    onCampaign(400_000, 2),
  ])

  it('reports the overage as its own figure', () => {
    expect(position.overcommittedInCents).toBe(200_000)
    expect(position.isOvercommitted).toBe(true)
  })

  it('leaves nothing remaining rather than a negative amount to commit', () => {
    // Nobody has minus two thousand dollars left to spend.
    expect(position.remainingInCents).toBe(0)
  })

  it('fills the bar rather than overflowing it', () => {
    expect(position.committedPercent).toBe(100)
  })
})

describe('a budget of nothing', () => {
  const unbudgeted = createTestCampaign({ id: 1, totalBudgetInCents: 0 })

  it('is fully committed the moment anything is agreed', () => {
    const position = getCampaignBudgetPosition(unbudgeted, [onCampaign(1, 1)])

    expect(position.committedPercent).toBe(100)
    expect(position.isOvercommitted).toBe(true)
  })

  it('is not over budget while nothing has been agreed', () => {
    const position = getCampaignBudgetPosition(unbudgeted, [])

    expect(position.committedPercent).toBe(0)
    expect(position.isOvercommitted).toBe(false)
  })
})
