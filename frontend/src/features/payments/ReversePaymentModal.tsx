import { currentTeamMember, teamMembers } from '@/data/session'
import type { Creator, Payment } from '@/data/types'
import { getAmountPaid } from '@/domain/creatorCalculations'
import { getTeamMemberName } from '@/domain/teamMembers'
import { Button, dialogActionsClasses, Modal } from '@/ui'
import { formatDate, formatPaymentAmount } from '@/lib/format'

/**
 * Undoing a payment that should not have been recorded.
 *
 * Deliberately not an edit form. The original record is never changed and
 * never disappears: reversing writes a second record carrying the opposite
 * amount, and both stay in the history. That is what lets someone reading the
 * ledger next quarter see that a figure was corrected, rather than finding a
 * number that quietly disagrees with what they approved.
 *
 * So this screen confirms rather than collects. The only thing to decide is
 * whether to go ahead, and the copy says exactly what the record will look
 * like afterwards. See DECISIONS.md, Q6.
 */
export function ReversePaymentModal({
  creator,
  campaignName,
  payment,
  onConfirm,
  onClose,
}: {
  creator: Creator
  /** Looked up by the shell: a creator holds only the campaign's id. */
  campaignName: string
  payment: Payment
  onConfirm: () => void
  onClose: () => void
}) {
  const paidAfterInCents = getAmountPaid(creator) - payment.amountInCents

  return (
    <Modal
      title="Reverse payment"
      subtitle={`${creator.name} · ${campaignName}`}
      labelId="reverse-payment-title"
      onClose={onClose}
      footer={
        <div className={dialogActionsClasses}>
          <Button variant="cancel" size="sheet" onClick={onClose}>
            Keep it
          </Button>
          <Button variant="primary" size="sheet" onClick={onConfirm}>
            Reverse payment
          </Button>
        </div>
      }
    >
      <dl className="border border-hair bg-sunk-2 px-4 py-3.5 text-[14px]">
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-ink-muted">Amount</dt>
          <dd className="font-semibold">{formatPaymentAmount(payment.amountInCents)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-ink-muted">Paid on</dt>
          <dd>{formatDate(payment.paidOn)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-ink-muted">Method</dt>
          <dd>{payment.method}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-ink-muted">Reference</dt>
          <dd className="font-mono text-[13px]">{payment.reference || '—'}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-ink-muted">Recorded by</dt>
          <dd>{getTeamMemberName(teamMembers, payment.recordedByTeamMemberId)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-[13px] text-ink-muted">
        This payment stays in the history. A second record for{' '}
        <span className="font-semibold text-bad">
          {formatPaymentAmount(-payment.amountInCents)}
        </span>{' '}
        is added alongside it, in {currentTeamMember.name}&rsquo;s name, cancelling it out.
      </p>

      <p className="mt-2 text-[13px] text-ink-muted">
        {creator.name} will show as paid {formatPaymentAmount(paidAfterInCents)} of{' '}
        {formatPaymentAmount(creator.contractedAmountInCents)} afterwards.
      </p>
    </Modal>
  )
}
