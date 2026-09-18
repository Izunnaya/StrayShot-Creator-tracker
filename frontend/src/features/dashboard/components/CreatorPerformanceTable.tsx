import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Creator } from '@/data/types'
import {
  describePhoneSort,
  type CreatorSortSelection,
  type CreatorTableColumnKey,
} from '@/domain/creatorSorting'
import { joinClassNames } from '@/lib/classNames'
import { useNarrowLayout } from '@/lib/usePhoneLayout'
import {
  CREATOR_TABLE_COLUMNS,
  CREATOR_TABLE_MINIMUM_WIDTH_PX,
  CREATOR_TABLE_COLUMN_WEIGHTS,
} from '@/features/dashboard/creatorPerformanceTableLayout'
import { CreatorPerformanceCardList } from './CreatorPerformanceCardList'
import { CreatorPerformanceTableRow } from './CreatorPerformanceTableRow'

export function CreatorPerformanceTable({
  creators,
  sortSelection,
  onColumnHeadingClick,
  onStepPhoneSort,
  getTargetCostPerInstall,
  onSelectCreator,
  onRecordPayment,
  emptyMessage = 'No creators match this filter.',
}: {
  creators: Creator[]
  sortSelection: CreatorSortSelection
  onColumnHeadingClick: (column: CreatorTableColumnKey) => void
  /** The cards have no headings to click; one button steps through the orders. */
  onStepPhoneSort?: () => void
  /**
   * The target each creator is judged against: that of the campaign they are
   * on, whether or not the table is narrowed to it. Null where they have none.
   */
  getTargetCostPerInstall: (creator: Creator) => number | null
  onSelectCreator?: (creator: Creator) => void
  /** Offered on the cards, which carry the outstanding panel's action. */
  onRecordPayment?: (creator: Creator) => void
  /**
   * Shown in place of the rows when nothing is left. The default reads as a
   * filter that matched nothing, which is what it usually is -- the archived
   * shelf passes its own, because an empty shelf is not a failed search.
   */
  emptyMessage?: string
}) {
  const totalColumnWeight = CREATOR_TABLE_COLUMN_WEIGHTS.reduce((sum, value) => sum + value, 0)
  const scrollArea = useRef<HTMLDivElement>(null)
  const isNarrow = useNarrowLayout()
  // Measured again when the table appears, having been cards a moment before.
  const canScrollSideways = useHorizontalOverflow(scrollArea, isNarrow)

  /* Cards below lg, the full table from lg up. Only one is ever rendered. */
  if (isNarrow) {
    const sortLabel =
      describePhoneSort(sortSelection) ??
      CREATOR_TABLE_COLUMNS.find((column) => column.key === sortSelection.column)?.heading

    return (
      <div>
        <div className="flex items-center justify-between pb-2 pt-0.5">
          <span className="text-[11px] uppercase tracking-[1.5px] text-ink-muted">
            {creators.length} {creators.length === 1 ? 'creator' : 'creators'}
          </span>
          {onStepPhoneSort && (
            <button
              type="button"
              onClick={onStepPhoneSort}
              aria-label={`Sorted by ${sortLabel}. Change order`}
              className="min-h-10 cursor-pointer whitespace-nowrap border border-hair bg-transparent px-3 py-2 text-[12px] uppercase tracking-[1px] text-ink-muted hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
            >
              Sort · {sortLabel}
            </button>
          )}
        </div>
        <CreatorPerformanceCardList
          creators={creators}
          getTargetCostPerInstall={getTargetCostPerInstall}
          onSelectCreator={onSelectCreator}
          onRecordPayment={onRecordPayment}
          emptyMessage={emptyMessage}
        />
      </div>
    )
  }

  return (
    <div className="border border-hair bg-panel">
      <div ref={scrollArea} className="overflow-x-auto">
        <table
          className="w-full table-fixed border-collapse text-left"
          style={{ minWidth: CREATOR_TABLE_MINIMUM_WIDTH_PX }}
        >
          <caption className="sr-only">Creator performance</caption>
          <colgroup>
            {CREATOR_TABLE_COLUMN_WEIGHTS.map((weight, index) => (
              <col key={index} style={{ width: (weight / totalColumnWeight) * 100 + '%' }} />
            ))}
          </colgroup>
          <thead className="border-b border-hair bg-panel-head">
            <tr>
              {CREATOR_TABLE_COLUMNS.map((column) => {
                const selected = sortSelection.column === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={selected ? sortSelection.direction : 'none'}
                    className="px-2 first:pl-4.5 last:pr-4.5"
                  >
                    <button
                      type="button"
                      onClick={() => onColumnHeadingClick(column.key)}
                      className={joinClassNames(
                        'w-full cursor-pointer whitespace-nowrap border-none bg-transparent py-2.75 text-left text-[11px] font-normal uppercase tracking-[1.5px] hover:text-amber focus-visible:outline-2 focus-visible:outline-amber',
                        selected ? 'text-amber' : 'text-ink-muted',
                      )}
                    >
                      {column.heading}
                      {selected && (
                        <span aria-hidden="true">
                          {sortSelection.direction === 'ascending' ? ' ▲' : ' ▼'}
                        </span>
                      )}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {creators.map((creator) => (
              <CreatorPerformanceTableRow
                key={creator.id}
                creator={creator}
                targetCostPerInstallInCents={getTargetCostPerInstall(creator)}
                onSelectCreator={onSelectCreator}
              />
            ))}
            {creators.length === 0 && (
              <tr>
                <td
                  colSpan={CREATOR_TABLE_COLUMNS.length}
                  className="px-4.5 py-6 text-[14px] text-ink-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {creators.length > 0 && canScrollSideways && (
          <p className="border-t border-hair-4 px-4.5 py-2.5 text-[12px] text-ink-faint">
            Scroll sideways for the remaining columns
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Whether an element's content is wider than the room it has.
 *
 * Measured rather than reasoned about. The table's minimum width is fixed,
 * but the width available to it is not: it comes from the page container,
 * which is capped at 1280px today and is one of the open layout decisions.
 * A hint derived from today's numbers would start lying the day that cap
 * moves, and telling someone to scroll a table that already fits is worse
 * than saying nothing.
 */
function useHorizontalOverflow(
  elementRef: RefObject<HTMLElement | null>,
  layoutKey: unknown,
): boolean {
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const measure = () => setOverflows(element.scrollWidth > element.clientWidth + 1)
    measure()

    // jsdom reports no layout and has no ResizeObserver; one measurement is
    // all that is available there, and it correctly reports no overflow.
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef, layoutKey])

  return overflows
}
