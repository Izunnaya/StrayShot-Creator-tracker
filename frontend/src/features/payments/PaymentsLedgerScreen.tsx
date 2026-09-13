import { useMemo } from 'react'
import { teamMembers } from '@/data/session'
import type { Campaign, Creator } from '@/data/types'
import type { CampaignFilter } from '@/domain/creatorFiltering'
import { buildPaymentLedger, filterLedgerByCampaign, summariseLedger } from '@/domain/paymentLedger'
import { CampaignFilterChipRow } from '@/features/dashboard/components/CampaignFilterChipRow'
import { SectionTitle } from '@/ui'
import { PaymentLedgerSummaryStrip } from './components/PaymentLedgerSummaryStrip'
import { PaymentLedgerTable } from './components/PaymentLedgerTable'

/**
 * Every payment the team has made, in one place.
 *
 * The creator detail screen answers what one person has been paid. This
 * answers what has left the account, which is the question asked with a bank
 * statement open — so the ordering is by date across everyone rather than by
 * creator, and the reference is a column rather than a detail.
 *
 * The ledger is derived from the same creator records the rest of the
 * application reads, on every render. There is no separate payments store to
 * fall out of step with the screen a payment was recorded on.
 *
 * Recording a payment is not offered here: a payment belongs to a creator and
 * the form needs the deal it is settling, so it starts from the creator, on
 * the dashboard or their own screen. This screen goes there instead.
 */
export function PaymentsLedgerScreen({
  campaigns,
  creators,
  selectedCampaign,
  onSelectCampaign,
  onSelectCreator,
}: {
  campaigns: Campaign[]
  /** Every creator: the ledger is built from the payments they hold. */
  creators: Creator[]
  selectedCampaign: CampaignFilter
  onSelectCampaign: (campaign: CampaignFilter) => void
  /** Opens the creator a payment went to. */
  onSelectCreator?: (creatorId: number) => void
}) {
  const entries = useMemo(
    () =>
      filterLedgerByCampaign(
        buildPaymentLedger(creators, { campaigns, teamMembers }),
        selectedCampaign,
      ),
    [creators, campaigns, selectedCampaign],
  )

  const totals = useMemo(() => summariseLedger(entries), [entries])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-10 pt-5 sm:px-6 md:gap-6 md:px-8 md:pb-12 md:pt-7">
      <PaymentLedgerSummaryStrip totals={totals} />

      <CampaignFilterChipRow
        campaigns={campaigns}
        selectedCampaign={selectedCampaign}
        onSelectCampaign={onSelectCampaign}
        canEditSelectedCampaign={false}
      />

      <section className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <SectionTitle>
            Payment <span className="text-amber">ledger</span>
          </SectionTitle>
          <div className="text-[12px] text-ink-muted">
            Newest first · amounts to the cent · reversals shown in place
          </div>
        </div>

        <PaymentLedgerTable entries={entries} onSelectCreator={onSelectCreator} />
      </section>
    </div>
  )
}
