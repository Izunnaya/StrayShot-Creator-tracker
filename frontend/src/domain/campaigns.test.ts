import { describe, expect, it } from 'vitest'
import { createTestCampaign } from '@/testing/createTestCreator'
import {
  buildCampaign,
  draftFromCampaign,
  findCampaign,
  getCampaignName,
  reviewCampaignDraft,
  type CampaignDraft,
} from './campaigns'

const draft = (overrides: Partial<CampaignDraft> = {}): CampaignDraft => ({
  name: 'Winter Offensive',
  startDate: '2026-11-01',
  endDate: '2026-12-24',
  totalBudget: '30000',
  targetCostPerInstall: '3.50',
  ...overrides,
})

const existing = [
  createTestCampaign({ id: 1, name: 'Season 2 Launch' }),
  createTestCampaign({ id: 2, name: 'Clan Wars Update' }),
]

describe('looking a campaign up', () => {
  it('finds one by id', () => {
    expect(findCampaign(existing, 2)?.name).toBe('Clan Wars Update')
    expect(findCampaign(existing, 99)).toBeUndefined()
  })

  it('names a missing campaign rather than leaving a hole on the screen', () => {
    expect(getCampaignName(existing, 1)).toBe('Season 2 Launch')
    expect(getCampaignName(existing, 99)).toBe('No campaign')
  })
})

describe('reviewCampaignDraft', () => {
  it('accepts a complete campaign and reads its money as cents', () => {
    const review = reviewCampaignDraft(draft(), existing)

    expect(review.problems).toEqual([])
    expect(review.canSave).toBe(true)
    expect(review.totalBudgetInCents).toBe(3_000_000)
    expect(review.targetCostPerInstallInCents).toBe(350)
  })

  it('refuses a name another campaign already has, whatever its casing', () => {
    expect(reviewCampaignDraft(draft({ name: 'Clan Wars Update' }), existing).problems).toEqual([
      'name-taken',
    ])
    expect(reviewCampaignDraft(draft({ name: '  clan wars update ' }), existing).problems).toEqual([
      'name-taken',
    ])
  })

  it('lets a campaign keep its own name while being edited', () => {
    const review = reviewCampaignDraft(draft({ name: 'Clan Wars Update' }), existing, 2)

    expect(review.canSave).toBe(true)
  })

  it('refuses an end date before the start', () => {
    const review = reviewCampaignDraft(
      draft({ startDate: '2026-12-01', endDate: '2026-11-01' }),
      existing,
    )

    expect(review.problems).toEqual(['end-before-start'])
  })

  it('accepts a campaign that starts and ends on the same day', () => {
    const sameDay = draft({ startDate: '2026-11-01', endDate: '2026-11-01' })

    expect(reviewCampaignDraft(sameDay, existing).canSave).toBe(true)
  })

  it('refuses dates that never happened', () => {
    expect(reviewCampaignDraft(draft({ endDate: '2026-02-30' }), existing).problems).toEqual([
      'dates-unreadable',
    ])
  })

  it('refuses money it cannot read, and accepts what people type', () => {
    expect(reviewCampaignDraft(draft({ totalBudget: 'lots' }), existing).problems).toEqual([
      'budget-unreadable',
    ])
    expect(reviewCampaignDraft(draft({ totalBudget: '30,0,0' }), existing).problems).toEqual([
      'budget-unreadable',
    ])
    expect(
      reviewCampaignDraft(draft({ totalBudget: '$30,000' }), existing).totalBudgetInCents,
    ).toBe(3_000_000)
  })

  it('allows a campaign with no money behind it yet', () => {
    const review = reviewCampaignDraft(draft({ totalBudget: '0' }), existing)

    expect(review.canSave).toBe(true)
    expect(review.totalBudgetInCents).toBe(0)
  })

  it('reports every problem at once rather than one at a time', () => {
    const review = reviewCampaignDraft(
      draft({ name: '', startDate: '', endDate: '', totalBudget: 'x', targetCostPerInstall: 'y' }),
      existing,
    )

    expect(review.problems).toEqual([
      'name-missing',
      'start-missing',
      'end-missing',
      'budget-unreadable',
      'target-unreadable',
    ])
    expect(review.canSave).toBe(false)
  })
})

describe('buildCampaign', () => {
  it('trims what was typed and stores money in cents', () => {
    const campaign = buildCampaign(draft({ name: '  Winter Offensive  ' }), { id: 7 })

    expect(campaign).toEqual({
      id: 7,
      name: 'Winter Offensive',
      startDate: '2026-11-01',
      endDate: '2026-12-24',
      totalBudgetInCents: 3_000_000,
      targetCostPerInstallInCents: 350,
    })
  })

  it('refuses a draft that never passed review', () => {
    expect(() => buildCampaign(draft({ totalBudget: 'lots' }), { id: 7 })).toThrow()
  })
})

describe('draftFromCampaign', () => {
  it('reopens a saved campaign as dollars for the form', () => {
    const campaign = createTestCampaign({
      name: 'Season 2 Launch',
      totalBudgetInCents: 3_000_000,
      targetCostPerInstallInCents: 350,
    })

    expect(draftFromCampaign(campaign)).toMatchObject({
      name: 'Season 2 Launch',
      totalBudget: '30000',
      targetCostPerInstall: '3.5',
    })
  })

  it('survives a round trip back through review', () => {
    const campaign = createTestCampaign({ id: 3, name: 'Round Trip' })

    expect(reviewCampaignDraft(draftFromCampaign(campaign), [campaign], 3).canSave).toBe(true)
  })
})

describe('money typed to more than two decimal places', () => {
  /* Rounding it stores a figure nobody typed: a $3.505 target becomes $3.51
     on the record, and the person who typed it is never told. */
  it('is refused rather than rounded', () => {
    expect(
      reviewCampaignDraft(draft({ targetCostPerInstall: '3.505' }), existing).problems,
    ).toEqual(['target-unreadable'])
    expect(reviewCampaignDraft(draft({ totalBudget: '30000.001' }), existing).problems).toEqual([
      'budget-unreadable',
    ])
  })

  it('still reads everything anyone would actually type', () => {
    const review = reviewCampaignDraft(
      draft({ totalBudget: '$30,000.50', targetCostPerInstall: '.5' }),
      existing,
    )

    expect(review.totalBudgetInCents).toBe(3_000_050)
    expect(review.targetCostPerInstallInCents).toBe(50)
  })
})

describe('money too large to count to the cent', () => {
  /* As a float, 90071992547409.93 is still finite, but scaled to cents it
     is 9007199254740993 -- one past what a number can hold exactly. */
  it('is refused rather than stored as a different amount', () => {
    expect(
      reviewCampaignDraft(draft({ totalBudget: '90071992547409.93' }), existing).problems,
    ).toEqual(['budget-unreadable'])
    expect(
      reviewCampaignDraft(draft({ totalBudget: '999999999999999999' }), existing).problems,
    ).toEqual(['budget-unreadable'])
  })

  it('reads the largest amount that fits, every cent intact', () => {
    expect(
      reviewCampaignDraft(draft({ totalBudget: '90071992547409.91' }), existing).totalBudgetInCents,
    ).toBe(Number.MAX_SAFE_INTEGER)
  })
})
