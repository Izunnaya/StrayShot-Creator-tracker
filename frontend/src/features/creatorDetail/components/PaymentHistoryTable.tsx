import { teamMembers } from '@/data/session'
import type { Creator, Payment } from '@/data/types'
import {
  getOutstandingBalance,
  getOverpaymentAmount,
  hasOutstandingBalance,
  isOverpaid,
} from '@/domain/creatorCalculations'
import { sortPaymentsNewestFirst } from '@/domain/paymentHistory'
import { canReverse, hasBeenReversed, isReversal } from '@/domain/paymentRecording'
import { getTeamMemberName } from '@/domain/teamMembers'
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
 * The table is the wide layout: the design's five columns, and a sixth for
 * reversing, which the design predates (DECISIONS.md, Q6). The phone layout
 * uses the cards further down.
 */

const PAYMENT_TABLE_COLUMNS = 'grid-cols-[0.9fr_1fr_1.5fr_1.1fr_0.9fr_0.7fr] min-w-190'

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
        className={`grid border-b border-hair bg-panel-head px-4.5 py-2.5 text-[11px] uppercase tracking-[1.5px] text-ink-muted ${PAYMENT_TABLE_COLUMNS}`}
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
              'grid items-center border-t border-hair-4 px-4.5 py-3 text-[14px]',
              PAYMENT_TABLE_COLUMNS,
              /* A cancelled pair stays in the record but recedes: what
                 matters afterwards is the payment that replaced it. */
              (reversal || reversed) && 'text-ink-muted',
            )}
          >
            <div className={reversal || reversed ? undefined : 'text-ink'}>
              {formatDate(payment.paidOn)}
              {reversal && <ReversalTag>Reversal</ReversalTag>}
              {reversed && <ReversalTag>Reversed</ReversalTag>}
            </div>

            <div className="text-ink-muted">{payment.method}</div>

            <div className="whitespace-nowrap font-mono text-[12px] tracking-[0.5px] text-ink-muted">
              {payment.reference || '—'}
            </div>

            <div className="text-ink-muted">
              {getTeamMemberName(teamMembers, payment.recordedByTeamMemberId)}
            </div>

            <div
              className={joinClassNames(
                'whitespace-nowrap text-right font-semibold',
                reversal && 'text-bad',
              )}
            >
              {formatPaymentAmount(payment.amountInCents)}
            </div>

            <div className="text-right">
              {onReversePayment && canReverse(payment, creator.payments) && (
                <ReverseButton payment={payment} onReversePayment={onReversePayment} />
              )}
            </div>
          </div>
        )
      })}

      {hasOutstandingBalance(creator) && (
        <div
          className={`grid items-center border-t border-hair bg-open-row px-4.5 py-3 text-[14px] ${PAYMENT_TABLE_COLUMNS}`}
        >
          <div className="text-[12px] font-semibold uppercase tracking-[1px] text-bad">Open</div>
          <div className="col-span-3 text-ink-muted">
            Remaining balance on {formatPaymentAmount(creator.contractedAmountInCents)} agreement
          </div>
          <div className="whitespace-nowrap text-right font-semibold text-bad">
            {formatPaymentAmount(getOutstandingBalance(creator))}
          </div>
        </div>
      )}

      {isOverpaid(creator) && (
        <div
          className={`grid items-center border-t border-hair bg-open-row px-4.5 py-3 text-[14px] ${PAYMENT_TABLE_COLUMNS}`}
        >
          <div className="text-[12px] font-semibold uppercase tracking-[1px] text-amber">
            Overpaid
          </div>
          <div className="col-span-3 text-ink-muted">
            Paid beyond the {formatPaymentAmount(creator.contractedAmountInCents)} agreement, to
            reconcile
          </div>
          <div className="whitespace-nowrap text-right font-semibold text-amber">
            {formatPaymentAmount(getOverpaymentAmount(creator))}
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

/**
 * The phone layout: one card per payment, date and amount first, then how it
 * was sent and who recorded it opposite the reference. The open balance
 * closes the list as a card of its own.
 */
export function PaymentHistoryCards({
  creator,
  onReversePayment,
}: {
  creator: Creator
  onReversePayment?: (payment: Payment) => void
}) {
  const payments = sortPaymentsNewestFirst(creator.payments)

  return (
    <div className="flex flex-col gap-2">
      {payments.length === 0 && (
        <div className="border border-hair bg-panel px-3.75 py-4 text-[14px] text-ink-muted">
          No payments recorded yet.
        </div>
      )}

      {payments.map((payment) => {
        const reversal = isReversal(payment)
        const reversed = hasBeenReversed(payment, creator.payments)

        return (
          <div key={payment.id} className="border border-hair bg-panel px-3.75 py-3.25">
            <div className="flex items-baseline justify-between gap-2.5">
              <span className="font-mono text-[13px] text-ink-quiet">
                {formatDate(payment.paidOn)}
                {reversal && <ReversalTag>Reversal</ReversalTag>}
                {reversed && <ReversalTag>Reversed</ReversalTag>}
              </span>
              <span
                className={joinClassNames(
                  'whitespace-nowrap font-mono text-[16px]',
                  reversal ? 'text-bad' : reversed ? 'text-ink-muted' : 'text-ink',
                )}
              >
                {formatPaymentAmount(payment.amountInCents)}
              </span>
            </div>
            <div className="mt-1.75 flex justify-between gap-2.5 text-[12px] text-ink-dim">
              <span>
                {payment.method} · {getTeamMemberName(teamMembers, payment.recordedByTeamMemberId)}
              </span>
              <span className="font-mono">{payment.reference || '—'}</span>
            </div>
            {onReversePayment && canReverse(payment, creator.payments) && (
              <div className="mt-2 text-right">
                <ReverseButton payment={payment} onReversePayment={onReversePayment} />
              </div>
            )}
          </div>
        )
      })}

      {hasOutstandingBalance(creator) && (
        <div className="flex items-baseline justify-between gap-2.5 border border-amber/30 bg-open-row px-3.75 py-3.25">
          <span className="text-[12px] font-semibold uppercase tracking-[1px] text-bad">
            Open balance
          </span>
          <span className="font-mono text-[16px] text-bad">
            {formatPaymentAmount(getOutstandingBalance(creator))}
          </span>
        </div>
      )}

      {isOverpaid(creator) && (
        <div className="flex items-baseline justify-between gap-2.5 border border-amber/30 bg-open-row px-3.75 py-3.25">
          <span className="text-[12px] font-semibold uppercase tracking-[1px] text-amber">
            Overpaid
          </span>
          <span className="font-mono text-[16px] text-amber">
            {formatPaymentAmount(getOverpaymentAmount(creator))}
          </span>
        </div>
      )}
    </div>
  )
}

function ReverseButton({
  payment,
  onReversePayment,
}: {
  payment: Payment
  onReversePayment: (payment: Payment) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onReversePayment(payment)}
      className="cursor-pointer border-none bg-transparent p-0 text-[12px] uppercase tracking-[1px] text-ink-muted hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
    >
      {/* Not aria-hidden: hiding it drops the verb from the accessible name,
          leaving "payment of $1,600 from…". */}
      <span>Reverse</span>
      <span className="sr-only">
        {` payment of ${formatPaymentAmount(payment.amountInCents)} from ${formatDate(payment.paidOn)}${payment.reference ? `, reference ${payment.reference}` : ''}`}
      </span>
    </button>
  )
}

/** Marks a row as one half of a cancelled pair. */
function ReversalTag({ children }: { children: string }) {
  return (
    <span className="ml-2 border border-hair px-1.5 py-0.5 font-body text-[10px] uppercase tracking-[1px] text-ink-faint">
      {children}
    </span>
  )
}
