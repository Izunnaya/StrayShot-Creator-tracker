import type { Creator } from '@/data/types'
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
  totalAmountPaidInCents: number
  totalContractedAmountInCents: number
  totalOutstandingBalanceInCents: number
  creatorsWithOutstandingBalanceCount: number
  totalInstalls: number
  totalViews: number
  /**
   * Total paid divided by total installs, in cents per install. Infinity when
   * no installs have landed or no money has been paid.
   */
  blendedCostPerInstallInCents: number
}

export function calculateCampaignSummary(creators: Creator[]): CampaignSummaryTotals {
  const totalAmountPaidInCents = sumBy(creators, getAmountPaid)
  const totalInstalls = sumBy(creators, (creator) => creator.installsAttributed)

  return {
    totalAmountPaidInCents,
    totalContractedAmountInCents: sumBy(creators, (creator) => creator.contractedAmountInCents),
    totalOutstandingBalanceInCents: sumBy(creators, getOutstandingBalance),
    creatorsWithOutstandingBalanceCount: creators.filter(hasOutstandingBalance).length,
    totalInstalls,
    totalViews: sumBy(creators, (creator) => creator.totalViews),
    blendedCostPerInstallInCents:
      totalInstalls === 0 || totalAmountPaidInCents === 0
        ? Infinity
        : totalAmountPaidInCents / totalInstalls,
  }
}

function sumBy(creators: Creator[], getValue: (creator: Creator) => number): number {
  return creators.reduce((runningTotal, creator) => runningTotal + getValue(creator), 0)
}
