/**
 * How a cost-per-install figure compares to what the campaign is willing to
 * pay. This file decides the JUDGEMENT ("this is over target"); the component
 * that shows it decides the COLOUR. Keeping those apart means the thresholds
 * can be argued about without touching a stylesheet, and the palette can
 * change without touching a business rule.
 */

export type CostPerInstallRating =
  /** At or under the campaign's target. */
  | 'under-target'
  /** Over target but within tolerance — worth noticing, not worth acting on. */
  | 'acceptable'
  /** Far enough over target that the team should look at the deal. */
  | 'over-target'
  /** Nothing paid yet, or no target to judge against. Either way, no verdict. */
  | 'not-measurable'

/**
 * How far over target a creator can run before the figure is called out.
 * 1.6x is the threshold the design prototype used.
 */
export const OVER_TARGET_MULTIPLIER = 1.6

export function rateCostPerInstall(
  costPerInstall: number,
  /** null where no campaign target applies to this creator. */
  targetCostPerInstallInCents: number | null,
): CostPerInstallRating {
  /* A figure measured against a target that is not theirs reads as a verdict
     and is not one -- good or bad against a number nobody agreed to. */
  if (targetCostPerInstallInCents === null) return 'not-measurable'
  if (!Number.isFinite(costPerInstall)) return 'not-measurable'
  if (costPerInstall <= targetCostPerInstallInCents) return 'under-target'
  if (costPerInstall <= targetCostPerInstallInCents * OVER_TARGET_MULTIPLIER) return 'acceptable'
  return 'over-target'
}
