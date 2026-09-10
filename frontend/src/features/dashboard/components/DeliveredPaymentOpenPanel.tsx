import type { Creator } from '@/data/types'
import {
  getAmountPaid,
  getOutstandingBalance,
  getPaymentProgressPercent,
} from '@/domain/creatorCalculations'
import { joinClassNames } from '@/lib/classNames'
import { formatMoney } from '@/lib/format'
import { Button, Panel, ProgressBar, SectionTitle } from '@/ui'

/**
 * Creators who have delivered everything they committed to but are still
 * owed money. This is the panel the team acts on, so every row carries a
 * Record payment control.
 *
 * Rows show progress rather than a paid/unpaid state, because a creator can
 * be settled in stages.
 */
export function DeliveredPaymentOpenPanel({
  creators,
  totalOutstandingBalanceInCents,
  onRecordPayment,
}: {
  creators: Creator[]
  totalOutstandingBalanceInCents: number
  /** Opens the record payment modal. Module 6 frontend work, task 6.14. */
  onRecordPayment?: (creator: Creator) => void
}) {
  return (
    <Panel className="px-4 py-4 sm:px-5 sm:py-4.5">
      <div className="mb-1.5 flex items-baseline justify-between">
        <SectionTitle size="small">
          Delivered, <span className="text-bad">payment open</span>
        </SectionTitle>
        <div className="text-[12px] text-ink-muted">
          {formatMoney(totalOutstandingBalanceInCents)} total
        </div>
      </div>

      {creators.length === 0 && (
        <div className="border-t border-hair-3 pt-3 text-[14px] text-ink-muted">
          Every delivered creator has been paid in full.
        </div>
      )}

      {creators.map((creator) => {
        const amountPaid = getAmountPaid(creator)
        const progressPercent = getPaymentProgressPercent(creator)
        const hasBeenPartlyPaid = amountPaid > 0

        return (
          <div key={creator.id} className="border-t border-hair-3 pb-3.25 pt-3">
            <div className="flex items-baseline justify-between gap-2.5">
              <span className="text-[14px] font-semibold">{creator.name}</span>
              <span
                className={joinClassNames(
                  'whitespace-nowrap px-1.75 py-0.5 text-[11px] font-semibold uppercase tracking-[1px]',
                  hasBeenPartlyPaid ? 'bg-amber/10 text-amber' : 'bg-bad/12 text-bad',
                )}
              >
                {hasBeenPartlyPaid ? `${Math.round(progressPercent)}% settled` : 'Nothing paid'}
              </span>
            </div>

            <div className="my-2.25 mb-1.75">
              <ProgressBar percentComplete={progressPercent} heightInPixels={5} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-2">
              <span className="text-[12px] text-ink-muted">
                {formatMoney(amountPaid)} of {formatMoney(creator.contractedAmountInCents)} ·{' '}
                {formatMoney(getOutstandingBalance(creator))} open
              </span>
              <Button variant="outline" onClick={() => onRecordPayment?.(creator)}>
                Record payment
              </Button>
            </div>
          </div>
        )
      })}
    </Panel>
  )
}
