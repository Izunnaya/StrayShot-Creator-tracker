import type { Creator } from '@/data/types'
import { getOutstandingBalance, getOverpaymentAmount } from '@/domain/creatorCalculations'
import { formatMoney } from '@/lib/format'

/**
 * The short note beside paid-against-agreed: what is still open, what was
 * paid beyond the deal, or that the two are square.
 *
 * Overpaid is its own note rather than falling under Settled. A full progress
 * bar looks the same either way, and an overpayment is a reconciliation job
 * nobody would find by reading "Settled". See DECISIONS.md, Q5.
 */
export function PaymentNote({ creator }: { creator: Creator }) {
  const outstanding = getOutstandingBalance(creator)
  const overpayment = getOverpaymentAmount(creator)

  if (outstanding > 0) {
    return <span className="whitespace-nowrap text-ink-muted">{formatMoney(outstanding)} open</span>
  }
  if (overpayment > 0) {
    return <span className="whitespace-nowrap text-amber">{formatMoney(overpayment)} overpaid</span>
  }
  return <span className="whitespace-nowrap text-ink-muted">Settled</span>
}
