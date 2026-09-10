import type { Creator } from '@/data/types'
import { getOutstandingBalance, hasOutstandingBalance } from '@/domain/creatorCalculations'
import { sortPaymentsNewestFirst } from '@/domain/paymentHistory'
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

const PAYMENT_TABLE_COLUMN_WIDTHS = 'sm:grid-cols-[0.9fr_1fr_1.5fr_1.1fr_0.9fr]'
const PAYMENT_TABLE_MINIMUM_WIDTH = 'sm:min-w-[680px]'

export function PaymentHistoryTable({ creator }: { creator: Creator }) {
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
      </div>

      {payments.map((payment) => (
        <div
          key={payment.id}
          className={`grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-hair-4 px-4 py-3 text-[14px] sm:items-center sm:gap-0 sm:px-4.5 sm:py-3 ${PAYMENT_TABLE_COLUMN_WIDTHS} ${PAYMENT_TABLE_MINIMUM_WIDTH}`}
        >
          <div className="order-1 text-ink sm:order-0">{formatDate(payment.paidOn)}</div>

          <div className="order-3 text-ink-muted sm:order-0">{payment.method}</div>

          <div className="order-5 col-span-2 whitespace-nowrap font-mono text-[12px] tracking-[0.5px] text-ink-muted sm:order-0 sm:col-span-1">
            {payment.reference || '—'}
          </div>

          <div className="order-4 text-right text-ink-muted sm:order-0 sm:text-left">
            {payment.recordedBy}
          </div>

          <div className="order-2 whitespace-nowrap text-right font-semibold sm:order-0">
            {formatPaymentAmount(payment.amountInCents)}
          </div>
        </div>
      ))}

      {hasOutstandingBalance(creator) && (
        <div
          className={`grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-hair bg-open-row px-4 py-3 text-[14px] sm:items-center sm:gap-0 sm:px-4.5 ${PAYMENT_TABLE_COLUMN_WIDTHS} ${PAYMENT_TABLE_MINIMUM_WIDTH}`}
        >
          <div className="text-[12px] font-semibold uppercase tracking-[1px] text-bad">Open</div>

          <div className="whitespace-nowrap text-right font-semibold text-bad sm:order-last sm:text-right">
            {formatPaymentAmount(getOutstandingBalance(creator))}
          </div>

          <div className="col-span-2 text-ink-muted sm:col-span-3">
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
