import type { ReactNode } from 'react'
import type { Creator } from '../../../data/types'
import { rateCostPerInstall } from '../../../domain/costPerInstallRating'
import {
  getAmountPaid,
  getCostPerInstall,
  getLifecycleStatus,
  getOutstandingBalance,
  getPaymentProgressPercent,
} from '../../../domain/creatorCalculations'
import { joinClassNames } from '../../../lib/classNames'
import { formatCostPerInstall, formatMoney, formatNumber } from '../../../lib/format'
import { CreatorStatusPill, PlatformTag, ProgressBar } from '../../../ui'
import { costPerInstallClasses } from '../costPerInstallAppearance'
import {
  CREATOR_TABLE_COLUMN_WIDTHS,
  CREATOR_TABLE_HORIZONTAL_PADDING,
  CREATOR_TABLE_MINIMUM_WIDTH_PX,
} from '../creatorPerformanceTableLayout'

/**
 * One creator's row in the performance table.
 *
 * The row works out its own derived figures from the creator it is given,
 * rather than being handed ten pre-formatted strings, so that the table above
 * it stays a layout concern and this stays a presentation concern.
 *
 * targetCostPerInstall is passed in because it belongs to the selected
 * campaign, which only the screen knows about.
 */
export function CreatorPerformanceTableRow({
  creator,
  targetCostPerInstall,
  onSelectCreator,
}: {
  creator: Creator
  targetCostPerInstall: number
  /** Opens the creator detail screen. Not yet available — see task 2.22. */
  onSelectCreator?: (creator: Creator) => void
}) {
  const amountPaid = getAmountPaid(creator)
  const outstandingBalance = getOutstandingBalance(creator)
  const costPerInstall = getCostPerInstall(creator)
  const costPerInstallRating = rateCostPerInstall(costPerInstall, targetCostPerInstall)
  const isSelectable = onSelectCreator !== undefined

  return (
    <div
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onClick={isSelectable ? () => onSelectCreator(creator) : undefined}
      onKeyDown={
        isSelectable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectCreator(creator)
              }
            }
          : undefined
      }
      className={joinClassNames(
        'border-t border-hair-4 text-[14px]',
        isSelectable && 'cursor-pointer hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-amber',
      )}
    >
      {/* Stacked card, up to the width where all ten columns can be read.
          Everything is on screen: no column is parked behind a horizontal
          scrollbar the way it was when this row was a table at every size. */}
      <div className="flex flex-col gap-2.5 px-4 py-3.5 lg:hidden">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className="font-semibold text-ink">{creator.name}</span>
          <span className="font-semibold tracking-[1px] text-amber">{creator.creatorCode}</span>
          <span className="ml-auto flex items-center gap-2">
            <PlatformTag platform={creator.platform} />
            <CreatorStatusPill status={getLifecycleStatus(creator)} />
          </span>
        </div>

        <div className="grid grid-cols-4 gap-x-3 text-[13px]">
          <StackedFigure label="Streams">
            {creator.streamsDelivered} / {creator.streamsCommitted}
          </StackedFigure>
          <StackedFigure label="Views">{formatNumber(creator.totalViews)}</StackedFigure>
          <StackedFigure label="Peak">
            {formatNumber(creator.peakConcurrentViewers)}
          </StackedFigure>
          <StackedFigure label="Installs">
            <span className="font-semibold text-ink">
              {formatNumber(creator.installsAttributed)}
            </span>
          </StackedFigure>
        </div>

        <div>
          <div className="mb-1.25 flex flex-wrap justify-between gap-x-2.5 text-[13px]">
            <span className="whitespace-nowrap">
              {formatMoney(amountPaid)} / {formatMoney(creator.contractedAmount)}
              <span className="ml-2 text-ink-muted">
                {outstandingBalance > 0 ? `${formatMoney(outstandingBalance)} open` : 'Settled'}
              </span>
            </span>
            <span
              className={joinClassNames(
                'whitespace-nowrap px-2.25 py-0.75 font-semibold',
                costPerInstallClasses[costPerInstallRating],
              )}
            >
              {formatCostPerInstall(costPerInstall)} / install
            </span>
          </div>
          <ProgressBar percentComplete={getPaymentProgressPercent(creator)} />
        </div>
      </div>

      {/* The ten-column table, from the width where it fits. */}
      <div
        className={joinClassNames(
          'hidden items-center py-3.25 lg:grid',
          CREATOR_TABLE_COLUMN_WIDTHS,
          CREATOR_TABLE_HORIZONTAL_PADDING,
        )}
        style={{ minWidth: CREATOR_TABLE_MINIMUM_WIDTH_PX }}
      >
        <div className="font-semibold text-ink">{creator.name}</div>

        <div>
          <CreatorStatusPill status={getLifecycleStatus(creator)} />
        </div>

        <div>
          <PlatformTag platform={creator.platform} />
        </div>

        <div className="font-semibold tracking-[1px] text-amber">{creator.creatorCode}</div>

        <div className="text-ink-muted">
          {creator.streamsDelivered} / {creator.streamsCommitted}
        </div>

        <div>{formatNumber(creator.totalViews)}</div>

        <div className="text-ink-muted">{formatNumber(creator.peakConcurrentViewers)}</div>

        <div className="font-semibold">{formatNumber(creator.installsAttributed)}</div>

        <div className="pr-5.5">
          <div className="mb-1.25 flex justify-between gap-2.5 text-[13px]">
            <span className="whitespace-nowrap">
              {formatMoney(amountPaid)} / {formatMoney(creator.contractedAmount)}
            </span>
            <span className="whitespace-nowrap text-ink-muted">
              {outstandingBalance > 0 ? `${formatMoney(outstandingBalance)} open` : 'Settled'}
            </span>
          </div>
          <ProgressBar percentComplete={getPaymentProgressPercent(creator)} />
        </div>

        <div>
          <span
            className={joinClassNames(
              'px-2.25 py-0.75 font-semibold',
              costPerInstallClasses[costPerInstallRating],
            )}
          >
            {formatCostPerInstall(costPerInstall)}
          </span>
        </div>
      </div>
    </div>
  )
}

/** One figure in the stacked card, under the column heading it lost. */
function StackedFigure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-[1px] text-ink-faint">{label}</span>
      {children}
    </div>
  )
}
