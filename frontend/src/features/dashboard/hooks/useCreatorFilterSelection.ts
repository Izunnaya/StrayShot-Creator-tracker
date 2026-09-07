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
 * to. Selecting a campaign does not reset the status filter, and vice versa —
 * the two narrow independently.
 */
export function useCreatorFilterSelection() {
  const [selection, setSelection] = useState<CreatorFilterSelection>({
    campaign: EVERY_CAMPAIGN,
    lifecycleStatus: EVERY_STATUS,
  })

  function selectCampaign(campaign: CampaignFilter) {
    setSelection((current) => ({ ...current, campaign }))
  }

  function selectLifecycleStatus(lifecycleStatus: LifecycleStatusFilter) {
    setSelection((current) => ({ ...current, lifecycleStatus }))
  }

  /** True when one specific campaign is selected, rather than all of them. */
  const hasSpecificCampaignSelected = selection.campaign !== EVERY_CAMPAIGN

  return {
    selection,
    selectCampaign,
    selectLifecycleStatus,
    hasSpecificCampaignSelected,
  }
}

export type {
  CampaignFilter,
  CreatorFilterSelection,
  CreatorLifecycleStatus,
  LifecycleStatusFilter,
}
