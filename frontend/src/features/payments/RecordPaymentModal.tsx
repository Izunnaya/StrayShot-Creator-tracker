import { useState } from 'react'
import { currentTeamMember } from '@/data/session'
import type { Creator } from '@/data/types'
import {
  getAmountPaid,
  getOutstandingBalance,
  getPaymentProgressPercent,
} from '@/domain/creatorCalculations'
import {
  getAmountToSettle,
  reviewPaymentDraft,
  type PaymentDraft,
  type PaymentProblem,
} from '@/domain/paymentRecording'
import { joinClassNames } from '@/lib/classNames'
import { formatMoney, formatPaymentAmount } from '@/lib/format'
import {
  Button,
  dialogActionsClasses,
  fieldInputClasses,
  FormField,
  Modal,
  monoFieldInputClasses,
  ProgressBar,
} from '@/ui'

/**
 * Recording a payment against a creator's deal.
 *
 * The team settles a row from wherever they noticed it — the outstanding
 * panel on the dashboard, or the creator's own screen — so this never
 * navigates anywhere. It opens over what they were looking at and closes
 * back onto it.
 *
 * The form states what the balance becomes before it is saved. That line is
 * the whole reason partial payments are workable: the person typing can see
 * that $1,500 of a $6,000 deal leaves $1,500 open, without doing the
 * arithmetic themselves.
 */

const PAYMENT_METHODS = ['Bank transfer', 'Wise', 'PayPal', 'USDC']

/** The domain returns codes; the wording of them belongs here. */
const problemMessages: Record<PaymentProblem, string> = {
  'amount-missing': 'Enter the amount that was paid.',
  'amount-unreadable':
    'That amount cannot be read. Enter it as a number, such as 1500 or 1,500.50.',
  'amount-not-positive': 'A payment has to be more than zero. To undo one, reverse it instead.',
  'date-missing': 'Enter the date the money went out.',
  'date-unreadable': 'That is not a date that exists. Use the picker, or type it as YYYY-MM-DD.',
  'date-in-future': 'That date is in the future. Record a payment once it has actually gone out.',
  'method-missing': 'Choose how the payment was made.',
}

export function RecordPaymentModal({
  creator,
  campaignName,
  today,
  onSave,
  onClose,
}: {
  creator: Creator
  /** Looked up by the shell: a creator holds only the campaign's id. */
  campaignName: string
  /** Today as an ISO date, so the future-date rule is testable. */
  today: string
  onSave: (draft: PaymentDraft) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<PaymentDraft>({
    amount: '',
    paidOn: today,
    method: PAYMENT_METHODS[0]!,
    reference: '',
  })
  const [hasTriedToSave, setHasTriedToSave] = useState(false)

  const review = reviewPaymentDraft(draft, creator, today)
  const amountPaid = getAmountPaid(creator)
  const outstanding = getOutstandingBalance(creator)
  const showProblems = hasTriedToSave && review.problems.length > 0

  const update = (field: keyof PaymentDraft) => (value: string) =>
    setDraft((current) => ({ ...current, [field]: value }))

  function handleSave() {
    setHasTriedToSave(true)
    if (review.canSave) onSave(draft)
  }

  return (
    <Modal
      title="Record payment"
      subtitle={
        /* The phone sheet names the creator only; the campaign is a second
           thing to read on a screen with no room for it. */
        <>
          <span className="md:hidden">{creator.name}</span>
          <span className="hidden md:inline">
            {creator.name} · {campaignName}
          </span>
        </>
      }
      onClose={onClose}
      footer={
        <div className={dialogActionsClasses}>
          <Button variant="cancel" size="sheet" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sheet" onClick={handleSave}>
            Save payment
          </Button>
        </div>
      }
    >
      <div className="mb-4.5 border border-hair bg-sunk-2 px-3.5 py-3 md:mb-5 md:px-4 md:py-3.5">
        <div className="flex justify-between gap-2 text-[12px] text-ink-muted md:text-[13px]">
          <span>Agreed {formatMoney(creator.contractedAmountInCents)}</span>
          <span>Paid {formatMoney(amountPaid)}</span>
          <span className={outstanding > 0 ? 'text-bad' : 'text-good'}>
            {outstanding > 0 ? `Open ${formatMoney(outstanding)}` : 'Settled'}
          </span>
        </div>
        <div className="mt-2.25 md:mt-2.5">
          <ProgressBar percentComplete={getPaymentProgressPercent(creator)} heightInPixels={5} />
        </div>
      </div>

      {/* Two columns from md up. On a phone one, with the reference ahead of
          who recorded it, as the phone design orders them. */}
      <div className="grid gap-3.5 md:grid-cols-2 md:gap-x-4.5 md:gap-y-4">
        <FormField label="Amount paid ($)">
          <input
            value={draft.amount}
            onChange={(event) => update('amount')(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
            aria-label="Amount paid in dollars"
            className="min-h-13 w-full border border-amber bg-sunk px-3.5 py-3 text-[22px] font-semibold text-amber md:min-h-0 md:px-3 md:py-2.5 md:text-[18px]"
          />
          {outstanding > 0 && (
            <button
              type="button"
              onClick={() => update('amount')((outstanding / 100).toFixed(2))}
              aria-label={`Pay full balance of ${formatMoney(getAmountToSettle(creator))}`}
              className="mt-2 min-h-10 cursor-pointer border border-hair bg-transparent px-3 py-2.25 text-[12px] uppercase tracking-[1px] text-ink-muted hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-amber md:mt-1.75 md:min-h-0 md:px-2.25 md:py-1.25 md:text-[11px]"
            >
              Pay full balance
            </button>
          )}
        </FormField>

        <FormField label="Date paid">
          <input
            type="date"
            value={draft.paidOn}
            max={today}
            onChange={(event) => update('paidOn')(event.target.value)}
            aria-label="Date paid"
            className={fieldInputClasses}
          />
        </FormField>

        <FormField label="Method">
          <select
            value={draft.method}
            onChange={(event) => update('method')(event.target.value)}
            aria-label="Payment method"
            className={fieldInputClasses}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Recorded by" className="order-last md:order-0">
          {/* Stamped from the session rather than typed — see DECISIONS.md, Q4. */}
          <div className={fieldInputClasses}>{currentTeamMember.name}</div>
        </FormField>

        <FormField label="Reference / transaction ID" className="md:col-span-2">
          <input
            value={draft.reference}
            onChange={(event) => update('reference')(event.target.value)}
            placeholder="e.g. WISE-8842-B"
            aria-label="Reference or transaction ID"
            className={monoFieldInputClasses}
          />
        </FormField>
      </div>

      <p
        className={joinClassNames(
          'mt-3.5 text-[12px] md:mt-4',
          review.overpaymentAfterInCents > 0 ? 'text-amber' : 'text-ink-muted',
        )}
        role="status"
      >
        {describeOutcome(review, creator)}
      </p>

      {showProblems && (
        <ul className="mt-3 list-none text-[13px] text-bad" role="alert">
          {review.problems.map((problem) => (
            <li key={problem}>{problemMessages[problem]}</li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

/** The live line under the form: what saving this will do to the balance. */
function describeOutcome(review: ReturnType<typeof reviewPaymentDraft>, creator: Creator): string {
  if (review.amountInCents === null || review.amountInCents <= 0) {
    return 'Enter an amount to see what it leaves outstanding.'
  }

  const paidAfter = formatPaymentAmount(review.amountPaidAfterInCents)
  const agreed = formatMoney(creator.contractedAmountInCents)

  if (review.overpaymentAfterInCents > 0) {
    return `After saving: ${paidAfter} paid against ${agreed} agreed — ${formatPaymentAmount(
      review.overpaymentAfterInCents,
    )} more than the deal. It will save, and show as overpaid for someone to reconcile.`
  }

  if (review.settlesBalance) {
    return `After saving: ${paidAfter} paid, balance closed. The row leaves the outstanding list.`
  }

  return `After saving: ${paidAfter} of ${agreed} paid, ${formatPaymentAmount(
    review.outstandingAfterInCents,
  )} still open.`
}
