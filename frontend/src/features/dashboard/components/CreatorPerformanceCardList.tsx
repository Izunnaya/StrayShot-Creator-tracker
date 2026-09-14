import type { ReactNode } from 'react'
import type { Creator } from '@/data/types'
import { rateCostPerInstall } from '@/domain/costPerInstallRating'
import {
  getAmountPaid,
  getCostPerInstall,
  getLifecycleStatus,
  getOutstandingBalance,
  getPaymentProgressPercent,
  isAwaitingPayment,
} from '@/domain/creatorCalculations'
import { costPerInstallTextClasses } from '@/features/dashboard/costPerInstallAppearance'
import { joinClassNames } from '@/lib/classNames'
import { formatCostPerInstall, formatCountCompact, formatMoney } from '@/lib/format'
import { Button, CreatorStatusPill, ProgressBar } from '@/ui'

/**
 * The creator table's narrow-screen form: one card per creator, laid out as
 * the phone design draws them.
 *
 * A table needs 1320px before its money columns stop splitting mid-number, so
 * on a phone it can only be read by dragging a scrollbar that is invisible
 * against this palette. The card leads with who and how they are doing —
 * installs, views, cost per install — then what they have been paid, and,
 * for a creator who has delivered and is still owed, the Record payment
 * button. That is the phone's outstanding panel: the dashboard's side panels
 * do not fit beside a single column, so the action comes to the card.
 *
 * This is a list rather than a table with its display overridden: changing a
 * table's display property strips its semantics in some screen readers, which
 * would undo the accessible structure the wide layout just gained. A list of
 * creators is an honest description of what this is at this width.
 */
export function CreatorPerformanceCardList({
  creators,
  targetCostPerInstallInCents,
  onSelectCreator,
  onRecordPayment,
}: {
  creators: Creator[]
  targetCostPerInstallInCents: number
  onSelectCreator?: (creator: Creator) => void
  onRecordPayment?: (creator: Creator) => void
}) {
  if (creators.length === 0) {
    return (
      <p className="border border-hair bg-panel px-4 py-6 text-[14px] text-ink-muted">
        No creators match this filter.
      </p>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-2.5">
      {creators.map((creator) => (
        <CreatorPerformanceCard
          key={creator.id}
          creator={creator}
          targetCostPerInstallInCents={targetCostPerInstallInCents}
          onSelectCreator={onSelectCreator}
          onRecordPayment={onRecordPayment}
        />
      ))}
    </ul>
  )
}

function CreatorPerformanceCard({
  creator,
  targetCostPerInstallInCents,
  onSelectCreator,
  onRecordPayment,
}: {
  creator: Creator
  targetCostPerInstallInCents: number
  onSelectCreator?: (creator: Creator) => void
  onRecordPayment?: (creator: Creator) => void
}) {
  const amountPaid = getAmountPaid(creator)
  const outstandingBalance = getOutstandingBalance(creator)
  const costPerInstall = getCostPerInstall(creator)
  const rating = rateCostPerInstall(costPerInstall, targetCostPerInstallInCents)

  return (
    <li
      className={joinClassNames(
        'relative border border-hair bg-panel px-3.75 pb-3.75 pt-3.5',
        onSelectCreator &&
          'cursor-pointer hover:bg-row-hover focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-amber',
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          {onSelectCreator ? (
            /* The name is the button, but its hit area is the whole card: the
               overlay stretches it across the li, which is why the li is
               positioned. One button rather than a clickable list item keeps
               the accessible name and keyboard behaviour honest. */
            <button
              type="button"
              onClick={() => onSelectCreator(creator)}
              className="block max-w-full cursor-pointer truncate border-none bg-transparent p-0 text-left font-head text-[19px] font-semibold tracking-[0.5px] text-ink after:absolute after:inset-0 after:content-[''] hover:text-amber focus-visible:outline-none"
            >
              {creator.name}
            </button>
          ) : (
            <div className="truncate font-head text-[19px] font-semibold tracking-[0.5px] text-ink">
              {creator.name}
            </div>
          )}

          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-dim">
            <span className="font-mono tracking-[1px] text-amber">{creator.creatorCode}</span>
            <span>{creator.platform}</span>
            <span>
              {creator.streamsDelivered}/{creator.streamsCommitted} streams
            </span>
          </div>
        </div>

        <CreatorStatusPill status={getLifecycleStatus(creator)} size="small" />
      </div>

      <div className="mt-3.25 flex gap-4.5">
        <CardFigure label="Installs">{formatCountCompact(creator.installsAttributed)}</CardFigure>
        <CardFigure label="Views">{formatCountCompact(creator.totalViews)}</CardFigure>
        <CardFigure label="Cost / install" className={costPerInstallTextClasses[rating]}>
          {formatCostPerInstall(costPerInstall)}
        </CardFigure>
      </div>

      <div className="mt-3.25">
        <div className="mb-1.5 flex justify-between gap-2.5 text-[12px]">
          <span className="whitespace-nowrap font-mono text-ink-quiet">
            {formatMoney(amountPaid)} / {formatMoney(creator.contractedAmountInCents)}
          </span>
          <span className="whitespace-nowrap text-ink-muted">
            {outstandingBalance > 0 ? formatMoney(outstandingBalance) + ' open' : 'Settled'}
          </span>
        </div>
        <ProgressBar percentComplete={getPaymentProgressPercent(creator)} heightInPixels={5} />
      </div>

      {onRecordPayment && isAwaitingPayment(creator) && (
        /* Above the card's overlay, so pressing it records a payment rather
           than opening the creator. */
        <Button
          variant="outline"
          size="block"
          onClick={() => onRecordPayment(creator)}
          className="relative z-10 mt-3.25"
        >
          Record payment
        </Button>
      )}
    </li>
  )
}

/** One figure on a card, under its caption. */
function CardFigure({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="whitespace-nowrap text-[10px] uppercase tracking-[1.5px] text-ink-dim">
        {label}
      </div>
      <div
        className={joinClassNames('font-head text-[18px] font-semibold', className ?? 'text-ink')}
      >
        {children}
      </div>
    </div>
  )
}
