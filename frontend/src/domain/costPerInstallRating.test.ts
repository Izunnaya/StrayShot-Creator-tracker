import { describe, expect, it } from 'vitest'
import {
  OVER_TARGET_MULTIPLIER,
  rateCostPerInstall,
  type CostPerInstallRating,
} from './costPerInstallRating'

const TARGET = 3.5

describe('rateCostPerInstall', () => {
  const rate = (costPerInstall: number): CostPerInstallRating =>
    rateCostPerInstall(costPerInstall, TARGET)

  it('rates a figure comfortably under the target as under target', () => {
    expect(rate(1.84)).toBe('under-target')
  })

  it('treats a figure exactly on the target as under target, not over', () => {
    // Boundary: the target is what the team agreed to pay, so hitting it
    // exactly is a success rather than a warning.
    expect(rate(TARGET)).toBe('under-target')
  })

  it('rates a figure just over the target as acceptable', () => {
    expect(rate(3.51)).toBe('acceptable')
  })

  it('treats the top of the tolerance band as still acceptable', () => {
    expect(rate(TARGET * OVER_TARGET_MULTIPLIER)).toBe('acceptable')
  })

  it('rates anything past the tolerance band as over target', () => {
    expect(rate(TARGET * OVER_TARGET_MULTIPLIER + 0.01)).toBe('over-target')
    expect(rate(6.25)).toBe('over-target')
  })

  it('reports no judgement when there is no measurable figure', () => {
    // Matches getCostPerInstall, which returns Infinity for an unpaid creator.
    expect(rate(Infinity)).toBe('not-measurable')
  })

  it('follows whichever target it is given, not a fixed one', () => {
    // Each campaign carries its own target, so the same figure can be a pass
    // on one campaign and a fail on another.
    expect(rateCostPerInstall(2.9, 3.0)).toBe('under-target')
    expect(rateCostPerInstall(2.9, 1.5)).toBe('over-target')
  })
})

describe('with no target to judge against', () => {
  /* The creator has no campaign, so nobody has agreed what an install is
     worth to them. A figure is still a figure; it is the verdict that has
     nothing to rest on. */
  it('reaches no verdict, however good or bad the figure looks', () => {
    expect(rateCostPerInstall(0.1, null)).toBe('not-measurable')
    expect(rateCostPerInstall(99, null)).toBe('not-measurable')
  })
})
