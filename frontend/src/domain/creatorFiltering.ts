import type { Creator, CreatorLifecycleStatus } from '../data/types'
import { getLifecycleStatus } from './creatorCalculations'

/**
 * The two filters on the campaign overview: which campaign, and which
 * lifecycle status. Both can be set to "everything", which is why they use
 * these explicit sentinel values rather than null or an empty string.
 */

export const EVERY_CAMPAIGN = 'every-campaign'
export const EVERY_STATUS = 'every-status'

/** A campaign name, or the sentinel meaning no campaign filter is applied. */
export type CampaignFilter = typeof EVERY_CAMPAIGN | string

/** A lifecycle status, or the sentinel meaning no status filter is applied. */
export type LifecycleStatusFilter = typeof EVERY_STATUS | CreatorLifecycleStatus

export interface CreatorFilterSelection {
  campaign: CampaignFilter
  lifecycleStatus: LifecycleStatusFilter
}

export function filterCreatorsByCampaign(creators: Creator[], campaign: CampaignFilter): Creator[] {
  if (campaign === EVERY_CAMPAIGN) return creators
  return creators.filter((creator) => creator.campaignName === campaign)
}

export function filterCreatorsByLifecycleStatus(
  creators: Creator[],
  lifecycleStatus: LifecycleStatusFilter,
): Creator[] {
  if (lifecycleStatus === EVERY_STATUS) return creators
  return creators.filter((creator) => getLifecycleStatus(creator) === lifecycleStatus)
}

export function filterCreators(
  creators: Creator[],
  selection: CreatorFilterSelection,
): Creator[] {
  const withinCampaign = filterCreatorsByCampaign(creators, selection.campaign)
  return filterCreatorsByLifecycleStatus(withinCampaign, selection.lifecycleStatus)
}

/**
 * Counts shown on the status filter chips.
 *
 * Deliberately counts within the selected campaign but IGNORES the selected
 * status, so that every chip shows how many creators it would reveal rather
 * than only the selected chip showing a non-zero number.
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
