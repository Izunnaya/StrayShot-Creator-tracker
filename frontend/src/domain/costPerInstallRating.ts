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
  /** Nothing paid yet, so there is no figure to judge. */
  | 'not-measurable'

/**
 * How far over target a creator can run before the figure is called out.
 * 1.6x is the threshold the design prototype used.
 */
export const OVER_TARGET_MULTIPLIER = 1.6

/**
 * Target used when the dashboard is showing every campaign at once and no
 * single campaign target applies, in cents. Open question Q21 — the
 * alternative is to suppress the rating entirely at that level.
 */
export const DEFAULT_TARGET_COST_PER_INSTALL_IN_CENTS = 350

export function rateCostPerInstall(
  costPerInstall: number,
  targetCostPerInstallInCents: number,
): CostPerInstallRating {
  if (!Number.isFinite(costPerInstall)) return 'not-measurable'
  if (costPerInstall <= targetCostPerInstallInCents) return 'under-target'
  if (costPerInstall <= targetCostPerInstallInCents * OVER_TARGET_MULTIPLIER) return 'acceptable'
  return 'over-target'
}
