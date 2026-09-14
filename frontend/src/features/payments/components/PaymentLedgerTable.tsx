import type { LedgerEntry, LedgerSortColumn, LedgerSortSelection } from '@/domain/paymentLedger'
import { joinClassNames } from '@/lib/classNames'
import { formatDate, formatNumber, formatPaymentAmount } from '@/lib/format'
import { useNarrowLayout } from '@/lib/usePhoneLayout'
import { PaymentLedgerCardList } from './PaymentLedgerCardList'

/**
 * Every payment in view, one row each, in the order chosen.
 *
 * The columns are the ones a bank statement is reconciled against: when the
 * money moved, who it went to, what it came out of, how it was sent, and the
 * reference to match it by. Dates, references and amounts are set in the
 * mono face, because that is how they are compared: character by character.
 *
 * Date and amount are the two orders a ledger is read in, so those headings
 * sort and the rest do not. The total closes the table, as it would on paper,
 * and is the net of the rows above it.
 *
 * Cards below lg and the table from lg up, the same division the creator
 * table makes and for the same reason: seven columns cannot be read on a
 * phone. The cards have no headings to click, so they get a single button
 * that steps through the orders instead, and the total rides along the
 * bottom of the screen.
 */

const COLUMNS: { key: string; heading: string; weight: number; sortsBy?: LedgerSortColumn }[] = [
  { key: 'date', heading: 'Date', weight: 1, sortsBy: 'date' },
  { key: 'creator', heading: 'Creator', weight: 1.3 },
  { key: 'campaign', heading: 'Campaign', weight: 1.3 },
  { key: 'method', heading: 'Method', weight: 1 },
  { key: 'reference', heading: 'Reference', weight: 1.4 },
  { key: 'recordedBy', heading: 'Recorded by', weight: 1.1 },
  { key: 'amount', heading: 'Amount', weight: 0.9, sortsBy: 'amount' },
]

const MINIMUM_WIDTH_PX = 900

export function PaymentLedgerTable({
  entries,
  netTotalInCents,
  sortSelection,
  onColumnHeadingClick,
  onStepSort,
  emptyMessage,
  onSelectCreator,
}: {
  entries: LedgerEntry[]
  /** What the entries add up to, reversals deducted. */
  netTotalInCents: number
  sortSelection: LedgerSortSelection
  onColumnHeadingClick: (column: LedgerSortColumn) => void
  /** Moves the card layout on to its next order. */
  onStepSort: () => void
  /** Shown in place of the rows when nothing matches. */
  emptyMessage: string
  /** Opens the creator a payment went to. Absent where there is nowhere to go. */
  onSelectCreator?: (creatorId: number) => void
}) {
  const isNarrow = useNarrowLayout()
  const totalWeight = COLUMNS.reduce((sum, column) => sum + column.weight, 0)
  const paymentCount = `${formatNumber(entries.length)} ${entries.length === 1 ? 'payment' : 'payments'}`

  if (isNarrow) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 pb-2">
          <span className="text-[11px] uppercase tracking-[1.5px] text-ink-muted">
            {paymentCount}
          </span>
          <button
            type="button"
            onClick={onStepSort}
            aria-label={`Sorted by ${describeSort(sortSelection)}. Change order`}
            className="min-h-10 cursor-pointer whitespace-nowrap border border-hair bg-transparent px-3 py-2 text-[12px] uppercase tracking-[1px] text-ink-muted hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
          >
            Sort · {sortSelection.column === 'date' ? 'Date' : 'Amount'}
            {sortSelection.direction === 'ascending' ? ' ↑' : ' ↓'}
          </button>
        </div>

        <div className="-mx-4 border-t border-hair sm:-mx-6">
          <PaymentLedgerCardList
            entries={entries}
            emptyMessage={emptyMessage}
            onSelectCreator={onSelectCreator}
          />
        </div>

        {/* Held above the phone's tab bar, which is 76px tall. */}
        <div className="sticky bottom-19 -mx-4 flex items-center justify-between gap-2.5 border-t-2 border-amber bg-total-row px-4 py-3.5 sm:-mx-6 sm:px-6 md:bottom-0">
          <span className="text-[11px] uppercase tracking-[1.5px] text-ink-muted">
            Total in filter
          </span>
          <span className="whitespace-nowrap font-mono text-[19px] text-amber">
            {formatPaymentAmount(netTotalInCents)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-hair bg-panel-2">
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
        <thead className="border-b border-hair bg-[#111111]">
          <tr>
            {COLUMNS.map((column) => {
              const alignRight = column.key === 'amount'
              const cellClasses = 'px-2 py-2.5 first:pl-5 last:pr-5'
              const textClasses = joinClassNames(
                'whitespace-nowrap text-[11px] font-normal uppercase tracking-[1.5px]',
                alignRight ? 'text-right' : 'text-left',
              )

              if (!column.sortsBy) {
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={joinClassNames(cellClasses, textClasses, 'text-ink-muted')}
                  >
                    {column.heading}
                  </th>
                )
              }

              const sortsBy = column.sortsBy
              const selected = sortSelection.column === sortsBy
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={selected ? sortSelection.direction : 'none'}
                  className={cellClasses}
                >
                  <button
                    type="button"
                    onClick={() => onColumnHeadingClick(sortsBy)}
                    className={joinClassNames(
                      textClasses,
                      'w-full cursor-pointer border-none bg-transparent p-0 hover:text-amber focus-visible:outline-2 focus-visible:outline-amber',
                      selected ? 'text-amber' : 'text-ink-muted',
                    )}
                  >
                    {column.heading}
                    {selected && (
                      <span aria-hidden="true">
                        {sortSelection.direction === 'ascending' ? ' ▲' : ' ▼'}
                      </span>
                    )}
                  </button>
                </th>
              )
            })}
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
              <td
                colSpan={COLUMNS.length}
                className="border-t border-hair-5 px-5 py-5.5 text-[14px] text-ink-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
        <tfoot className="border-t-2 border-amber bg-total-row">
          <tr>
            <th
              scope="row"
              colSpan={COLUMNS.length - 1}
              className="py-3 pl-5 pr-2 text-left text-[11px] font-normal uppercase tracking-[1.5px] text-ink-muted"
            >
              Total · {paymentCount} in filter
            </th>
            <td className="whitespace-nowrap py-3 pl-2 pr-5 text-right font-mono text-[15px] font-medium text-amber">
              {formatPaymentAmount(netTotalInCents)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function describeSort(selection: LedgerSortSelection): string {
  if (selection.column === 'date') {
    return selection.direction === 'descending' ? 'date, newest first' : 'date, oldest first'
  }
  return selection.direction === 'descending' ? 'amount, largest first' : 'amount, smallest first'
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
        'border-t border-hair-5 align-baseline text-[13px]',
        onSelectCreator && 'hover:bg-row-hover',
      )}
    >
      <td className="whitespace-nowrap px-2 py-2.25 pl-5 font-mono text-[12px] text-ink-quiet">
        {formatDate(payment.paidOn)}
        {entry.isReversal && <LedgerTag>Reversal</LedgerTag>}
        {entry.wasReversed && <LedgerTag>Reversed</LedgerTag>}
      </td>

      <th scope="row" className="px-2 py-2.25 text-left font-semibold">
        {onSelectCreator ? (
          <button
            type="button"
            onClick={() => onSelectCreator(entry.creatorId)}
            className={joinClassNames(
              'cursor-pointer border-none bg-transparent p-0 text-left font-semibold hover:text-amber focus-visible:outline-2 focus-visible:outline-amber',
              cancelled ? 'text-ink-muted' : 'text-ink',
            )}
          >
            {entry.creatorName}
          </button>
        ) : (
          <span className={cancelled ? 'text-ink-muted' : 'text-ink'}>{entry.creatorName}</span>
        )}
      </th>

      <td className="px-2 py-2.25 text-ink-muted">{entry.campaignName}</td>
      <td className="px-2 py-2.25 text-ink-muted">{payment.method}</td>

      <td className="whitespace-nowrap px-2 py-2.25 font-mono text-[12px] text-ink-muted">
        {payment.reference || '—'}
      </td>

      <td className="px-2 py-2.25 text-ink-muted">{entry.recordedByName}</td>

      <td
        className={joinClassNames(
          'whitespace-nowrap px-2 py-2.25 pr-5 text-right font-mono text-[13px]',
          /* A cancelled pair stays in the record but recedes: what matters
             afterwards is the payment that replaced it. */
          entry.isReversal ? 'text-bad' : cancelled ? 'text-ink-muted' : 'text-ink',
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
    <span className="ml-2 border border-hair px-1.5 py-0.5 font-body text-[10px] uppercase tracking-[1px] text-ink-faint">
      {children}
    </span>
  )
}
