import type { Campaign, Creator } from '@/data/types'
import { filterCreatorsByCampaign } from './creatorFiltering'

/**
 * What a campaign has committed against what it budgeted.
 *
 * Committed is the agreed total of every deal on the campaign, not what has
 * been paid: the money is spoken for the moment a deal is signed, which is
 * the figure a budget is a constraint on.
 *
 * Going over is allowed and reported rather than refused, for the reason
 * DECISIONS Q5 gives about overpayment: a deal that was agreed is a fact, and
 * a tracker that refuses to hold facts is worked around rather than obeyed.
 * The same shape is used here — remaining floors at zero, the overage is its
 * own figure, and the bar caps at full — because a budget and a balance are
 * read the same way and should not behave differently.
 */
export interface CampaignBudgetPosition {
  budgetInCents: number
  /** The agreed total of every deal on this campaign. */
  committedInCents: number
  /** What is left to commit. Zero once the budget is used up. */
  remainingInCents: number
  /** Committed beyond the budget. Zero unless it is over. */
  overcommittedInCents: number
  isOvercommitted: boolean
  /** How much of the budget is committed, 0 to 100. */
  committedPercent: number
  /** How many creators the commitment is spread across. */
  creatorCount: number
}

export function getCampaignBudgetPosition(
  campaign: Campaign,
  creators: Creator[],
): CampaignBudgetPosition {
  const onThisCampaign = filterCreatorsByCampaign(creators, campaign.id)
  const committedInCents = onThisCampaign.reduce(
    (total, creator) => total + creator.contractedAmountInCents,
    0,
  )

  return {
    budgetInCents: campaign.totalBudgetInCents,
    committedInCents,
    remainingInCents: Math.max(0, campaign.totalBudgetInCents - committedInCents),
    overcommittedInCents: Math.max(0, committedInCents - campaign.totalBudgetInCents),
    isOvercommitted: committedInCents > campaign.totalBudgetInCents,
    /* A campaign budgeted at nothing is fully committed the moment anything
       is agreed, and not before -- the alternative is dividing by zero. */
    committedPercent:
      campaign.totalBudgetInCents === 0
        ? committedInCents > 0
          ? 100
          : 0
        : Math.min(100, (committedInCents / campaign.totalBudgetInCents) * 100),
    creatorCount: onThisCampaign.length,
  }
}
