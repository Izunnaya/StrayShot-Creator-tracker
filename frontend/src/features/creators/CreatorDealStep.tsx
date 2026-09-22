import type { Campaign } from '@/data/types'
import type { CreatorDraft } from '@/domain/creatorRecording'
import { joinClassNames } from '@/lib/classNames'
import { emphasisedFieldInputClasses, fieldInputClasses, FormField } from '@/ui'
import { PhoneText } from './PhoneText'

/**
 * Step two: the deal. Skippable, because the team meets a creator long
 * before the terms are agreed.
 */
export function CreatorDealStep({
  draft,
  update,
  campaigns,
  currencies,
}: {
  draft: CreatorDraft
  update: (field: keyof CreatorDraft) => (value: string) => void
  campaigns: Campaign[]
  /** The payout currencies offered, including whatever the record already holds. */
  currencies: string[]
}) {
  return (
    /* Three columns from md up, as the design lays the deal out. On a
           phone a six-track grid: whole rows, halves, and the design's row of
           three for rate, currency and streams. */
    <>
      <div className="grid grid-cols-6 gap-x-3 gap-y-3.5 md:grid-cols-3 md:gap-x-4.5 md:gap-y-3.75">
        <FormField label="Campaign" className="col-span-6 md:col-span-2">
          <select
            value={draft.campaignId}
            onChange={(event) => update('campaignId')(event.target.value)}
            aria-label="Campaign"
            className={fieldInputClasses}
          >
            <option value="">—</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={String(campaign.id)}>
                {campaign.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Assigned code" className="col-span-3 md:col-span-1">
          <input
            value={draft.creatorCode}
            onChange={(event) => update('creatorCode')(event.target.value.toUpperCase())}
            aria-label="Assigned code"
            className={joinClassNames(emphasisedFieldInputClasses, 'tracking-[2px]')}
          />
        </FormField>

        <FormField label="Rate model" className="col-span-3 md:col-span-1">
          <select
            value={draft.rateModel}
            onChange={(event) => update('rateModel')(event.target.value)}
            aria-label="Rate model"
            className={fieldInputClasses}
          >
            <option value="per-stream">Per stream</option>
            <option value="flat-fee">Flat fee</option>
          </select>
        </FormField>

        <FormField
          label={
            <PhoneText
              wide={draft.rateModel === 'flat-fee' ? 'Agreed fee' : 'Agreed rate'}
              phone={draft.rateModel === 'flat-fee' ? 'Fee' : 'Rate'}
            />
          }
          className="col-span-2 md:col-span-1"
        >
          <input
            value={draft.agreedRate}
            onChange={(event) => update('agreedRate')(event.target.value)}
            inputMode="decimal"
            aria-label="Agreed rate in dollars"
            className={fieldInputClasses}
          />
        </FormField>

        <FormField
          label={<PhoneText wide="Currency" phone="Cur." />}
          className="col-span-2 md:col-span-1"
        >
          <select
            value={draft.payoutCurrency}
            onChange={(event) => update('payoutCurrency')(event.target.value)}
            aria-label="Payout currency"
            className={fieldInputClasses}
          >
            {currencies.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </FormField>

        <FormField
          label={<PhoneText wide="Streams committed" phone="Streams" />}
          className="col-span-2 md:col-span-1"
        >
          <input
            value={draft.streamsCommitted}
            onChange={(event) => update('streamsCommitted')(event.target.value)}
            inputMode="numeric"
            aria-label="Streams committed"
            className={fieldInputClasses}
          />
        </FormField>

        <FormField label="Min duration (hrs)" className="col-span-6 md:col-span-1">
          <input
            value={draft.minimumStreamHours}
            onChange={(event) => update('minimumStreamHours')(event.target.value)}
            inputMode="decimal"
            aria-label="Minimum duration in hours"
            className={fieldInputClasses}
          />
        </FormField>

        <FormField label="Window opens" className="col-span-3 md:col-span-1">
          <input
            type="date"
            value={draft.deliveryWindowStart}
            onChange={(event) => update('deliveryWindowStart')(event.target.value)}
            aria-label="Delivery window opens"
            className={fieldInputClasses}
          />
        </FormField>

        <FormField label="Window closes" className="col-span-3 md:col-span-1">
          <input
            type="date"
            value={draft.deliveryWindowEnd}
            onChange={(event) => update('deliveryWindowEnd')(event.target.value)}
            aria-label="Delivery window closes"
            className={fieldInputClasses}
          />
        </FormField>

        <FormField label="Additional requirements" className="col-span-6 md:col-span-3">
          <textarea
            value={draft.requirements}
            onChange={(event) => update('requirements')(event.target.value)}
            rows={2}
            placeholder="Code on screen, link in description…"
            aria-label="Additional requirements"
            className={joinClassNames(fieldInputClasses, 'resize-y')}
          />
        </FormField>
      </div>

      <p className="mt-3 hidden text-[12px] text-ink-soft md:block">
        Streams are auto-detected from the YouTube and Twitch APIs, so delivery is measured against
        these numbers.
      </p>
    </>
  )
}
