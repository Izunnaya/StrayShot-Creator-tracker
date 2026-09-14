import type { Creator, CreatorLifecycleStatus } from '@/data/types'
import { getLifecycleStatus } from './creatorCalculations'

/**
 * The filters on the campaign overview: which campaign, which lifecycle
 * status, and what has been typed into the search. The first two can be set to
 * "everything", which is why they use these explicit sentinel values rather
 * than null or an empty string. An empty search already means everything.
 */

export const EVERY_CAMPAIGN = 'every-campaign'
export const EVERY_STATUS = 'every-status'

/** A campaign id, or the sentinel meaning no campaign filter is applied. */
export type CampaignFilter = typeof EVERY_CAMPAIGN | number

/** A lifecycle status, or the sentinel meaning no status filter is applied. */
export type LifecycleStatusFilter = typeof EVERY_STATUS | CreatorLifecycleStatus

export interface CreatorFilterSelection {
  campaign: CampaignFilter
  lifecycleStatus: LifecycleStatusFilter
  /** Matched against a creator's name or code. Absent or blank matches everyone. */
  searchText?: string
}

export function filterCreatorsByCampaign(creators: Creator[], campaign: CampaignFilter): Creator[] {
  if (campaign === EVERY_CAMPAIGN) return creators
  return creators.filter((creator) => creator.campaignId === campaign)
}

export function filterCreatorsByLifecycleStatus(
  creators: Creator[],
  lifecycleStatus: LifecycleStatusFilter,
): Creator[] {
  if (lifecycleStatus === EVERY_STATUS) return creators
  return creators.filter((creator) => getLifecycleStatus(creator) === lifecycleStatus)
}

/**
 * Creators whose name or code contains the search, ignoring case.
 *
 * The code is searched as well as the name because it is what the team is
 * usually holding when they go looking: it is the thing typed at checkout and
 * the thing that shows up in an attribution report, while the name is what
 * the table already sorts by.
 */
export function filterCreatorsBySearch(creators: Creator[], searchText: string): Creator[] {
  const needle = normaliseSearch(searchText)
  if (!needle) return creators
  return creators.filter(
    (creator) =>
      creator.name.toLowerCase().includes(needle) ||
      creator.creatorCode.toLowerCase().includes(needle),
  )
}

export function filterCreators(creators: Creator[], selection: CreatorFilterSelection): Creator[] {
  const withinCampaign = filterCreatorsByCampaign(creators, selection.campaign)
  const withStatus = filterCreatorsByLifecycleStatus(withinCampaign, selection.lifecycleStatus)
  return filterCreatorsBySearch(withStatus, selection.searchText ?? '')
}

/**
 * Trimmed and lower-cased, so a pasted code with a trailing space still
 * matches. Shared with the ledger's search, which should behave the same way.
 */
export function normaliseSearch(searchText: string): string {
  return searchText.trim().toLowerCase()
}

/**
 * Counts shown on the status filter chips.
 *
 * Deliberately counts within the selected campaign but IGNORES the selected
 * status, so that every chip shows how many creators it would reveal rather
 * than only the selected chip showing a non-zero number. The search is
 * ignored too, as the design does: a search is a momentary lookup, and the
 * counts describe the campaign.
 */
export function countCreatorsByLifecycleStatus(
  creators: Creator[],
  campaign: CampaignFilter,
): Record<CreatorLifecycleStatus, number> & { total: number } {
  const withinCampaign = filterCreatorsByCampaign(creators, campaign)
  const countWithStatus = (status: CreatorLifecycleStatus) =>
    withinCampaign.filter((creator) => getLifecycleStatus(creator) === status).length

  return {
    total: withinCampaign.length,
    prospect: countWithStatus('prospect'),
    contracted: countWithStatus('contracted'),
    active: countWithStatus('active'),
    completed: countWithStatus('completed'),
  }
}
