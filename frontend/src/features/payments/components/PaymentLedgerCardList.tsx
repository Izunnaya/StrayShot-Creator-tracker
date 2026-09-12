import type { LedgerEntry } from '@/domain/paymentLedger'
import { joinClassNames } from '@/lib/classNames'
import { formatDate, formatPaymentAmount } from '@/lib/format'

/**
 * The ledger's narrow-screen form: one card per payment, carrying the same
 * seven values the table columns carry.
 *
 * A list rather than a table with its display overridden, for the reason the
 * creator cards give: changing a table's display property strips its
 * semantics in some screen readers, and a list of payments is an honest
 * description of what this is at this width.
 */
export function PaymentLedgerCardList({
  entries,
  onSelectCreator,
}: {
  entries: LedgerEntry[]
  onSelectCreator?: (creatorId: number) => void
}) {
  if (entries.length === 0) {
    return (
      <p className="px-4 py-6 text-[14px] text-ink-muted">
        No payments have been recorded for this campaign.
      </p>
    )
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
        'relative flex flex-col gap-2 border-t border-hair-4 px-4 py-3.5 text-[14px] first:border-t-0',
        cancelled && 'text-ink-muted',
        onSelectCreator &&
          'cursor-pointer hover:bg-row-hover focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-amber',
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {onSelectCreator ? (
          /* The name is the button and the whole card is its hit area, as on
             the creator cards: the overlay stretches it across the li, and
             nothing else in the card is interactive for it to cover. */
          <button
            type="button"
            onClick={() => onSelectCreator(entry.creatorId)}
            className="cursor-pointer font-semibold text-ink after:absolute after:inset-0 after:content-[''] hover:text-amber focus-visible:outline-none"
          >
            {entry.creatorName}
          </button>
        ) : (
          <span className="font-semibold">{entry.creatorName}</span>
        )}

        <span className="text-[12px] tracking-[1px] text-amber">{entry.creatorCode}</span>

        <span
          className={joinClassNames(
            'ml-auto whitespace-nowrap font-semibold',
            entry.isReversal && 'text-bad',
          )}
        >
          {formatPaymentAmount(payment.amountInCents)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
        <span>{formatDate(payment.paidOn)}</span>
        <span aria-hidden="true">·</span>
        <span>{entry.campaignName}</span>
        <span aria-hidden="true">·</span>
        <span>{payment.method}</span>
        {entry.isReversal && <LedgerTag>Reversal</LedgerTag>}
        {entry.wasReversed && <LedgerTag>Reversed</LedgerTag>}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[12px] text-ink-muted">
        <span className="whitespace-nowrap font-mono tracking-[0.5px]">
          {payment.reference || '—'}
        </span>
        <span>Recorded by {payment.recordedBy}</span>
      </div>
    </li>
  )
}

/** Marks a card as one half of a cancelled pair. */
function LedgerTag({ children }: { children: string }) {
  return (
    <span className="border border-hair px-1.5 py-0.5 text-[10px] uppercase tracking-[1px] text-ink-faint">
      {children}
    </span>
  )
}
