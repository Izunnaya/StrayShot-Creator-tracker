import type { Creator } from '../../../data/types'
import type { CreatorSortSelection, CreatorTableColumnKey } from '../../../domain/creatorSorting'
import { joinClassNames } from '../../../lib/classNames'
import {
  CREATOR_TABLE_COLUMNS,
  CREATOR_TABLE_COLUMN_WIDTHS,
  CREATOR_TABLE_HORIZONTAL_PADDING,
  CREATOR_TABLE_MINIMUM_WIDTH_PX,
} from '../creatorPerformanceTableLayout'
import { CreatorPerformanceTableRow } from './CreatorPerformanceTableRow'

/**
 * The creator performance table: every creator in the current filter, sorted
 * by whichever column the team picked.
 *
 * The table is handed creators that are ALREADY filtered and sorted. Deciding
 * what to show is the screen's job; this component lays it out and reports
 * clicks on the headings back up.
 */
export function CreatorPerformanceTable({
  creators,
  sortSelection,
  onColumnHeadingClick,
  targetCostPerInstall,
  onSelectCreator,
}: {
  creators: Creator[]
  sortSelection: CreatorSortSelection
  onColumnHeadingClick: (column: CreatorTableColumnKey) => void
  targetCostPerInstall: number
  onSelectCreator?: (creator: Creator) => void
}) {
  return (
    <div className="overflow-x-auto border border-hair bg-panel">
      <CreatorPerformanceTableHeader
        sortSelection={sortSelection}
        onColumnHeadingClick={onColumnHeadingClick}
      />

      {creators.map((creator) => (
        <CreatorPerformanceTableRow
          key={creator.id}
          creator={creator}
          targetCostPerInstall={targetCostPerInstall}
          onSelectCreator={onSelectCreator}
        />
      ))}

      {creators.length === 0 && (
        <div className="border-t border-hair-4 px-4.5 py-6 text-[14px] text-ink-muted">
          No creators match this filter.
        </div>
      )}

      {/* On a phone most of these ten columns sit off-screen. The table is
          scrollable rather than reflowed — money columns split mid-number
          when compressed — so the scroll needs to be discoverable. */}
      {creators.length > 0 && (
        <div className="border-t border-hair-4 px-4.5 py-2.5 text-[12px] text-ink-faint lg:hidden">
          Scroll sideways for the remaining columns
        </div>
      )}
    </div>
  )
}

/**
 * The sortable heading row. The active column is amber and carries an arrow
 * showing which way it is sorted.
 */
function CreatorPerformanceTableHeader({
  sortSelection,
  onColumnHeadingClick,
}: {
  sortSelection: CreatorSortSelection
  onColumnHeadingClick: (column: CreatorTableColumnKey) => void
}) {
  return (
    <div
      className={joinClassNames(
        'grid border-b border-hair bg-panel-head',
        CREATOR_TABLE_COLUMN_WIDTHS,
        CREATOR_TABLE_HORIZONTAL_PADDING,
      )}
      style={{ minWidth: CREATOR_TABLE_MINIMUM_WIDTH_PX }}
    >
      {CREATOR_TABLE_COLUMNS.map((column) => {
        const isSortedByThisColumn = sortSelection.column === column.key
        const sortArrow = sortSelection.direction === 'ascending' ? ' ▲' : ' ▼'

        return (
          <button
            key={column.key}
            type="button"
            onClick={() => onColumnHeadingClick(column.key)}
            aria-sort={
              isSortedByThisColumn
                ? sortSelection.direction === 'ascending'
                  ? 'ascending'
                  : 'descending'
                : 'none'
            }
            className={joinClassNames(
              'cursor-pointer select-none whitespace-nowrap border-none bg-transparent py-2.75 pr-3 text-left text-[11px] uppercase tracking-[1.5px]',
              'hover:text-amber focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-[-2px]',
              isSortedByThisColumn ? 'text-amber' : 'text-ink-muted',
            )}
          >
            {column.heading}
            {isSortedByThisColumn && sortArrow}
          </button>
        )
      })}
    </div>
  )
}
