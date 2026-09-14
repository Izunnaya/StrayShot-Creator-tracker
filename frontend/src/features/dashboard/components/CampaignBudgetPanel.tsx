import type { Campaign, Creator } from '@/data/types'
import { getCampaignBudgetPosition } from '@/domain/campaignBudget'
import { joinClassNames } from '@/lib/classNames'
import { formatMoney } from '@/lib/format'
import { ProgressBar } from '@/ui'

/**
 * Where a campaign stands against its budget.
 *
 * The budget was collected by the campaign form and then shown nowhere, so a
 * team could commit past it without anything on screen saying so. This reads
 * the same way as a creator's payment progress, deliberately: committed
 * against agreed, what is left, and a bar — the two are the same question at
 * different scopes.
 *
 * Only shown with a single campaign in view, for the reason the edit button
 * is: with every campaign at once there is no one budget to be over.
 */
export function CampaignBudgetPanel({
  campaign,
  creators,
}: {
  campaign: Campaign
  /** Every creator; the deals on this campaign are picked out here. */
  creators: Creator[]
}) {
  const position = getCampaignBudgetPosition(campaign, creators)

  return (
    <div className="border border-hair bg-panel px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="text-[13px] text-ink-muted">
          {formatMoney(position.committedInCents)} committed of{' '}
          {formatMoney(position.budgetInCents)} budget, across {position.creatorCount}{' '}
          {position.creatorCount === 1 ? 'creator' : 'creators'}
        </div>

        <div
          className={joinClassNames(
            'font-head text-[15px] font-semibold tracking-[1px]',
            position.isOvercommitted ? 'text-bad' : 'text-good',
          )}
        >
          {position.isOvercommitted
            ? `${formatMoney(position.overcommittedInCents)} over budget`
            : `${formatMoney(position.remainingInCents)} left to commit`}
        </div>
      </div>

      <ProgressBar percentComplete={position.committedPercent} heightInPixels={7} />
    </div>
  )
}
