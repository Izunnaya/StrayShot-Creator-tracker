import type { Creator } from '../data/types'
import { getAmountPaid, getOutstandingBalance, hasOutstandingBalance } from './creatorCalculations'

/**
 * The four figures across the top of the campaign overview, worked out from
 * whichever creators are currently in view.
 *
 * Note that these totals are calculated from the FILTERED set of creators, so
 * narrowing the status filter also narrows the figures. Whether that is what
 * the team expects is open question Q20.
 */
export interface CampaignSummaryTotals {
  totalAmountPaid: number
  totalContractedAmount: number
  totalOutstandingBalance: number
  creatorsWithOutstandingBalanceCount: number
  totalInstalls: number
  totalViews: number
  /**
   * Total paid divided by total installs. Infinity when no installs have
   * landed yet, matching getCostPerInstall for a single creator.
   */
  blendedCostPerInstall: number
}

export function calculateCampaignSummary(creators: Creator[]): CampaignSummaryTotals {
  const totalAmountPaid = sumBy(creators, getAmountPaid)
  const totalInstalls = sumBy(creators, (creator) => creator.installsAttributed)

  return {
    totalAmountPaid,
    totalContractedAmount: sumBy(creators, (creator) => creator.contractedAmount),
    totalOutstandingBalance: sumBy(creators, getOutstandingBalance),
    creatorsWithOutstandingBalanceCount: creators.filter(hasOutstandingBalance).length,
    totalInstalls,
    totalViews: sumBy(creators, (creator) => creator.totalViews),
    blendedCostPerInstall: totalInstalls === 0 ? Infinity : totalAmountPaid / totalInstalls,
  }
}

function sumBy(creators: Creator[], getValue: (creator: Creator) => number): number {
  return creators.reduce((runningTotal, creator) => runningTotal + getValue(creator), 0)
}
