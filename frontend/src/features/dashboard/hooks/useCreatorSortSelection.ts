import { useState } from 'react'
import {
  DEFAULT_SORT_SELECTION,
  selectionAfterColumnClick,
  type CreatorSortSelection,
  type CreatorTableColumnKey,
} from '@/domain/creatorSorting'

/**
 * Holds which column the creator table is sorted by, and in which direction.
 *
 * The rule for what a click does — switch column, or reverse the current one —
 * lives in the domain as a pure function, so this hook only stores the result.
 */
export function useCreatorSortSelection() {
  const [selection, setSelection] = useState<CreatorSortSelection>(DEFAULT_SORT_SELECTION)

  function handleColumnClick(column: CreatorTableColumnKey) {
    setSelection((current) => selectionAfterColumnClick(current, column))
  }

  return { selection, handleColumnClick }
}
