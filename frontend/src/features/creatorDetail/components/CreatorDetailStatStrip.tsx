import type { Creator } from '@/data/types'
import { rateCostPerInstall, type CostPerInstallRating } from '@/domain/costPerInstallRating'
import { getAmountPaid, getCostPerInstall } from '@/domain/creatorCalculations'
import { formatCostPerInstall, formatMoney, formatNumber } from '@/lib/format'
import { StatStrip, StatTile, type StatTileTone } from '@/ui'

/**
 * How this one creator is performing: reach, spend, and what that spend
 * bought.
 *
 * The same four figures the dashboard shows for a whole campaign, narrowed to
 * one creator, so a team member moving between the two screens reads them the
 * same way. They sit in the compact size because on this screen the creator
 * is the subject and these are supporting evidence.
 */

/** Cost per install carries the same verdict here as in the table. */
const toneForRating: Record<CostPerInstallRating, StatTileTone> = {
  'under-target': 'settled',
  acceptable: 'neutral',
  'over-target': 'needsAttention',
  'not-measurable': 'neutral',
}

export function CreatorDetailStatStrip({
  creator,
  targetCostPerInstallInCents,
}: {
  creator: Creator
  /**
   * The target from this creator's own campaign, not the dashboard filter,
   * and null when they have no campaign: the figure still shows, the verdict
   * does not.
   */
  targetCostPerInstallInCents: number | null
}) {
  const costPerInstall = getCostPerInstall(creator)
  const rating = rateCostPerInstall(costPerInstall, targetCostPerInstallInCents)

  return (
    <StatStrip hasAmberFrame={false}>
      <StatTile size="compact" label="Installs" value={formatNumber(creator.installsAttributed)} />
      <StatTile
        size="compact"
        label="Total views"
        phoneLabel="Views"
        value={formatNumber(creator.totalViews)}
      />
      <StatTile
        size="compact"
        label="Paid to date"
        phoneLabel="Paid"
        value={formatMoney(getAmountPaid(creator))}
      />
      <StatTile
        size="compact"
        label="Cost / install"
        value={formatCostPerInstall(costPerInstall)}
        tone={toneForRating[rating]}
      />
    </StatStrip>
  )
}
