import type { Creator } from '@/data/types'
import {
  getAmountPaid,
  getOutstandingBalance,
  getPaymentProgressPercent,
  hasOutstandingBalance,
} from '@/domain/creatorCalculations'
import { countPayments } from '@/domain/paymentHistory'
import { joinClassNames } from '@/lib/classNames'
import { formatPaymentAmount } from '@/lib/format'
import { ProgressBar } from '@/ui'

/**
 * Where this creator's deal stands: paid against agreed, and what is left.
 *
 * It sits directly above the payment records so the summary and the evidence
 * for it read as one block — the bar answers "are we square?", the table
 * below answers "how did we get here?".
 */
export function PaymentProgressPanel({ creator }: { creator: Creator }) {
  const amountPaid = getAmountPaid(creator)
  const outstandingBalance = getOutstandingBalance(creator)
  const paymentCount = countPayments(creator.payments)

  return (
    <div className="border border-hair bg-panel px-5 py-4.5">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[13px] text-ink-muted">
          {formatPaymentAmount(amountPaid)} of {formatPaymentAmount(creator.contractedAmount)} paid
          across {paymentCount} {paymentCount === 1 ? 'payment' : 'payments'}
        </div>

        <div
          className={joinClassNames(
            'font-head text-[15px] font-semibold tracking-[1px]',
            hasOutstandingBalance(creator) ? 'text-bad' : 'text-good',
          )}
        >
          {hasOutstandingBalance(creator)
            ? `${formatPaymentAmount(outstandingBalance)} open`
            : 'Fully settled'}
        </div>
      </div>

      <ProgressBar percentComplete={getPaymentProgressPercent(creator)} heightInPixels={7} />
    </div>
  )
}
