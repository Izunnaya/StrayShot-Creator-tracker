import type { Creator, CreatorLifecycleStatus } from '@/data/types'
import { filterArchived, filterOutArchived } from './creatorArchive'
import { getLifecycleStatus } from './creatorCalculations'

/**
 * The filters on the campaign overview: which campaign, which lifecycle
 * status, and what has been typed into the search. The first two can be set to
 * "everything", which is why they use these explicit sentinel values rather
 * than null or an empty string. An empty search already means everything.
 */

export const EVERY_CAMPAIGN = 'every-campaign'
export const EVERY_STATUS = 'every-status'
/**
 * Archived creators are out of the roster, so they are not part of "every
 * status" — they are their own selection, and the only way back to them.
 * See DECISIONS.md, Q51.
 */
export const ARCHIVED_ONLY = 'archived'

/** A campaign id, or the sentinel meaning no campaign filter is applied. */
export type CampaignFilter = typeof EVERY_CAMPAIGN | number

/** A lifecycle status, the sentinel for all of them, or the archived shelf. */
export type LifecycleStatusFilter =
  typeof EVERY_STATUS | typeof ARCHIVED_ONLY | CreatorLifecycleStatus

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

/**
 * Narrows to one point in the lifecycle — or to the archived shelf, which is
 * the one selection that reaches creators the roster otherwise hides.
 */
export function filterCreatorsByLifecycleStatus(
  creators: Creator[],
  lifecycleStatus: LifecycleStatusFilter,
): Creator[] {
  if (lifecycleStatus === ARCHIVED_ONLY) return filterArchived(creators)

  const inRoster = filterOutArchived(creators)
  if (lifecycleStatus === EVERY_STATUS) return inRoster
  return inRoster.filter((creator) => getLifecycleStatus(creator) === lifecycleStatus)
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
): Record<CreatorLifecycleStatus, number> & { total: number; archived: number } {
  const withinCampaign = filterCreatorsByCampaign(creators, campaign)
  /* Every count but the archived one describes the roster, so that "All 14"
     and the chips under it agree with the table they sit above. */
  const inRoster = filterOutArchived(withinCampaign)
  const countWithStatus = (status: CreatorLifecycleStatus) =>
    inRoster.filter((creator) => getLifecycleStatus(creator) === status).length

  return {
    total: inRoster.length,
    prospect: countWithStatus('prospect'),
    contracted: countWithStatus('contracted'),
    active: countWithStatus('active'),
    completed: countWithStatus('completed'),
    archived: filterArchived(withinCampaign).length,
  }
}
