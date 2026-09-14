import { useState } from 'react'
import type { CreatorLifecycleStatus } from '@/data/types'
import {
  EVERY_CAMPAIGN,
  EVERY_STATUS,
  type CampaignFilter,
  type CreatorFilterSelection,
  type LifecycleStatusFilter,
} from '@/domain/creatorFiltering'

/**
 * Holds which campaign and which lifecycle status the dashboard is filtered
 * to, and what has been typed into its search. Changing one does not reset
 * the others — they narrow independently.
 */
export function useCreatorFilterSelection() {
  const [selection, setSelection] = useState<Required<CreatorFilterSelection>>({
    campaign: EVERY_CAMPAIGN,
    lifecycleStatus: EVERY_STATUS,
    searchText: '',
  })

  function selectCampaign(campaign: CampaignFilter) {
    setSelection((current) => ({ ...current, campaign }))
  }

  function selectLifecycleStatus(lifecycleStatus: LifecycleStatusFilter) {
    setSelection((current) => ({ ...current, lifecycleStatus }))
  }

  function setSearchText(searchText: string) {
    setSelection((current) => ({ ...current, searchText }))
  }

  /** True when one specific campaign is selected, rather than all of them. */
  const hasSpecificCampaignSelected = selection.campaign !== EVERY_CAMPAIGN

  return {
    selection,
    selectCampaign,
    selectLifecycleStatus,
    setSearchText,
    hasSpecificCampaignSelected,
  }
}

export type {
  CampaignFilter,
  CreatorFilterSelection,
  CreatorLifecycleStatus,
  LifecycleStatusFilter,
}
