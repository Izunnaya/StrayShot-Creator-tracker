import type { CampaignSummaryTotals } from '@/domain/campaignSummary'
import { formatCostPerInstall, formatMoney, formatNumber, formatViewsCompact } from '@/lib/format'
import { StatStrip, StatTile } from '@/ui'

/**
 * The four headline figures at the top of the campaign overview.
 *
 * Takes an already-calculated summary rather than a creator list, so that the
 * screen decides which creators count and this component only presents the
 * result.
 */
export function DashboardSummaryStrip({ summary }: { summary: CampaignSummaryTotals }) {
  return (
    <StatStrip>
      <StatTile
        label="Paid to date"
        value={formatMoney(summary.totalAmountPaidInCents)}
        supportingText={`of ${formatMoney(summary.totalContractedAmountInCents)} committed`}
      />
      <StatTile
        label="Outstanding"
        value={formatMoney(summary.totalOutstandingBalanceInCents)}
        supportingText={`across ${summary.creatorsWithOutstandingBalanceCount} creators`}
        tone="needsAttention"
      />
      <StatTile
        label="Total installs"
        value={formatNumber(summary.totalInstalls)}
        supportingText={`${formatViewsCompact(summary.totalViews)} views`}
      />
      <StatTile
        label="Blended cost / install"
        value={formatCostPerInstall(summary.blendedCostPerInstallInCents)}
        supportingText="on money actually paid"
        tone="accent"
      />
    </StatStrip>
  )
}
