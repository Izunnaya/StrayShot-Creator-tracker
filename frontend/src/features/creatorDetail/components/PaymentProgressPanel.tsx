import type { ReactNode } from 'react'
import type { Creator } from '@/data/types'
import {
  getAmountPaid,
  getOutstandingBalance,
  getOverpaymentAmount,
  getPaymentProgressPercent,
  hasOutstandingBalance,
} from '@/domain/creatorCalculations'
import { getStandingPayments } from '@/domain/paymentRecording'
import { joinClassNames } from '@/lib/classNames'
import { formatPaymentAmount } from '@/lib/format'
import { ProgressBar } from '@/ui'

/**
 * Where this creator's deal stands: paid against agreed, and what is left.
 *
 * On the wide layout it sits directly above the payment records so the
 * summary and the evidence for it read as one block — the bar answers "are
 * we square?", the table below answers "how did we get here?". On a phone it
 * stands alone and holds the Record payment button, as the phone design puts
 * the action where the balance is.
 */
export function PaymentProgressPanel({
  creator,
  layout = 'wide',
  action,
}: {
  creator: Creator
  layout?: 'wide' | 'phone'
  /** Placed under the bar: the phone layout's Record payment button. */
  action?: ReactNode
}) {
  const amountPaid = getAmountPaid(creator)
  const outstandingBalance = getOutstandingBalance(creator)
  const overpayment = getOverpaymentAmount(creator)
  // Reversed pairs are still in the record, but nobody counts them as payments.
  const paymentCount = getStandingPayments(creator.payments).length
  const isPhone = layout === 'phone'

  return (
    <div
      className={joinClassNames(
        'border border-hair bg-panel',
        isPhone ? 'p-3.75' : 'mb-px px-5 py-4.5',
      )}
    >
      <div
        className={joinClassNames(
          'flex items-baseline justify-between gap-2.5',
          !isPhone && 'mb-2.5',
        )}
      >
        <div className="text-[13px] text-ink-muted">
          {formatPaymentAmount(amountPaid)} of{' '}
          {formatPaymentAmount(creator.contractedAmountInCents)}
          {!isPhone &&
            ` paid across ${paymentCount} ${paymentCount === 1 ? 'payment' : 'payments'}`}
        </div>

        {/* Open, overpaid, or square -- three different facts, and the team
            acts on each differently: chase, reconcile, nothing. See Q5. */}
        <div
          className={joinClassNames(
            'whitespace-nowrap font-head font-semibold',
            isPhone ? 'text-[14px]' : 'text-[15px] tracking-[1px]',
            hasOutstandingBalance(creator)
              ? 'text-bad'
              : overpayment > 0
                ? 'text-amber'
                : 'text-good',
          )}
        >
          {hasOutstandingBalance(creator)
            ? `${formatPaymentAmount(outstandingBalance)} open`
            : overpayment > 0
              ? `${formatPaymentAmount(overpayment)} overpaid`
              : 'Fully settled'}
        </div>
      </div>

      <div className={isPhone ? 'mt-2.5' : undefined}>
        <ProgressBar
          percentComplete={getPaymentProgressPercent(creator)}
          heightInPixels={isPhone ? 6 : 7}
        />
      </div>

      {action && <div className="mt-3.5">{action}</div>}
    </div>
  )
}
