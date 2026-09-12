import type { LedgerTotals } from '@/domain/paymentLedger'
import { formatMoney, formatNumber, formatPaymentAmount } from '@/lib/format'
import { StatStrip, StatTile } from '@/ui'

/**
 * What the payments in view come to.
 *
 * The headline is the net, because that is what the campaign cost and what
 * every other screen calls paid. The gross sits under it as supporting text
 * instead of alongside it: two money figures of similar size, side by side,
 * invite being read as two separate outgoings.
 *
 * Reversed is shown in cents like the ledger rows themselves — it is
 * reconciled against a statement line, not skimmed.
 */
export function PaymentLedgerSummaryStrip({ totals }: { totals: LedgerTotals }) {
  return (
    <StatStrip columnCount={3}>
      <StatTile
        label="Paid, net"
        value={formatMoney(totals.netInCents)}
        supportingText={
          totals.reversedInCents > 0
            ? `${formatMoney(totals.grossInCents)} paid out, ${formatMoney(totals.reversedInCents)} cancelled`
            : 'nothing cancelled'
        }
      />
      <StatTile
        label="Reversed"
        value={formatPaymentAmount(totals.reversedInCents)}
        supportingText="already deducted above"
        tone={totals.reversedInCents > 0 ? 'needsAttention' : 'neutral'}
      />
      <StatTile
        label="Payments"
        value={formatNumber(totals.entryCount)}
        supportingText={`to ${formatNumber(totals.creatorCount)} ${
          totals.creatorCount === 1 ? 'creator' : 'creators'
        }`}
        tone="accent"
      />
    </StatStrip>
  )
}
