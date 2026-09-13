import type { Campaign, Creator, RateModel, StreamingPlatform } from '@/data/types'

/**
 * The rules behind the add creator form.
 *
 * The form is three steps because the record is built in stages: the team
 * meets someone long before the deal is agreed, and long before anyone knows
 * how they will be paid. So step one stands on its own — a creator with a
 * name and an email is a real record, a prospect — and the other two can be
 * filled in weeks later.
 *
 * What that costs is that "valid" is not one question. This module answers it
 * per step, so the form can show which steps are done without refusing to
 * save the ones that are.
 */

export interface CreatorDraft {
  // Step 1, who they are.
  name: string
  email: string
  platform: StreamingPlatform
  channelUrl: string
  audienceSize: string
  contactHandle: string
  contentLanguage: string
  region: string

  // Step 2, the deal.
  campaignId: string
  creatorCode: string
  rateModel: RateModel
  agreedRate: string
  payoutCurrency: string
  streamsCommitted: string
  minimumStreamHours: string
  deliveryWindowStart: string
  deliveryWindowEnd: string
  requirements: string

  // Step 3, how they get paid.
  paymentMethod: string
  paymentDetails: string

  // Always visible, never a step.
  notes: string
}

export type CreatorFormStep = 'identity' | 'deal' | 'payment'

/**
 * The campaign id a creator carries while they have no campaign: a prospect
 * before the deal, or a deal whose campaign has gone. No campaign has it, and
 * the screens read it as "No campaign".
 */
export const NO_CAMPAIGN_ID = 0

export type CreatorProblem =
  | 'name-missing'
  | 'email-missing'
  | 'email-unreadable'
  | 'campaign-missing'
  | 'campaign-unknown'
  | 'code-missing'
  | 'code-unreadable'
  | 'code-taken'
  | 'rate-missing'
  | 'rate-unreadable'
  | 'streams-missing'
  | 'streams-unreadable'
  | 'hours-unreadable'
  | 'window-unreadable'
  | 'window-backwards'

export interface CreatorDraftReview {
  problems: CreatorProblem[]
  /** Which problems belong to which step, so the step bar can show them. */
  problemsByStep: Record<CreatorFormStep, CreatorProblem[]>
  /** A step is complete when it holds everything that step is for. */
  completeByStep: Record<CreatorFormStep, boolean>
  canSave: boolean
  /**
   * Whether anyone has touched step two. Drives what the save button
   * promises: a form with a half-filled deal is not being saved as a
   * prospect, it is a creator whose deal is not finished.
   */
  dealStarted: boolean
  /**
   * The campaign this deal belongs to, once the draft names one that exists.
   * null covers all three ways it can fail to: nothing typed, something that
   * is not an id, and an id no campaign answers to.
   */
  campaignId: number | null
  /** What the deal is worth, once there is enough of one to say. */
  contractedAmountInCents: number
  agreedRateInCents: number | null
  streamsCommitted: number | null
}

const PROBLEM_STEPS: Record<CreatorProblem, CreatorFormStep> = {
  'name-missing': 'identity',
  'email-missing': 'identity',
  'email-unreadable': 'identity',
  'campaign-missing': 'deal',
  'campaign-unknown': 'deal',
  'code-missing': 'deal',
  'code-unreadable': 'deal',
  'code-taken': 'deal',
  'rate-missing': 'deal',
  'rate-unreadable': 'deal',
  'streams-missing': 'deal',
  'streams-unreadable': 'deal',
  'hours-unreadable': 'deal',
  'window-unreadable': 'deal',
  'window-backwards': 'deal',
}

/**
 * A creator code: letters and digits, two to eight of them.
 *
 * It gets typed into a game client by someone reading it off a stream, so it
 * has to survive being heard as well as seen — nothing that needs explaining
 * whether it is a dash or a space.
 */
const CREATOR_CODE = /^[A-Za-z0-9]{2,8}$/

/** Deliberately permissive: the address is proven by the invite arriving. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function reviewCreatorDraft(
  draft: CreatorDraft,
  context: { creators: Creator[]; campaigns: Campaign[]; editingId?: number },
): CreatorDraftReview {
  const problems: CreatorProblem[] = []

  // --- Step 1, who they are -------------------------------------------------
  const name = draft.name.trim()
  const email = draft.email.trim()

  if (name === '') problems.push('name-missing')
  if (email === '') problems.push('email-missing')
  else if (!EMAIL.test(email)) problems.push('email-unreadable')

  // --- Step 2, the deal -----------------------------------------------------
  const code = draft.creatorCode.trim()
  const campaignId = identifyCampaign(draft.campaignId, context.campaigns)
  const agreedRateInCents = parseDollarsToCents(draft.agreedRate)
  const parsedStreamsCommitted = parseWholeNumber(draft.streamsCommitted)
  const streamsCommitted =
    parsedStreamsCommitted !== null && parsedStreamsCommitted > 0 ? parsedStreamsCommitted : null

  /* A half-filled deal is not a deal. Nothing here is required on its own,
     but the moment any of it is touched, the four fields the money and the
     delivery check depend on are all required together. */
  const dealStarted = [
    draft.campaignId,
    draft.creatorCode,
    draft.agreedRate,
    draft.streamsCommitted,
    draft.deliveryWindowStart,
    draft.deliveryWindowEnd,
    draft.requirements,
    draft.minimumStreamHours,
  ].some((field) => field.trim() !== '')

  if (dealStarted) {
    /* The field is a select, so a value that names no campaign did not come
       from someone choosing badly -- it came from a campaign being removed
       under a saved deal, or from a caller of this module. Either way the
       record must not be written pointing at a campaign that is not there. */
    if (draft.campaignId.trim() === '') problems.push('campaign-missing')
    else if (campaignId === null) problems.push('campaign-unknown')
    if (code === '') problems.push('code-missing')
    if (draft.agreedRate.trim() === '') problems.push('rate-missing')
    if (draft.streamsCommitted.trim() === '') problems.push('streams-missing')
  }

  if (code !== '' && !CREATOR_CODE.test(code)) problems.push('code-unreadable')
  else if (code !== '' && isCodeTaken(code, context.creators, context.editingId)) {
    problems.push('code-taken')
  }

  if (draft.agreedRate.trim() !== '' && agreedRateInCents === null) problems.push('rate-unreadable')
  if (draft.streamsCommitted.trim() !== '' && streamsCommitted === null) {
    problems.push('streams-unreadable')
  }
  if (draft.minimumStreamHours.trim() !== '' && parseHours(draft.minimumStreamHours) === null) {
    problems.push('hours-unreadable')
  }

  const windowStart = draft.deliveryWindowStart.trim()
  const windowEnd = draft.deliveryWindowEnd.trim()
  if (windowStart !== '' || windowEnd !== '') {
    if (
      (windowStart !== '' && !isCalendarDate(windowStart)) ||
      (windowEnd !== '' && !isCalendarDate(windowEnd))
    ) {
      problems.push('window-unreadable')
    } else if (windowStart !== '' && windowEnd !== '' && windowEnd < windowStart) {
      problems.push('window-backwards')
    }
  }

  // --- What the deal is worth ----------------------------------------------
  const contractedAmountInCents = getContractedAmountInCents(
    draft.rateModel,
    agreedRateInCents,
    streamsCommitted,
  )

  const problemsByStep: Record<CreatorFormStep, CreatorProblem[]> = {
    identity: problems.filter((problem) => PROBLEM_STEPS[problem] === 'identity'),
    deal: problems.filter((problem) => PROBLEM_STEPS[problem] === 'deal'),
    payment: [],
  }

  return {
    problems,
    problemsByStep,
    completeByStep: {
      identity: name !== '' && EMAIL.test(email),
      deal:
        problemsByStep.deal.length === 0 &&
        campaignId !== null &&
        code !== '' &&
        agreedRateInCents !== null &&
        streamsCommitted !== null,
      payment: draft.paymentMethod.trim() !== '' && draft.paymentDetails.trim() !== '',
    },
    canSave: problems.length === 0 && name !== '' && EMAIL.test(email),
    dealStarted,
    campaignId,
    contractedAmountInCents,
    agreedRateInCents,
    streamsCommitted,
  }
}

/**
 * What a deal is worth up front.
 *
 * Per stream multiplies by the commitment; a flat fee is the whole deal
 * whatever gets delivered. Per view is absent on purpose — see DECISIONS Q9:
 * there is no agreed total to pay against until the views exist, and every
 * payment figure in the application is a proportion of an agreed total.
 */
export function getContractedAmountInCents(
  rateModel: RateModel,
  agreedRateInCents: number | null,
  streamsCommitted: number | null,
): number {
  if (agreedRateInCents === null) return 0
  if (rateModel === 'flat-fee') return agreedRateInCents
  return streamsCommitted === null ? 0 : agreedRateInCents * streamsCommitted
}

/**
 * The campaign a typed id names, or null if it names none.
 *
 * Existence is the whole test: a positive whole number is necessary and not
 * sufficient, and NO_CAMPAIGN_ID belongs to no campaign by construction.
 */
function identifyCampaign(typed: string, campaigns: Campaign[]): number | null {
  const id = parseWholeNumber(typed)
  if (id === null || id === NO_CAMPAIGN_ID) return null
  return campaigns.some((campaign) => campaign.id === id) ? id : null
}

function isCodeTaken(code: string, creators: Creator[], editingId?: number): boolean {
  return creators.some(
    (creator) =>
      creator.id !== editingId && creator.creatorCode.toLowerCase() === code.toLowerCase(),
  )
}

/** The link a creator puts in their description. Derived, never stored. */
export function getTrackingLink(creator: Pick<Creator, 'creatorCode'>): string {
  return `strayshot.game/r/${creator.creatorCode.toLowerCase()}`
}

export function buildCreator(
  draft: CreatorDraft,
  details: { id: number; campaigns: Campaign[] },
): Creator {
  const review = reviewCreatorDraft(draft, { creators: [], campaigns: details.campaigns })
  if (!review.canSave) {
    throw new Error('buildCreator was given a draft that never passed review')
  }

  return {
    id: details.id,
    name: draft.name.trim(),
    email: draft.email.trim(),
    platform: draft.platform,
    creatorCode: draft.creatorCode.trim().toUpperCase(),
    campaignId: review.campaignId ?? NO_CAMPAIGN_ID,

    streamsCommitted: review.streamsCommitted ?? 0,
    streamsDelivered: 0,
    totalViews: 0,
    peakConcurrentViewers: 0,
    installsAttributed: 0,

    contractedAmountInCents: review.contractedAmountInCents,
    rateModel: draft.rateModel,
    agreedRateInCents: review.agreedRateInCents ?? 0,

    audienceSize: draft.audienceSize.trim() || '—',
    channelUrl: draft.channelUrl.trim(),
    portalInviteState: 'not sent',
    payments: [],

    ...optionalDealFields(draft),
  }
}

/** Applies an edited draft to a creator, leaving everything measured alone. */
export function applyDraftToCreator(
  creator: Creator,
  draft: CreatorDraft,
  details: { campaigns: Campaign[] },
): Creator {
  const review = reviewCreatorDraft(draft, { creators: [], campaigns: details.campaigns })

  return {
    ...creator,
    name: draft.name.trim(),
    email: draft.email.trim(),
    platform: draft.platform,
    creatorCode: draft.creatorCode.trim().toUpperCase() || creator.creatorCode,
    campaignId: review.campaignId ?? creator.campaignId,
    streamsCommitted: review.streamsCommitted ?? creator.streamsCommitted,
    contractedAmountInCents:
      review.agreedRateInCents === null
        ? creator.contractedAmountInCents
        : review.contractedAmountInCents,
    rateModel: draft.rateModel,
    agreedRateInCents: review.agreedRateInCents ?? creator.agreedRateInCents,
    audienceSize: draft.audienceSize.trim() || creator.audienceSize,
    channelUrl: draft.channelUrl.trim(),
    ...optionalDealFields(draft),
  }
}

/**
 * Whether a form still says what the record says.
 *
 * Compared field by field against a draft taken from the record now, rather
 * than by tracking edits: a field typed and typed back is not a change, and
 * an action that depends on the record being current should not be blocked by
 * one. Every field counts, so a field added to the draft is covered by this
 * without anyone remembering to come back here.
 */
export function hasUnsavedChanges(draft: CreatorDraft, creator: Creator): boolean {
  const saved = draftFromCreator(creator)
  return (Object.keys(saved) as (keyof CreatorDraft)[]).some(
    (field) => draft[field] !== saved[field],
  )
}

/** The draft that reopens an existing creator for editing. */
export function draftFromCreator(creator: Creator): CreatorDraft {
  return {
    name: creator.name,
    email: creator.email,
    platform: creator.platform,
    channelUrl: creator.channelUrl,
    audienceSize: creator.audienceSize === '—' ? '' : creator.audienceSize,
    contactHandle: creator.contactHandle ?? '',
    contentLanguage: creator.contentLanguage ?? '',
    region: creator.region ?? '',

    /* A prospect reopens with the campaign field empty, not with the
       sentinel showing as an id nothing answers to. */
    campaignId: creator.campaignId === NO_CAMPAIGN_ID ? '' : String(creator.campaignId),
    creatorCode: creator.creatorCode,
    rateModel: creator.rateModel ?? 'per-stream',
    agreedRate: creator.agreedRateInCents ? String(creator.agreedRateInCents / 100) : '',
    payoutCurrency: creator.payoutCurrency ?? 'USD',
    streamsCommitted: creator.streamsCommitted ? String(creator.streamsCommitted) : '',
    minimumStreamHours: creator.minimumStreamHours ? String(creator.minimumStreamHours) : '',
    deliveryWindowStart: creator.deliveryWindowStart ?? '',
    deliveryWindowEnd: creator.deliveryWindowEnd ?? '',
    requirements: creator.requirements ?? '',

    paymentMethod: creator.paymentMethod ?? '',
    paymentDetails: creator.paymentDetails ?? '',

    notes: creator.notes ?? '',
  }
}

export const emptyCreatorDraft: CreatorDraft = {
  name: '',
  email: '',
  platform: 'YouTube',
  channelUrl: '',
  audienceSize: '',
  contactHandle: '',
  contentLanguage: '',
  region: '',
  campaignId: '',
  creatorCode: '',
  rateModel: 'per-stream',
  agreedRate: '',
  payoutCurrency: 'USD',
  streamsCommitted: '',
  minimumStreamHours: '',
  deliveryWindowStart: '',
  deliveryWindowEnd: '',
  requirements: '',
  paymentMethod: '',
  paymentDetails: '',
  notes: '',
}

/** The fields that only exist once someone has filled them in. */
function optionalDealFields(draft: CreatorDraft) {
  const text = (value: string) => (value.trim() === '' ? undefined : value.trim())

  return {
    contactHandle: text(draft.contactHandle),
    contentLanguage: text(draft.contentLanguage),
    region: text(draft.region),
    payoutCurrency: text(draft.payoutCurrency),
    minimumStreamHours: parseHours(draft.minimumStreamHours) ?? undefined,
    deliveryWindowStart: text(draft.deliveryWindowStart),
    deliveryWindowEnd: text(draft.deliveryWindowEnd),
    requirements: text(draft.requirements),
    paymentMethod: text(draft.paymentMethod),
    paymentDetails: text(draft.paymentDetails),
    notes: text(draft.notes),
  }
}

/**
 * Reads a typed dollar amount into cents, or null if it cannot be read.
 *
 * Two decimal places at most. A third is not a rounding problem to solve
 * quietly -- $1.005 is not an amount anyone can be paid, and storing $1.01
 * against it puts a figure on the record that nobody typed or agreed. The
 * rounding left is only for binary floating point, where 10.29 * 100 does
 * not land exactly on 1029.
 */
function parseDollarsToCents(typed: string): number | null {
  const trimmed = typed.trim()
  if (!/^\$?\s*(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?|\.\d{1,2})$/.test(trimmed)) return null

  const asNumber = Number(trimmed.replace(/[$,\s]/g, ''))
  return Number.isFinite(asNumber) ? Math.round(asNumber * 100) : null
}

function parseWholeNumber(typed: string): number | null {
  const trimmed = typed.trim()
  if (!/^\d+$/.test(trimmed)) return null

  const asNumber = Number(trimmed)
  return Number.isFinite(asNumber) ? asNumber : null
}

function parseHours(typed: string): number | null {
  const trimmed = typed.trim()
  if (trimmed === '' || !/^\d+(?:\.\d+)?$/.test(trimmed)) return null

  const asNumber = Number(trimmed)
  return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : null
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number) as [number, number, number]
  const asDate = new Date(Date.UTC(year, month - 1, day))

  return (
    asDate.getUTCFullYear() === year &&
    asDate.getUTCMonth() === month - 1 &&
    asDate.getUTCDate() === day
  )
}
