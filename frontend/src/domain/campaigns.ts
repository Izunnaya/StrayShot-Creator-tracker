import type { Campaign } from '@/data/types'

/**
 * Reading and editing campaigns.
 *
 * Creators point at a campaign by id, so a campaign's name is only ever a
 * label. Renaming one is a change in a single record — which is the whole
 * reason for holding it that way — and this module is where a name is looked
 * up for display, and where a draft of one is judged before it is saved.
 */

/** A campaign as it exists in the form, before anyone has agreed it is valid. */
export interface CampaignDraft {
  name: string
  startDate: string
  endDate: string
  /** As typed, in dollars. */
  totalBudget: string
  /** As typed, in dollars. */
  targetCostPerInstall: string
}

export type CampaignProblem =
  | 'name-missing'
  | 'name-taken'
  | 'start-missing'
  | 'end-missing'
  | 'dates-unreadable'
  | 'end-before-start'
  | 'budget-unreadable'
  | 'target-unreadable'

export interface CampaignDraftReview {
  problems: CampaignProblem[]
  canSave: boolean
  totalBudgetInCents: number | null
  targetCostPerInstallInCents: number | null
}

export function findCampaign(campaigns: Campaign[], campaignId: number): Campaign | undefined {
  return campaigns.find((campaign) => campaign.id === campaignId)
}

/**
 * The campaign's name, or a placeholder when the campaign has gone.
 *
 * A creator whose campaign was deleted is a state the data model allows, so
 * every caller would otherwise need its own fallback. Deleting a campaign
 * that still has creators is open question 1.6.
 */
export function getCampaignName(campaigns: Campaign[], campaignId: number): string {
  return findCampaign(campaigns, campaignId)?.name ?? 'No campaign'
}

/**
 * Judges a campaign draft, returning codes rather than sentences — the modal
 * words them, the same split the payment rules use.
 *
 * `existingCampaigns` is everything already saved, and `editingId` is the
 * campaign being edited, so renaming a campaign to the name it already has
 * does not collide with itself.
 */
export function reviewCampaignDraft(
  draft: CampaignDraft,
  existingCampaigns: Campaign[],
  editingId?: number,
): CampaignDraftReview {
  const problems: CampaignProblem[] = []
  const name = draft.name.trim()

  if (name === '') problems.push('name-missing')
  else if (
    existingCampaigns.some(
      (campaign) => campaign.id !== editingId && campaign.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    // Names are not what creators point at, so a duplicate breaks nothing.
    // It is refused because two identical chips are unusable, not unsafe.
    problems.push('name-taken')
  }

  const startDate = draft.startDate.trim()
  const endDate = draft.endDate.trim()

  if (startDate === '') problems.push('start-missing')
  if (endDate === '') problems.push('end-missing')

  if (startDate !== '' && endDate !== '') {
    if (!isCalendarDate(startDate) || !isCalendarDate(endDate)) problems.push('dates-unreadable')
    else if (endDate < startDate) problems.push('end-before-start')
  }

  const totalBudgetInCents = parseDollarsToCents(draft.totalBudget)
  const targetCostPerInstallInCents = parseDollarsToCents(draft.targetCostPerInstall)

  if (totalBudgetInCents === null) problems.push('budget-unreadable')
  if (targetCostPerInstallInCents === null) problems.push('target-unreadable')

  return {
    problems,
    canSave: problems.length === 0,
    totalBudgetInCents,
    targetCostPerInstallInCents,
  }
}

export function buildCampaign(draft: CampaignDraft, details: { id: number }): Campaign {
  const { canSave, totalBudgetInCents, targetCostPerInstallInCents } = reviewCampaignDraft(
    draft,
    [],
  )

  /* canSave covers both money fields already; naming them is what lets the
     compiler see they are not null below. */
  if (!canSave || totalBudgetInCents === null || targetCostPerInstallInCents === null) {
    throw new Error('buildCampaign was given a draft that never passed review')
  }

  return {
    id: details.id,
    name: draft.name.trim(),
    startDate: draft.startDate.trim(),
    endDate: draft.endDate.trim(),
    totalBudgetInCents,
    targetCostPerInstallInCents,
  }
}

/** The draft that reopens an existing campaign for editing. */
export function draftFromCampaign(campaign: Campaign): CampaignDraft {
  return {
    name: campaign.name,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    totalBudget: (campaign.totalBudgetInCents / 100).toString(),
    targetCostPerInstall: (campaign.targetCostPerInstallInCents / 100).toString(),
  }
}

/**
 * Money typed into a campaign field, in cents. Zero is allowed here — an
 * unfunded campaign is a real thing to set up — but nothing unreadable is.
 */
/**
 * Reads a typed dollar amount into cents, or null if it cannot be read.
 *
 * Two decimal places at most. A third is not a rounding problem to solve
 * quietly -- $1.005 is not an amount anyone can be paid, and storing $1.01
 * against it puts a figure on the record that nobody typed or agreed. The
 * rounding left is only for binary floating point, where 10.29 * 100 does
 * not land exactly on 1029.
 */
function parseDollarsToCents(typedAmount: string): number | null {
  const trimmed = typedAmount.trim()
  if (!/^\$?\s*(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?|\.\d{1,2})$/.test(trimmed)) return null

  const asNumber = Number(trimmed.replace(/[$,\s]/g, ''))
  return Number.isFinite(asNumber) ? Math.round(asNumber * 100) : null
}

/** Whether a string is a date that exists. Mirrors the payment date rule. */
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
