import { useMemo, useState } from 'react'
import { teamMembers } from '@/data/session'
import type { Campaign, Creator } from '@/data/types'
import { EVERY_CAMPAIGN } from '@/domain/creatorFiltering'
import {
  buildPaymentLedger,
  filterLedger,
  isDateRangeBackwards,
  sortLedger,
  summariseLedger,
} from '@/domain/paymentLedger'
import { CampaignFilterChipRow } from '@/features/dashboard/components/CampaignFilterChipRow'
import { usePhoneLayout } from '@/lib/usePhoneLayout'
import { FilterSheetButton, SearchField } from '@/ui'
import { LedgerFilterSheet } from './components/LedgerFilterSheet'
import { PaidDateRangeFields } from './components/PaidDateRangeFields'
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
 * It reads as a ledger rather than a dashboard: a title, the filters, and the
 * rows closed by the total for the current filter, with no figures above
 * them. The total is the net of the rows in view, reversals deducted.
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
  const isPhone = usePhoneLayout()
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

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

  const searchField = (
    <SearchField
      label="Search payments by creator or reference"
      placeholder="Search creator or reference"
      value={filter.searchText}
      onValueChange={selectionState.setSearchText}
    />
  )
  const dateRangeFields = (
    <PaidDateRangeFields
      paidFrom={filter.paidFrom}
      paidTo={filter.paidTo}
      onChangePaidFrom={selectionState.setPaidFrom}
      onChangePaidTo={selectionState.setPaidTo}
    />
  )
  const table = (
    <PaymentLedgerTable
      entries={entries}
      netTotalInCents={totals.netInCents}
      sortSelection={sort}
      onColumnHeadingClick={selectionState.handleColumnClick}
      onStepSort={selectionState.stepSort}
      emptyMessage={emptyMessage}
      onSelectCreator={onSelectCreator}
    />
  )

  if (isPhone) {
    /* The phone design swaps the campaign chips for a button that names the
       campaign in view and opens a sheet of them. The masthead already says
       Ledger, so there is no title. */
    const campaignName = campaigns.find((campaign) => campaign.id === filter.campaign)?.name

    return (
      <div className="px-4 pt-3.5 sm:px-6">
        {searchField}

        <div className="mt-3">
          <FilterSheetButton
            label="Filter payments"
            summary={campaignName ?? 'All campaigns'}
            isFiltered={filter.campaign !== EVERY_CAMPAIGN}
            onClick={() => setIsFilterSheetOpen(true)}
          />
        </div>

        <div className="mb-4 mt-3">{dateRangeFields}</div>

        {table}

        {isFilterSheetOpen && (
          <LedgerFilterSheet
            campaigns={campaigns}
            selectedCampaign={filter.campaign}
            onSelectCampaign={selectionState.selectCampaign}
            onClearAll={selectionState.clearFilters}
            matchingPaymentCount={entries.length}
            onClose={() => setIsFilterSheetOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-295 px-8 pb-12 pt-7">
      <div className="mb-4.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-[28px] uppercase tracking-[1px] text-ink">
          Payment <span className="text-amber">ledger</span>
        </h1>
        <div className="text-[13px] text-ink-muted">Every recorded payment across all creators</div>
      </div>

      <div className="mb-4">
        <CampaignFilterChipRow
          campaigns={campaigns}
          selectedCampaign={filter.campaign}
          onSelectCampaign={selectionState.selectCampaign}
          canEditSelectedCampaign={false}
          leading={searchField}
          trailing={dateRangeFields}
        />
      </div>

      {table}
    </div>
  )
}
