import { describe, expect, it } from 'vitest'
import { creators as fixtureCreators } from '@/data/fixtures'
import { createTestCampaign, createTestCreator } from '@/testing/createTestCreator'
import { getLifecycleStatus } from './creatorCalculations'
import {
  applyDraftToCreator,
  buildCreator,
  draftFromCreator,
  emptyCreatorDraft,
  getContractedAmountInCents,
  getTrackingLink,
  NO_CAMPAIGN_ID,
  reviewCreatorDraft,
  type CreatorDraft,
} from './creatorRecording'

const campaigns = [createTestCampaign({ id: 1, name: 'Season 2 Launch' })]
const existingCreators = [createTestCreator({ id: 9, creatorCode: 'NOVA' })]

/** Step one only: the record a prospect is. */
const identityOnly = (overrides: Partial<CreatorDraft> = {}): CreatorDraft => ({
  ...emptyCreatorDraft,
  name: 'VexaRun',
  email: 'vexa@creators.gg',
  ...overrides,
})

/** All three steps. */
const complete = (overrides: Partial<CreatorDraft> = {}): CreatorDraft => ({
  ...identityOnly(),
  campaignId: '1',
  creatorCode: 'VEXA',
  agreedRate: '1800',
  streamsCommitted: '2',
  paymentMethod: 'Bank transfer',
  paymentDetails: 'GB33 BUKB 2020',
  ...overrides,
})

describe('step one, who they are', () => {
  it('is enough on its own: a name and an email make a prospect', () => {
    const review = reviewCreatorDraft(identityOnly(), { creators: existingCreators, campaigns })

    expect(review.canSave).toBe(true)
    expect(review.completeByStep).toEqual({ identity: true, deal: false, payment: false })
  })

  it('will not save without a name or a readable email', () => {
    const problemsFor = (overrides: Partial<CreatorDraft>) =>
      reviewCreatorDraft(identityOnly(overrides), { creators: existingCreators, campaigns })
        .problems

    expect(problemsFor({ name: '  ' })).toContain('name-missing')
    expect(problemsFor({ email: '' })).toContain('email-missing')
    expect(problemsFor({ email: 'vexa at creators' })).toContain('email-unreadable')
    expect(problemsFor({ email: 'vexa@creators' })).toContain('email-unreadable')
  })
})

describe('step two, the deal', () => {
  it('is complete when the campaign, code, rate and commitment are all there', () => {
    const review = reviewCreatorDraft(complete(), { creators: existingCreators, campaigns })

    expect(review.canSave).toBe(true)
    expect(review.completeByStep.deal).toBe(true)
  })

  it('treats a half-filled deal as unfinished rather than ignoring it', () => {
    // Someone typed a code and stopped. The rest of the deal is now required.
    const review = reviewCreatorDraft(identityOnly({ creatorCode: 'VEXA' }), {
      creators: existingCreators,
      campaigns,
    })

    expect(review.problems).toEqual(['campaign-missing', 'rate-missing', 'streams-missing'])
    expect(review.canSave).toBe(false)
  })

  it('refuses a code another creator already has', () => {
    const review = reviewCreatorDraft(complete({ creatorCode: 'nova' }), {
      creators: existingCreators,
      campaigns,
    })

    expect(review.problems).toEqual(['code-taken'])
  })

  it('lets a creator keep their own code while being edited', () => {
    const review = reviewCreatorDraft(complete({ creatorCode: 'NOVA' }), {
      creators: existingCreators,
      campaigns,
      editingId: 9,
    })

    expect(review.canSave).toBe(true)
  })

  it('refuses a code that would not survive being read off a stream', () => {
    const problemsFor = (creatorCode: string) =>
      reviewCreatorDraft(complete({ creatorCode }), { creators: existingCreators, campaigns })
        .problems

    expect(problemsFor('V')).toContain('code-unreadable')
    expect(problemsFor('VEXARUNNER')).toContain('code-unreadable')
    expect(problemsFor('VEXA RUN')).toContain('code-unreadable')
    expect(problemsFor('VEXA-1')).toContain('code-unreadable')
  })

  it('refuses a delivery window that ends before it starts', () => {
    const review = reviewCreatorDraft(
      complete({ deliveryWindowStart: '2026-09-01', deliveryWindowEnd: '2026-08-01' }),
      { creators: existingCreators, campaigns },
    )

    expect(review.problems).toEqual(['window-backwards'])
  })

  it('refuses window dates that never happened', () => {
    const review = reviewCreatorDraft(complete({ deliveryWindowEnd: '2026-02-30' }), {
      creators: existingCreators,
      campaigns,
    })

    expect(review.problems).toEqual(['window-unreadable'])
  })

  it('sorts problems by the step they belong to', () => {
    const review = reviewCreatorDraft(complete({ name: '', creatorCode: 'nova' }), {
      creators: existingCreators,
      campaigns,
    })

    expect(review.problemsByStep.identity).toEqual(['name-missing'])
    expect(review.problemsByStep.deal).toEqual(['code-taken'])
  })
})

describe('the campaign a deal belongs to', () => {
  /* The field is a select, so these do not come from someone choosing badly.
     They come from a campaign being removed under a saved deal, or from a
     caller of this module -- and a creator pointing at a campaign that is not
     there is judged, filtered and totalled against nothing. */
  const reviewWith = (campaignId: string) =>
    reviewCreatorDraft(complete({ campaignId }), { creators: existingCreators, campaigns })

  it('refuses an id that no campaign answers to', () => {
    expect(reviewWith('999').problems).toEqual(['campaign-unknown'])
    expect(reviewWith('999').canSave).toBe(false)
  })

  it('refuses text that is not an id, rather than reading it as no campaign', () => {
    expect(reviewWith('abc').problems).toEqual(['campaign-unknown'])
    expect(reviewWith('0').problems).toEqual(['campaign-unknown'])
  })

  it('accepts the one campaign that does exist', () => {
    expect(reviewWith('1').canSave).toBe(true)
    expect(reviewWith('1').campaignId).toBe(1)
  })

  it('will not save a creator against a campaign that is not there', () => {
    expect(() => buildCreator(complete({ campaignId: '999' }), { id: 20, campaigns })).toThrow()
    expect(() => buildCreator(complete({ campaignId: 'abc' }), { id: 20, campaigns })).toThrow()
  })

  it('leaves an edited creator where they were rather than following a dangling id', () => {
    const existing = createTestCreator({ id: 5, campaignId: 1 })

    const updated = applyDraftToCreator(
      existing,
      { ...draftFromCreator(existing), campaignId: '999' },
      { campaigns },
    )

    expect(updated.campaignId).toBe(1)
  })

  it('reopens a prospect with no campaign chosen, and saves them again', () => {
    // The sentinel is not an id anything answers to, so a form showing it
    // would refuse to save a prospect nobody had touched.
    const prospect = buildCreator(identityOnly(), { id: 20, campaigns })
    expect(prospect.campaignId).toBe(NO_CAMPAIGN_ID)

    const draft = draftFromCreator(prospect)
    expect(draft.campaignId).toBe('')
    expect(reviewCreatorDraft(draft, { creators: [], campaigns }).canSave).toBe(true)
  })
})

describe('what the deal is worth', () => {
  it('multiplies the rate by the commitment when paying per stream', () => {
    expect(getContractedAmountInCents('per-stream', 180_000, 2)).toBe(360_000)
  })

  it('takes the rate as the whole deal when it is a flat fee', () => {
    expect(getContractedAmountInCents('flat-fee', 180_000, 2)).toBe(180_000)
  })

  it('is nothing until there is a rate', () => {
    expect(getContractedAmountInCents('per-stream', null, 2)).toBe(0)
    expect(getContractedAmountInCents('per-stream', 180_000, null)).toBe(0)
  })
})

describe('a rate typed to more than two decimal places', () => {
  const reviewRate = (agreedRate: string) =>
    reviewCreatorDraft(complete({ agreedRate }), { creators: existingCreators, campaigns })

  it('is refused rather than rounded into a different rate', () => {
    // $1,800.005 a stream, rounded up and multiplied by the commitment, is
    // a dollar of contracted money nobody agreed to.
    expect(reviewRate('1800.005').problems).toEqual(['rate-unreadable'])
    expect(reviewRate('.005').problems).toEqual(['rate-unreadable'])
  })

  it('still reads everything anyone would actually type', () => {
    expect(reviewRate('$1,800.50').agreedRateInCents).toBe(180_050)
    expect(reviewRate('.5').agreedRateInCents).toBe(50)
  })
})

describe('buildCreator', () => {
  it('saves a prospect with nothing but step one, and no money agreed', () => {
    const creator = buildCreator(identityOnly(), { id: 20, campaigns })

    expect(creator.name).toBe('VexaRun')
    expect(creator.contractedAmountInCents).toBe(0)
    expect(creator.streamsCommitted).toBe(0)
    expect(creator.portalInviteState).toBe('not sent')
    expect(getLifecycleStatus(creator)).toBe('prospect')
  })

  it('saves a full deal as contracted, with the money worked out', () => {
    const creator = buildCreator(complete(), { id: 20, campaigns })

    expect(creator.contractedAmountInCents).toBe(360_000)
    expect(creator.agreedRateInCents).toBe(180_000)
    expect(creator.streamsCommitted).toBe(2)
    expect(getLifecycleStatus(creator)).toBe('contracted')
  })

  it('starts a new creator with nothing measured yet', () => {
    const creator = buildCreator(complete(), { id: 20, campaigns })

    expect(creator.streamsDelivered).toBe(0)
    expect(creator.installsAttributed).toBe(0)
    expect(creator.payments).toEqual([])
  })

  it('upper-cases the code, however it was typed', () => {
    expect(buildCreator(complete({ creatorCode: 'vexa' }), { id: 20, campaigns }).creatorCode).toBe(
      'VEXA',
    )
  })

  it('leaves out the fields nobody filled in', () => {
    const creator = buildCreator(identityOnly(), { id: 20, campaigns })

    expect(creator.requirements).toBeUndefined()
    expect(creator.paymentMethod).toBeUndefined()
    expect(creator.notes).toBeUndefined()
  })

  it('refuses a draft that never passed review', () => {
    expect(() => buildCreator(identityOnly({ email: '' }), { id: 20, campaigns })).toThrow()
  })
})

describe('editing an existing creator', () => {
  const existing = createTestCreator({
    id: 5,
    name: 'VexaRun',
    creatorCode: 'VEXA',
    streamsDelivered: 2,
    installsAttributed: 700,
    totalViews: 110_000,
  })

  it('reopens with what was saved, as the form holds it', () => {
    const draft = draftFromCreator(
      createTestCreator({ agreedRateInCents: 180_000, streamsCommitted: 2 }),
    )

    expect(draft.agreedRate).toBe('1800')
    expect(draft.streamsCommitted).toBe('2')
  })

  it('survives a round trip back through review', () => {
    const draft = draftFromCreator(existing)

    expect(
      reviewCreatorDraft(draft, { creators: [existing], campaigns, editingId: 5 }).canSave,
    ).toBe(true)
  })

  it('never touches what was measured rather than agreed', () => {
    const updated = applyDraftToCreator(
      existing,
      {
        ...draftFromCreator(existing),
        name: 'Vexa Run',
      },
      { campaigns },
    )

    expect(updated.name).toBe('Vexa Run')
    expect(updated.streamsDelivered).toBe(2)
    expect(updated.installsAttributed).toBe(700)
    expect(updated.totalViews).toBe(110_000)
  })
})

describe('the tracking link', () => {
  it('is the code, lowercased, on the public page', () => {
    expect(getTrackingLink({ creatorCode: 'VEXA' })).toBe('strayshot.game/r/vexa')
  })
})

describe('the fixture creators', () => {
  it('agree with their own rate model about what the deal is worth', () => {
    /* Editing a creator recomputes the contracted amount from the rate, so a
       fixture where the two disagree changes the money the moment anyone
       opens and saves that record. PixelMara used to: $1,067 a stream across
       three streams is $3,201, stored as $3,200. */
    for (const creator of fixtureCreators) {
      expect({
        creator: creator.name,
        contracted: creator.contractedAmountInCents,
      }).toEqual({
        creator: creator.name,
        contracted: getContractedAmountInCents(
          creator.rateModel ?? 'per-stream',
          creator.agreedRateInCents,
          creator.streamsCommitted,
        ),
      })
    }
  })
})
