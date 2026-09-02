import type { CostPerInstallRating } from '../../domain/costPerInstallRating'

/**
 * Turns the domain's judgement about a cost-per-install figure into colour.
 *
 * The judgement itself (what counts as over target) lives in
 * src/domain/costPerInstallRating.ts. This file only decides how each verdict
 * looks, so the thresholds and the palette can change independently.
 */
export const costPerInstallClasses: Record<CostPerInstallRating, string> = {
  'under-target': 'text-good bg-good/10',
  acceptable: 'text-ink',
  'over-target': 'text-bad bg-bad/10',
  'not-measurable': 'text-ink-muted',
}
