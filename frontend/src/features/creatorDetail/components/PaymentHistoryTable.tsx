import type { Creator } from '../../../data/types'
import { getOutstandingBalance, hasOutstandingBalance } from '../../../domain/creatorCalculations'
import { sortPaymentsNewestFirst } from '../../../domain/paymentHistory'
import { formatDate, formatMoney } from '../../../lib/format'

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
 */

const PAYMENT_TABLE_COLUMN_WIDTHS = 'grid-cols-[0.9fr_1fr_1.5fr_1.1fr_0.9fr]'

export function PaymentHistoryTable({ creator }: { creator: Creator }) {
  const payments = sortPaymentsNewestFirst(creator.payments)

  return (
    <div className="border border-t-0 border-hair bg-panel">
      <div
        className={`grid ${PAYMENT_TABLE_COLUMN_WIDTHS} border-b border-hair bg-panel-head px-4.5 py-2.5 text-[11px] uppercase tracking-[1.5px] text-ink-muted`}
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
          className={`grid ${PAYMENT_TABLE_COLUMN_WIDTHS} items-center border-t border-hair-4 px-4.5 py-3 text-[14px]`}
        >
          <div className="text-ink">{formatDate(payment.paidOn)}</div>
          <div className="text-ink-muted">{payment.method}</div>
          <div className="font-mono text-[12px] tracking-[0.5px] text-ink-muted">
            {payment.reference || '—'}
          </div>
          <div className="text-ink-muted">{payment.recordedBy}</div>
          <div className="text-right font-semibold">{formatMoney(payment.amount)}</div>
        </div>
      ))}

      {hasOutstandingBalance(creator) && (
        <div
          className={`grid ${PAYMENT_TABLE_COLUMN_WIDTHS} items-center border-t border-hair bg-open-row px-4.5 py-3 text-[14px]`}
        >
          <div className="text-[12px] font-semibold uppercase tracking-[1px] text-bad">Open</div>
          <div className="col-span-3 text-ink-muted">
            Remaining balance on {formatMoney(creator.contractedAmount)} agreement
          </div>
          <div className="text-right font-semibold text-bad">
            {formatMoney(getOutstandingBalance(creator))}
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
