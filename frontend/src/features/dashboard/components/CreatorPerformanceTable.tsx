import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Creator } from '@/data/types'
import type { CreatorSortSelection, CreatorTableColumnKey } from '@/domain/creatorSorting'
import { joinClassNames } from '@/lib/classNames'
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
  targetCostPerInstallInCents,
  onSelectCreator,
}: {
  creators: Creator[]
  sortSelection: CreatorSortSelection
  onColumnHeadingClick: (column: CreatorTableColumnKey) => void
  targetCostPerInstallInCents: number
  onSelectCreator?: (creator: Creator) => void
}) {
  const totalColumnWeight = CREATOR_TABLE_COLUMN_WEIGHTS.reduce((sum, value) => sum + value, 0)
  const scrollArea = useRef<HTMLDivElement>(null)
  const canScrollSideways = useHorizontalOverflow(scrollArea)

  return (
    <div className="border border-hair bg-panel">
      {/* Cards below lg, the full table from lg up. Only one is ever
          displayed, so assistive technology only ever sees one of them. */}
      <div className="lg:hidden">
        <CreatorPerformanceCardList
          creators={creators}
          targetCostPerInstallInCents={targetCostPerInstallInCents}
          onSelectCreator={onSelectCreator}
        />
      </div>

      <div ref={scrollArea} className="hidden overflow-x-auto lg:block">
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
                targetCostPerInstallInCents={targetCostPerInstallInCents}
                onSelectCreator={onSelectCreator}
              />
            ))}
            {creators.length === 0 && (
              <tr>
                <td
                  colSpan={CREATOR_TABLE_COLUMNS.length}
                  className="px-4.5 py-6 text-[14px] text-ink-muted"
                >
                  No creators match this filter.
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
function useHorizontalOverflow(elementRef: RefObject<HTMLElement | null>): boolean {
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
  }, [elementRef])

  return overflows
}
