import type { Creator } from '@/data/types'
import { getAmountPaid, getCostPerInstall, getLifecycleStatus } from './creatorCalculations'

/**
 * Sorting for the creator table. The column keys here are the sortable
 * columns, named after what they mean rather than after the header text, so
 * that renaming a column heading does not change the sort logic.
 */

export type CreatorTableColumnKey =
  | 'name'
  | 'lifecycleStatus'
  | 'platform'
  | 'creatorCode'
  | 'streamsDelivered'
  | 'totalViews'
  | 'peakConcurrentViewers'
  | 'installsAttributed'
  | 'amountPaid'
  | 'costPerInstall'

export type SortDirection = 'ascending' | 'descending'

export interface CreatorSortSelection {
  column: CreatorTableColumnKey
  direction: SortDirection
}

/**
 * The table opens on cheapest-first cost per install, because "what did each
 * install cost us" is the question the dashboard exists to answer.
 */
export const DEFAULT_SORT_SELECTION: CreatorSortSelection = {
  column: 'costPerInstall',
  direction: 'ascending',
}

/**
 * Text sorts read best A to Z; money and performance figures read best
 * largest-first — except cost per install, where cheapest is best. This is
 * what a column does the FIRST time it is clicked; clicking again reverses it.
 */
export function getInitialDirectionForColumn(column: CreatorTableColumnKey): SortDirection {
  if (column === 'costPerInstall') return 'ascending'
  if (TEXT_COLUMNS.includes(column)) return 'ascending'
  return 'descending'
}

const TEXT_COLUMNS: CreatorTableColumnKey[] = ['name', 'lifecycleStatus', 'platform', 'creatorCode']

/** Pulls the value a given column sorts on out of a creator. */
function getSortValue(creator: Creator, column: CreatorTableColumnKey): string | number {
  switch (column) {
    case 'name':
      return creator.name
    case 'lifecycleStatus':
      return getLifecycleStatus(creator)
    case 'platform':
      return creator.platform
    case 'creatorCode':
      return creator.creatorCode
    case 'streamsDelivered':
      return creator.streamsDelivered
    case 'totalViews':
      return creator.totalViews
    case 'peakConcurrentViewers':
      return creator.peakConcurrentViewers
    case 'installsAttributed':
      return creator.installsAttributed
    case 'amountPaid':
      return getAmountPaid(creator)
    case 'costPerInstall':
      return getCostPerInstall(creator)
  }
}

/**
 * Returns a sorted copy; the input array is left alone.
 *
 * Creators with no measurable cost per install carry Infinity, so they settle
 * at the bottom when sorting cheapest-first — which is where an unmeasurable
 * figure belongs.
 */
export function sortCreators(creators: Creator[], selection: CreatorSortSelection): Creator[] {
  const directionMultiplier = selection.direction === 'ascending' ? 1 : -1

  return [...creators].sort((firstCreator, secondCreator) => {
    const firstValue = getSortValue(firstCreator, selection.column)
    const secondValue = getSortValue(secondCreator, selection.column)

    // Missing measurements stay last in either direction.
    if (selection.column === 'costPerInstall') {
      const firstMeasurable = Number.isFinite(firstValue)
      const secondMeasurable = Number.isFinite(secondValue)
      if (!firstMeasurable || !secondMeasurable) {
        return firstMeasurable ? -1 : secondMeasurable ? 1 : 0
      }
    }

    const comparison =
      typeof firstValue === 'string' && typeof secondValue === 'string'
        ? firstValue.localeCompare(secondValue)
        : Number(firstValue) - Number(secondValue)

    return comparison * directionMultiplier
  })
}

/**
 * Works out what a click on a column header should select: clicking the
 * already-sorted column reverses it, clicking any other column switches to it
 * in that column's natural direction.
 */
export function selectionAfterColumnClick(
  currentSelection: CreatorSortSelection,
  clickedColumn: CreatorTableColumnKey,
): CreatorSortSelection {
  if (currentSelection.column !== clickedColumn) {
    return { column: clickedColumn, direction: getInitialDirectionForColumn(clickedColumn) }
  }

  return {
    column: clickedColumn,
    direction: currentSelection.direction === 'ascending' ? 'descending' : 'ascending',
  }
}
