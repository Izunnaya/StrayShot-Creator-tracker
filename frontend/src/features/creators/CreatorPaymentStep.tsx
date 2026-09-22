import type { CreatorDraft } from '@/domain/creatorRecording'
import { fieldInputClasses, FormField, monoFieldInputClasses } from '@/ui'

const PAYMENT_METHODS = ['Bank transfer', 'PayPal', 'Crypto', 'Other']

/**
 * Step three: how they get paid. Recorded for whoever makes the transfer;
 * every figure in the application is USD (Q8).
 */
export function CreatorPaymentStep({
  draft,
  update,
}: {
  draft: CreatorDraft
  update: (field: keyof CreatorDraft) => (value: string) => void
}) {
  return (
    <div className="grid gap-3.5 md:grid-cols-[1fr_1.4fr] md:gap-x-4.5 md:gap-y-3.75">
      <FormField label="Payment method">
        <select
          value={draft.paymentMethod}
          onChange={(event) => update('paymentMethod')(event.target.value)}
          aria-label="Payment method"
          className={fieldInputClasses}
        >
          <option value="">—</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method}>{method}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Payment details or reference">
        <input
          value={draft.paymentDetails}
          onChange={(event) => update('paymentDetails')(event.target.value)}
          aria-label="Payment details or reference"
          className={monoFieldInputClasses}
        />
      </FormField>
    </div>
  )
}
