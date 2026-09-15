import type { Creator } from '@/data/types'
import { rateCostPerInstall } from '@/domain/costPerInstallRating'
import {
  getAmountPaid,
  getCostPerInstall,
  getLifecycleStatus,
  getPaymentProgressPercent,
} from '@/domain/creatorCalculations'
import { joinClassNames } from '@/lib/classNames'
import { formatCostPerInstall, formatMoney, formatNumber } from '@/lib/format'
import { PaymentNote } from './PaymentNote'
import { CreatorStatusPill, PlatformTag, ProgressBar } from '@/ui'
import { costPerInstallClasses } from '@/features/dashboard/costPerInstallAppearance'

export function CreatorPerformanceTableRow({
  creator,
  targetCostPerInstallInCents,
  onSelectCreator,
}: {
  creator: Creator
  /** The target of the campaign this creator is on, or null with none to judge against. */
  targetCostPerInstallInCents: number | null
  onSelectCreator?: (creator: Creator) => void
}) {
  const amountPaid = getAmountPaid(creator)
  const costPerInstall = getCostPerInstall(creator)
  const rating = rateCostPerInstall(costPerInstall, targetCostPerInstallInCents)
  const cell = 'px-2 py-3.25'
  return (
    <tr
      onClick={onSelectCreator ? () => onSelectCreator(creator) : undefined}
      className={joinClassNames(
        'border-t border-hair-4 text-[14px]',
        onSelectCreator && 'cursor-pointer hover:bg-row-hover',
      )}
    >
      <th scope="row" className={joinClassNames(cell, 'pl-4.5 font-semibold text-ink')}>
        {onSelectCreator ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onSelectCreator(creator)
            }}
            className="cursor-pointer text-left hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
          >
            {creator.name}
          </button>
        ) : (
          creator.name
        )}
      </th>
      <td className={cell}>
        <CreatorStatusPill status={getLifecycleStatus(creator)} />
      </td>
      <td className={cell}>
        <PlatformTag platform={creator.platform} />
      </td>
      <td className={joinClassNames(cell, 'font-semibold tracking-[1px] text-amber')}>
        {creator.creatorCode}
      </td>
      <td className={joinClassNames(cell, 'text-ink-muted')}>
        {creator.streamsDelivered} / {creator.streamsCommitted}
      </td>
      <td className={cell}>{formatNumber(creator.totalViews)}</td>
      <td className={joinClassNames(cell, 'text-ink-muted')}>
        {formatNumber(creator.peakConcurrentViewers)}
      </td>
      <td className={joinClassNames(cell, 'font-semibold')}>
        {formatNumber(creator.installsAttributed)}
      </td>
      {/* One line, paid against agreed on the left and what that leaves on
          the right, above the bar -- as the design sets the cell. */}
      <td className={joinClassNames(cell, 'pr-5.5')}>
        <div className="mb-1.25 flex justify-between gap-2.5 text-[13px]">
          <span className="whitespace-nowrap">
            {formatMoney(amountPaid)} / {formatMoney(creator.contractedAmountInCents)}
          </span>
          <PaymentNote creator={creator} />
        </div>
        <ProgressBar percentComplete={getPaymentProgressPercent(creator)} />
      </td>
      <td className={joinClassNames(cell, 'pr-4.5')}>
        <span
          className={joinClassNames('px-2.25 py-0.75 font-semibold', costPerInstallClasses[rating])}
        >
          {formatCostPerInstall(costPerInstall)}
        </span>
      </td>
    </tr>
  )
}
