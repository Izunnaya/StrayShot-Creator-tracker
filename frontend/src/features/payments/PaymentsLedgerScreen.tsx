import { useMemo } from 'react'
import { teamMembers } from '@/data/session'
import type { Campaign, Creator } from '@/data/types'
import {
  buildPaymentLedger,
  filterLedger,
  isDateRangeBackwards,
  sortLedger,
  summariseLedger,
} from '@/domain/paymentLedger'
import { CampaignFilterChipRow } from '@/features/dashboard/components/CampaignFilterChipRow'
import { SearchField, SectionTitle } from '@/ui'
import { PaidDateRangeFields } from './components/PaidDateRangeFields'
import { PaymentLedgerSummaryStrip } from './components/PaymentLedgerSummaryStrip'
import { PaymentLedgerTable } from './components/PaymentLedgerTable'
import type { usePaymentLedgerSelection } from './hooks/usePaymentLedgerSelection'

/**
 * Every payment the team has made, in one place.
 *
 * The creator detail screen answers what one person has been paid. This
 * answers what has left the account, which is the question asked with a bank
 * statement open — so it opens ordered by date across everyone rather than by
 * creator, the reference is a column rather than a detail, and it can be
 * narrowed to the statement's dates and searched by the statement's reference.
 *
 * The ledger is derived from the same creator records the rest of the
 * application reads, on every render. There is no separate payments store to
 * fall out of step with the screen a payment was recorded on.
 *
 * Every figure on the screen, the summary strip included, describes the
 * entries in view. That is what "a total for the current filter" asks for, and
 * unlike the dashboard there is no campaign-wide denominator here for a
 * narrower filter to take away.
 *
 * Recording a payment is not offered here: a payment belongs to a creator and
 * the form needs the deal it is settling, so it starts from the creator, on
 * the dashboard or their own screen. This screen goes there instead.
 */
export function PaymentsLedgerScreen({
  campaigns,
  creators,
  selectionState,
  onSelectCreator,
}: {
  campaigns: Campaign[]
  /** Every creator: the ledger is built from the payments they hold. */
  creators: Creator[]
  selectionState: ReturnType<typeof usePaymentLedgerSelection>
  /** Opens the creator a payment went to. */
  onSelectCreator?: (creatorId: number) => void
}) {
  const { filter, sort } = selectionState

  const entries = useMemo(
    () =>
      sortLedger(
        filterLedger(buildPaymentLedger(creators, { campaigns, teamMembers }), filter),
        sort,
      ),
    [creators, campaigns, filter, sort],
  )

  const totals = useMemo(() => summariseLedger(entries), [entries])

  const emptyMessage = isDateRangeBackwards(filter)
    ? 'The From date is after the To date, so no payment can fall between them.'
    : 'No payments match this filter.'

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-10 pt-5 sm:px-6 md:gap-6 md:px-8 md:pb-12 md:pt-7">
      <PaymentLedgerSummaryStrip totals={totals} />

      <CampaignFilterChipRow
        campaigns={campaigns}
        selectedCampaign={filter.campaign}
        onSelectCampaign={selectionState.selectCampaign}
        canEditSelectedCampaign={false}
        leading={
          <SearchField
            label="Search payments by creator or reference"
            placeholder="Search creator or reference"
            value={filter.searchText}
            onValueChange={selectionState.setSearchText}
          />
        }
        trailing={
          <PaidDateRangeFields
            paidFrom={filter.paidFrom}
            paidTo={filter.paidTo}
            onChangePaidFrom={selectionState.setPaidFrom}
            onChangePaidTo={selectionState.setPaidTo}
          />
        }
      />

      <section className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <SectionTitle>
            Payment <span className="text-amber">ledger</span>
          </SectionTitle>
          <div className="text-[12px] text-ink-muted">
            Amounts to the cent · reversals shown in place
          </div>
        </div>

        <PaymentLedgerTable
          entries={entries}
          netTotalInCents={totals.netInCents}
          sortSelection={sort}
          onColumnHeadingClick={selectionState.handleColumnClick}
          onStepSort={selectionState.stepSort}
          emptyMessage={emptyMessage}
          onSelectCreator={onSelectCreator}
        />
      </section>
    </div>
  )
}
