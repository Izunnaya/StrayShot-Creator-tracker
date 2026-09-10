import type { ReactNode } from 'react'
import type { Creator } from '@/data/types'
import { rateCostPerInstall } from '@/domain/costPerInstallRating'
import {
  getAmountPaid,
  getCostPerInstall,
  getLifecycleStatus,
  getOutstandingBalance,
  getPaymentProgressPercent,
} from '@/domain/creatorCalculations'
import { costPerInstallClasses } from '@/features/dashboard/costPerInstallAppearance'
import { joinClassNames } from '@/lib/classNames'
import { formatCostPerInstall, formatMoney, formatNumber } from '@/lib/format'
import { CreatorStatusPill, PlatformTag, ProgressBar } from '@/ui'

/**
 * The creator table's narrow-screen form: one card per creator, carrying the
 * same ten values the table columns carry.
 *
 * A table needs 1320px before its money columns stop splitting mid-number, so
 * on a phone it can only be read by dragging a scrollbar that is invisible
 * against this palette. Cards put every figure on screen instead.
 *
 * This is a list rather than a table with its display overridden: changing a
 * table's display property strips its semantics in some screen readers, which
 * would undo the accessible structure the wide layout just gained. A list of
 * creators is an honest description of what this is at this width.
 *
 * Sorting has no home here — it lives in the column headings — so the sort
 * selection still applies but cannot be changed until the viewport is wide
 * enough for the table.
 */
export function CreatorPerformanceCardList({
  creators,
  targetCostPerInstallInCents,
  onSelectCreator,
}: {
  creators: Creator[]
  targetCostPerInstallInCents: number
  onSelectCreator?: (creator: Creator) => void
}) {
  if (creators.length === 0) {
    return <p className="px-4 py-6 text-[14px] text-ink-muted">No creators match this filter.</p>
  }

  return (
    <ul className="list-none">
      {creators.map((creator) => (
        <CreatorPerformanceCard
          key={creator.id}
          creator={creator}
          targetCostPerInstallInCents={targetCostPerInstallInCents}
          onSelectCreator={onSelectCreator}
        />
      ))}
    </ul>
  )
}

function CreatorPerformanceCard({
  creator,
  targetCostPerInstallInCents,
  onSelectCreator,
}: {
  creator: Creator
  targetCostPerInstallInCents: number
  onSelectCreator?: (creator: Creator) => void
}) {
  const amountPaid = getAmountPaid(creator)
  const outstandingBalance = getOutstandingBalance(creator)
  const costPerInstall = getCostPerInstall(creator)
  const rating = rateCostPerInstall(costPerInstall, targetCostPerInstallInCents)

  return (
    <li
      className={joinClassNames(
        'relative flex flex-col gap-2.5 border-t border-hair-4 px-4 py-3.5 text-[14px] first:border-t-0',
        onSelectCreator &&
          'cursor-pointer hover:bg-row-hover focus-within:outline-2 focus-within:outline-amber focus-within:-outline-offset-2',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {onSelectCreator ? (
          /* The name is the button, but its hit area is the whole card: the
             overlay below stretches it across the li, which is why the li is
             positioned. One button rather than a clickable list item keeps
             the accessible name and keyboard behaviour honest, and nothing
             else inside the card is interactive for it to cover. */
          <button
            type="button"
            onClick={() => onSelectCreator(creator)}
            className="cursor-pointer font-semibold text-ink after:absolute after:inset-0 after:content-[''] hover:text-amber focus-visible:outline-none"
          >
            {creator.name}
          </button>
        ) : (
          <span className="font-semibold text-ink">{creator.name}</span>
        )}

        <span className="font-semibold tracking-[1px] text-amber">{creator.creatorCode}</span>

        <span className="ml-auto flex items-center gap-2">
          <PlatformTag platform={creator.platform} />
          <CreatorStatusPill status={getLifecycleStatus(creator)} />
        </span>
      </div>

      <div className="grid grid-cols-4 gap-x-3 text-[13px]">
        <CardFigure label="Streams">
          {creator.streamsDelivered} / {creator.streamsCommitted}
        </CardFigure>
        <CardFigure label="Views">{formatNumber(creator.totalViews)}</CardFigure>
        <CardFigure label="Peak">{formatNumber(creator.peakConcurrentViewers)}</CardFigure>
        <CardFigure label="Installs">
          <span className="font-semibold text-ink">{formatNumber(creator.installsAttributed)}</span>
        </CardFigure>
      </div>

      <div>
        <div className="mb-1.25 flex flex-wrap items-baseline justify-between gap-x-2.5 text-[13px]">
          <span className="whitespace-nowrap">
            {formatMoney(amountPaid)} / {formatMoney(creator.contractedAmountInCents)}
            <span className="ml-2 text-ink-muted">
              {outstandingBalance > 0 ? formatMoney(outstandingBalance) + ' open' : 'Settled'}
            </span>
          </span>
          <span
            className={joinClassNames(
              'whitespace-nowrap px-2.25 py-0.75 font-semibold',
              costPerInstallClasses[rating],
            )}
          >
            {formatCostPerInstall(costPerInstall)} / install
          </span>
        </div>
        <ProgressBar percentComplete={getPaymentProgressPercent(creator)} />
      </div>
    </li>
  )
}

/** One figure on a card, under the column heading it lost. */
function CardFigure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-[1px] text-ink-faint">{label}</span>
      {children}
    </div>
  )
}
