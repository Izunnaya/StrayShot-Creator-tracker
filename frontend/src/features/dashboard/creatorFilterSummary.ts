import type { Campaign } from '@/data/types'
import {
  EVERY_CAMPAIGN,
  EVERY_STATUS,
  type CampaignFilter,
  type LifecycleStatusFilter,
} from '@/domain/creatorFiltering'

/**
 * What the filter button says is applied: nothing, the one filter by name, or
 * how many when both are, as the phone design words it.
 */
export function describeCreatorFilters(
  campaigns: Campaign[],
  selectedCampaign: CampaignFilter,
  selectedStatus: LifecycleStatusFilter,
): { summary: string; isFiltered: boolean } {
  const campaignApplied = selectedCampaign !== EVERY_CAMPAIGN
  const statusApplied = selectedStatus !== EVERY_STATUS

  if (campaignApplied && statusApplied) return { summary: '2 active', isFiltered: true }
  if (campaignApplied) {
    const name = campaigns.find((campaign) => campaign.id === selectedCampaign)?.name
    return { summary: name ?? 'One campaign', isFiltered: true }
  }
  if (statusApplied) {
    return {
      summary: selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1),
      isFiltered: true,
    }
  }
  return { summary: 'All creators', isFiltered: false }
}
