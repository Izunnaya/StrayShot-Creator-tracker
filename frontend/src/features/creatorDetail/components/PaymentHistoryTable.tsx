import type { Creator, Payment } from '@/data/types'
import { getOutstandingBalance, hasOutstandingBalance } from '@/domain/creatorCalculations'
import { sortPaymentsNewestFirst } from '@/domain/paymentHistory'
import { canReverse, hasBeenReversed, isReversal } from '@/domain/paymentRecording'
import { joinClassNames } from '@/lib/classNames'
import { formatDate, formatPaymentAmount } from '@/lib/format'

/**
 * Every payment made to this creator, one row each, newest first.
 *
 * Partial payments are the normal case rather than the exception, so the
 * table never collapses them into a single "paid" figure. What is still owed
 * appears as its own closing row instead of being left implicit, which is how
 * the team spots a deal that stalled halfway.
 *
 * References render in the mono face because they are transcribed against a
 * bank statement, where character-by-character comparison matters.
 *
 * Two layouts, one set of markup. From sm up it is the five-column table the
 * design specifies. On a phone each payment reflows into date and amount on
 * the first line, method and who recorded it beneath, and the reference on
 * its own line where it has the width to stay on one piece.
 */

const PAYMENT_TABLE_COLUMN_WIDTHS = 'sm:grid-cols-[0.9fr_1fr_1.4fr_1fr_0.9fr_0.7fr]'
const PAYMENT_TABLE_MINIMUM_WIDTH = 'sm:min-w-[760px]'

export function PaymentHistoryTable({
  creator,
  onReversePayment,
}: {
  creator: Creator
  /** Offers to undo a payment. Absent where reversing is not available. */
  onReversePayment?: (payment: Payment) => void
}) {
  const payments = sortPaymentsNewestFirst(creator.payments)

  return (
    <div className="overflow-x-auto border border-t-0 border-hair bg-panel">
      <div
        className={`hidden border-b border-hair bg-panel-head px-4.5 py-2.5 text-[11px] uppercase tracking-[1.5px] text-ink-muted sm:grid ${PAYMENT_TABLE_COLUMN_WIDTHS} ${PAYMENT_TABLE_MINIMUM_WIDTH}`}
      >
        <div>Date paid</div>
        <div>Method</div>
        <div>Reference</div>
        <div>Recorded by</div>
        <div className="text-right">Amount</div>
        <div className="sr-only">Actions</div>
      </div>

      {payments.map((payment) => {
        const reversal = isReversal(payment)
        const reversed = hasBeenReversed(payment, creator.payments)

        return (
          <div
            key={payment.id}
            className={joinClassNames(
              'grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-hair-4 px-4 py-3 text-[14px] sm:items-center sm:gap-0 sm:px-4.5 sm:py-3',
              PAYMENT_TABLE_COLUMN_WIDTHS,
              PAYMENT_TABLE_MINIMUM_WIDTH,
              /* A cancelled pair stays in the record but recedes: what
                 matters afterwards is the payment that replaced it. */
              (reversal || reversed) && 'text-ink-muted',
            )}
          >
            <div className="order-1 text-ink sm:order-0">
              {formatDate(payment.paidOn)}
              {reversal && <ReversalTag>Reversal</ReversalTag>}
              {reversed && <ReversalTag>Reversed</ReversalTag>}
            </div>

            <div className="order-3 text-ink-muted sm:order-0">{payment.method}</div>

            <div className="order-5 col-span-2 whitespace-nowrap font-mono text-[12px] tracking-[0.5px] text-ink-muted sm:order-0 sm:col-span-1">
              {payment.reference || '—'}
            </div>

            <div className="order-4 text-right text-ink-muted sm:order-0 sm:text-left">
              {payment.recordedBy}
            </div>

            <div
              className={joinClassNames(
                'order-2 whitespace-nowrap text-right font-semibold sm:order-0',
                reversal && 'text-bad',
              )}
            >
              {formatPaymentAmount(payment.amountInCents)}
            </div>

            <div className="order-6 col-span-2 sm:order-0 sm:col-span-1 sm:text-right">
              {onReversePayment && canReverse(payment, creator.payments) && (
                <button
                  type="button"
                  onClick={() => onReversePayment(payment)}
                  className="cursor-pointer text-[12px] uppercase tracking-[1px] text-ink-muted hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
                >
                  Reverse
                </button>
              )}
            </div>
          </div>
        )
      })}

      {hasOutstandingBalance(creator) && (
        <div
          className={`grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-hair bg-open-row px-4 py-3 text-[14px] sm:items-center sm:gap-0 sm:px-4.5 ${PAYMENT_TABLE_COLUMN_WIDTHS} ${PAYMENT_TABLE_MINIMUM_WIDTH}`}
        >
          <div className="text-[12px] font-semibold uppercase tracking-[1px] text-bad">Open</div>

          <div className="whitespace-nowrap text-right font-semibold text-bad sm:order-last sm:text-right">
            {formatPaymentAmount(getOutstandingBalance(creator))}
          </div>

          <div className="col-span-2 text-ink-muted sm:col-span-4">
            Remaining balance on {formatPaymentAmount(creator.contractedAmountInCents)} agreement
          </div>
        </div>
      )}

      {payments.length === 0 && (
        <div className="border-t border-hair-4 px-4.5 py-4.5 text-[14px] text-ink-muted">
          No payments recorded yet.
        </div>
      )}
    </div>
  )
}

/** Marks a row as one half of a cancelled pair. */
function ReversalTag({ children }: { children: string }) {
  return (
    <span className="ml-2 border border-hair px-1.5 py-0.5 text-[10px] uppercase tracking-[1px] text-ink-faint">
      {children}
    </span>
  )
}
