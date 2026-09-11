import { describe, expect, it } from 'vitest'
import { createTestCampaign, createTestCreator } from '@/testing/createTestCreator'
import { getLifecycleStatus } from './creatorCalculations'
import {
  applyDraftToCreator,
  buildCreator,
  draftFromCreator,
  emptyCreatorDraft,
  getContractedAmountInCents,
  getTrackingLink,
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
    const review = reviewCreatorDraft(identityOnly(), { creators: existingCreators })

    expect(review.canSave).toBe(true)
    expect(review.completeByStep).toEqual({ identity: true, deal: false, payment: false })
  })

  it('will not save without a name or a readable email', () => {
    const problemsFor = (overrides: Partial<CreatorDraft>) =>
      reviewCreatorDraft(identityOnly(overrides), { creators: existingCreators }).problems

    expect(problemsFor({ name: '  ' })).toContain('name-missing')
    expect(problemsFor({ email: '' })).toContain('email-missing')
    expect(problemsFor({ email: 'vexa at creators' })).toContain('email-unreadable')
    expect(problemsFor({ email: 'vexa@creators' })).toContain('email-unreadable')
  })
})

describe('step two, the deal', () => {
  it('is complete when the campaign, code, rate and commitment are all there', () => {
    const review = reviewCreatorDraft(complete(), { creators: existingCreators })

    expect(review.canSave).toBe(true)
    expect(review.completeByStep.deal).toBe(true)
  })

  it('treats a half-filled deal as unfinished rather than ignoring it', () => {
    // Someone typed a code and stopped. The rest of the deal is now required.
    const review = reviewCreatorDraft(identityOnly({ creatorCode: 'VEXA' }), {
      creators: existingCreators,
    })

    expect(review.problems).toEqual(['campaign-missing', 'rate-missing', 'streams-missing'])
    expect(review.canSave).toBe(false)
  })

  it('refuses a code another creator already has', () => {
    const review = reviewCreatorDraft(complete({ creatorCode: 'nova' }), {
      creators: existingCreators,
    })

    expect(review.problems).toEqual(['code-taken'])
  })

  it('lets a creator keep their own code while being edited', () => {
    const review = reviewCreatorDraft(complete({ creatorCode: 'NOVA' }), {
      creators: existingCreators,
      editingId: 9,
    })

    expect(review.canSave).toBe(true)
  })

  it('refuses a code that would not survive being read off a stream', () => {
    const problemsFor = (creatorCode: string) =>
      reviewCreatorDraft(complete({ creatorCode }), { creators: existingCreators }).problems

    expect(problemsFor('V')).toContain('code-unreadable')
    expect(problemsFor('VEXARUNNER')).toContain('code-unreadable')
    expect(problemsFor('VEXA RUN')).toContain('code-unreadable')
    expect(problemsFor('VEXA-1')).toContain('code-unreadable')
  })

  it('refuses a delivery window that ends before it starts', () => {
    const review = reviewCreatorDraft(
      complete({ deliveryWindowStart: '2026-09-01', deliveryWindowEnd: '2026-08-01' }),
      { creators: existingCreators },
    )

    expect(review.problems).toEqual(['window-backwards'])
  })

  it('refuses window dates that never happened', () => {
    const review = reviewCreatorDraft(complete({ deliveryWindowEnd: '2026-02-30' }), {
      creators: existingCreators,
    })

    expect(review.problems).toEqual(['window-unreadable'])
  })

  it('sorts problems by the step they belong to', () => {
    const review = reviewCreatorDraft(complete({ name: '', creatorCode: 'nova' }), {
      creators: existingCreators,
    })

    expect(review.problemsByStep.identity).toEqual(['name-missing'])
    expect(review.problemsByStep.deal).toEqual(['code-taken'])
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

    expect(reviewCreatorDraft(draft, { creators: [existing], editingId: 5 }).canSave).toBe(true)
  })

  it('never touches what was measured rather than agreed', () => {
    const updated = applyDraftToCreator(existing, {
      ...draftFromCreator(existing),
      name: 'Vexa Run',
    })

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
