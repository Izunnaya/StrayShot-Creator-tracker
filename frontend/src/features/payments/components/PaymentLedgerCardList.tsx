import type { LedgerEntry } from '@/domain/paymentLedger'
import { joinClassNames } from '@/lib/classNames'
import { formatDate, formatPaymentAmount } from '@/lib/format'

/**
 * The ledger's narrow-screen form: one row per payment, carrying the same
 * seven values the table columns carry, laid out as the phone design draws
 * them — who and how much, then when and how with the reference opposite,
 * then which campaign and who recorded it.
 *
 * A list rather than a table with its display overridden: changing a table's
 * display property strips its semantics in some screen readers, and a list of
 * payments is an honest description of what this is at this width.
 */
export function PaymentLedgerCardList({
  entries,
  emptyMessage,
  onSelectCreator,
}: {
  entries: LedgerEntry[]
  /** Shown in place of the cards when nothing matches. */
  emptyMessage: string
  onSelectCreator?: (creatorId: number) => void
}) {
  if (entries.length === 0) {
    return <p className="px-4 py-5.5 text-[14px] text-ink-muted sm:px-6">{emptyMessage}</p>
  }

  return (
    <ul className="list-none">
      {entries.map((entry) => (
        <PaymentLedgerCard key={entry.payment.id} entry={entry} onSelectCreator={onSelectCreator} />
      ))}
    </ul>
  )
}

function PaymentLedgerCard({
  entry,
  onSelectCreator,
}: {
  entry: LedgerEntry
  onSelectCreator?: (creatorId: number) => void
}) {
  const { payment } = entry
  const cancelled = entry.isReversal || entry.wasReversed

  return (
    <li
      className={joinClassNames(
        'relative border-b border-hair-5 bg-panel-2 px-4 py-3.25 sm:px-6',
        onSelectCreator &&
          'cursor-pointer hover:bg-row-hover focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-amber',
      )}
    >
      <div className="flex items-baseline justify-between gap-2.5">
        {onSelectCreator ? (
          /* The name is the button and the whole row is its hit area: the
             overlay stretches it across the li, and nothing else in the row
             is interactive for it to cover. */
          <button
            type="button"
            onClick={() => onSelectCreator(entry.creatorId)}
            className={joinClassNames(
              'cursor-pointer border-none bg-transparent p-0 text-left text-[16px] font-semibold after:absolute after:inset-0 after:content-[""] hover:text-amber focus-visible:outline-none',
              cancelled ? 'text-ink-muted' : 'text-ink',
            )}
          >
            {entry.creatorName}
          </button>
        ) : (
          <span className="text-[16px] font-semibold">{entry.creatorName}</span>
        )}

        <span
          className={joinClassNames(
            'whitespace-nowrap font-mono text-[16px]',
            entry.isReversal ? 'text-bad' : cancelled ? 'text-ink-muted' : 'text-ink',
          )}
        >
          {formatPaymentAmount(payment.amountInCents)}
        </span>
      </div>

      <div className="mt-1.5 flex justify-between gap-2.5 text-[12px] text-ink-dim">
        <span>
          {formatDate(payment.paidOn)} · {payment.method}
          {entry.isReversal && <LedgerTag>Reversal</LedgerTag>}
          {entry.wasReversed && <LedgerTag>Reversed</LedgerTag>}
        </span>
        <span className="whitespace-nowrap font-mono">{payment.reference || '—'}</span>
      </div>

      <div className="mt-1 text-[12px] text-[#5f5f5f]">
        {entry.campaignName} · {entry.recordedByName}
      </div>
    </li>
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
