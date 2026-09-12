import type { LedgerEntry } from '@/domain/paymentLedger'
import { joinClassNames } from '@/lib/classNames'
import { formatDate, formatPaymentAmount } from '@/lib/format'
import { PaymentLedgerCardList } from './PaymentLedgerCardList'

/**
 * Every payment in view, newest first, one row each.
 *
 * The columns are the ones a bank statement is reconciled against: when the
 * money moved, who it went to, what it came out of, how it was sent, and the
 * reference to match it by. Amounts are in cents throughout — this is the
 * screen where a rounded figure would be the one that fails to reconcile.
 *
 * Cards below lg and the table from lg up, the same division the creator
 * table makes and for the same reason: seven columns cannot be read on a
 * phone, and overriding a table's display strips its semantics in some screen
 * readers rather than adapting them.
 */

const COLUMNS = [
  { key: 'date', heading: 'Date paid', weight: 1 },
  { key: 'creator', heading: 'Creator', weight: 1.3 },
  { key: 'campaign', heading: 'Campaign', weight: 1.2 },
  { key: 'method', heading: 'Method', weight: 1 },
  { key: 'reference', heading: 'Reference', weight: 1.4 },
  { key: 'recordedBy', heading: 'Recorded by', weight: 1 },
  { key: 'amount', heading: 'Amount', weight: 1 },
]

const MINIMUM_WIDTH_PX = 980

export function PaymentLedgerTable({
  entries,
  onSelectCreator,
}: {
  entries: LedgerEntry[]
  /** Opens the creator a payment went to. Absent where there is nowhere to go. */
  onSelectCreator?: (creatorId: number) => void
}) {
  const totalWeight = COLUMNS.reduce((sum, column) => sum + column.weight, 0)

  return (
    <div className="border border-hair bg-panel">
      <div className="lg:hidden">
        <PaymentLedgerCardList entries={entries} onSelectCreator={onSelectCreator} />
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table
          className="w-full table-fixed border-collapse text-left"
          style={{ minWidth: MINIMUM_WIDTH_PX }}
        >
          <caption className="sr-only">Payments</caption>
          <colgroup>
            {COLUMNS.map((column) => (
              <col key={column.key} style={{ width: (column.weight / totalWeight) * 100 + '%' }} />
            ))}
          </colgroup>
          <thead className="border-b border-hair bg-panel-head">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={joinClassNames(
                    'whitespace-nowrap px-2 py-2.75 text-[11px] font-normal uppercase tracking-[1.5px] text-ink-muted first:pl-4.5 last:pr-4.5',
                    column.key === 'amount' && 'text-right',
                  )}
                >
                  {column.heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <PaymentLedgerTableRow
                key={entry.payment.id}
                entry={entry}
                onSelectCreator={onSelectCreator}
              />
            ))}

            {entries.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4.5 py-6 text-[14px] text-ink-muted">
                  No payments have been recorded for this campaign.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PaymentLedgerTableRow({
  entry,
  onSelectCreator,
}: {
  entry: LedgerEntry
  onSelectCreator?: (creatorId: number) => void
}) {
  const { payment } = entry
  const cancelled = entry.isReversal || entry.wasReversed

  return (
    <tr
      className={joinClassNames(
        'border-t border-hair-4 text-[14px]',
        /* A cancelled pair stays in the record but recedes: what matters
           afterwards is the payment that replaced it. */
        cancelled ? 'text-ink-muted' : 'text-ink',
        onSelectCreator && 'hover:bg-row-hover',
      )}
    >
      <td className="whitespace-nowrap px-2 py-3 first:pl-4.5">
        {formatDate(payment.paidOn)}
        {entry.isReversal && <LedgerTag>Reversal</LedgerTag>}
        {entry.wasReversed && <LedgerTag>Reversed</LedgerTag>}
      </td>

      <th scope="row" className="px-2 py-3 text-left font-normal">
        {onSelectCreator ? (
          <button
            type="button"
            onClick={() => onSelectCreator(entry.creatorId)}
            className="cursor-pointer font-semibold text-ink hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
          >
            {entry.creatorName}
          </button>
        ) : (
          <span className="font-semibold">{entry.creatorName}</span>
        )}
        <span className="ml-2 text-[12px] tracking-[1px] text-amber">{entry.creatorCode}</span>
      </th>

      <td className="px-2 py-3 text-ink-muted">{entry.campaignName}</td>
      <td className="px-2 py-3 text-ink-muted">{payment.method}</td>

      <td className="whitespace-nowrap px-2 py-3 font-mono text-[12px] tracking-[0.5px] text-ink-muted">
        {payment.reference || '—'}
      </td>

      <td className="px-2 py-3 text-ink-muted">{payment.recordedBy}</td>

      <td
        className={joinClassNames(
          'whitespace-nowrap px-2 py-3 text-right font-semibold last:pr-4.5',
          entry.isReversal && 'text-bad',
        )}
      >
        {formatPaymentAmount(payment.amountInCents)}
      </td>
    </tr>
  )
}

/** Marks a row as one half of a cancelled pair. */
function LedgerTag({ children }: { children: string }) {
  return (
    <span className="ml-2 border border-hair px-1.5 py-0.5 text-[10px] uppercase tracking-[1px] text-ink-faint">
      {children}
    </span>
  )
}
