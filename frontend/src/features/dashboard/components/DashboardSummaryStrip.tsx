import type { CampaignSummaryTotals } from '@/domain/campaignSummary'
import { formatCostPerInstall, formatMoney, formatNumber, formatViewsCompact } from '@/lib/format'
import { StatStrip, StatTile } from '@/ui'

/**
 * The four headline figures at the top of the campaign overview.
 *
 * Takes an already-calculated summary rather than a creator list, so that the
 * screen decides which creators count and this component only presents the
 * result. On a phone the row scrolls sideways and the captions shorten, as
 * the phone design writes them.
 */
export function DashboardSummaryStrip({ summary }: { summary: CampaignSummaryTotals }) {
  const creatorsOwed = summary.creatorsWithOutstandingBalanceCount

  return (
    <StatStrip mobileLayout="scroll">
      <StatTile
        label="Paid to date"
        value={formatMoney(summary.totalAmountPaidInCents)}
        supportingText={`of ${formatMoney(summary.totalContractedAmountInCents)} committed`}
        phoneSupportingText={`of ${formatMoney(summary.totalContractedAmountInCents)}`}
      />
      <StatTile
        label="Outstanding"
        value={formatMoney(summary.totalOutstandingBalanceInCents)}
        supportingText={`across ${creatorsOwed} creators`}
        phoneSupportingText={`${creatorsOwed} creators`}
        tone="needsAttention"
      />
      <StatTile
        label="Total installs"
        phoneLabel="Installs"
        value={formatNumber(summary.totalInstalls)}
        supportingText={`${formatViewsCompact(summary.totalViews)} views`}
      />
      <StatTile
        label="Blended cost / install"
        phoneLabel="Cost / install"
        value={formatCostPerInstall(summary.blendedCostPerInstallInCents)}
        supportingText="on money actually paid"
        phoneSupportingText="blended"
        tone="accent"
      />
    </StatStrip>
  )
}
