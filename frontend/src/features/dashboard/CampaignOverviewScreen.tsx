import { useMemo } from 'react'
import { buildInstallChart } from '@/domain/installChart'
import type { Campaign, Creator } from '@/data/types'
import { dailyInstalls, chartStartDate, chartDayCount, streams } from '@/data/fixtures'
import { calculateCampaignSummary } from '@/domain/campaignSummary'
import { DEFAULT_TARGET_COST_PER_INSTALL_IN_CENTS } from '@/domain/costPerInstallRating'
import { isAwaitingPayment, isPaidButUndelivered } from '@/domain/creatorCalculations'
import {
  countCreatorsByLifecycleStatus,
  EVERY_CAMPAIGN,
  filterCreators,
  filterCreatorsByCampaign,
} from '@/domain/creatorFiltering'
import { sortCreators } from '@/domain/creatorSorting'
import { Panel, SearchField, SectionTitle } from '@/ui'
import { CampaignBudgetPanel } from './components/CampaignBudgetPanel'
import { CampaignFilterChipRow } from './components/CampaignFilterChipRow'
import { CreatorPerformanceTable } from './components/CreatorPerformanceTable'
import { CreatorStatusFilterChipRow } from './components/CreatorStatusFilterChipRow'
import { DashboardSummaryStrip } from './components/DashboardSummaryStrip'
import { DeliveredPaymentOpenPanel } from './components/DeliveredPaymentOpenPanel'
import { InstallsOverTimeChart } from './components/InstallsOverTimeChart'
import { PaidNotDeliveredPanel } from './components/PaidNotDeliveredPanel'
import type { useCreatorFilterSelection } from './hooks/useCreatorFilterSelection'
import type { useCreatorSortSelection } from './hooks/useCreatorSortSelection'

/**
 * The team's main screen: how the campaign is performing, who is owed money,
 * and who still owes streams.
 *
 * The app shell preserves dashboard selection while a creator detail is open. Everything below
 * it receives what to show and reports what was clicked, which keeps the
 * components reusable on the creator detail screen and the ledger later.
 *
 * Data still comes from the fixture module. Replacing those imports with API
 * calls is the whole of this screen's Phase 5 work.
 */
export function CampaignOverviewScreen({
  campaigns,
  creators: allCreators,
  onSelectCreator,
  onRecordPayment,
  onCreateCampaign,
  onEditCampaign,
  filterState,
  sortState,
}: {
  /** Every campaign, for the filter chips and the campaign's own target. */
  campaigns: Campaign[]
  /** Every creator, before either filter narrows them. */
  creators: Creator[]
  filterState: ReturnType<typeof useCreatorFilterSelection>
  sortState: ReturnType<typeof useCreatorSortSelection>
  /** Opens the creator detail screen for the row that was clicked. */
  onSelectCreator?: (creator: Creator) => void
  /** Opens the record payment modal for a row in the outstanding panel. */
  onRecordPayment?: (creator: Creator) => void
  onCreateCampaign?: () => void
  /** Edits whichever campaign the filter is currently narrowed to. */
  onEditCampaign?: (campaign: Campaign) => void
}) {
  const {
    selection: filterSelection,
    selectCampaign,
    selectLifecycleStatus,
    setSearchText,
  } = filterState
  const { selection: sortSelection, handleColumnClick } = sortState

  /** The one campaign in view, or undefined with every campaign at once. */
  const selectedCampaign = campaigns.find((campaign) => campaign.id === filterSelection.campaign)

  /**
   * The creator table shows creators matching every filter -- campaign,
   * status and search -- sorted by the selected column.
   */
  const creatorsInTable = useMemo(
    () => sortCreators(filterCreators(allCreators, filterSelection), sortSelection),
    [allCreators, filterSelection, sortSelection],
  )

  /**
   * The chart is built from the same filtered set as the table, so selecting a
   * campaign moves the line and its stream markers together with everything
   * else on the screen rather than leaving another scope's series underneath.
   */
  const chart = useMemo(
    () =>
      buildInstallChart(
        dailyInstalls,
        streams,
        filterCreators(allCreators, filterSelection),
        chartStartDate,
        chartDayCount,
      ),
    [allCreators, filterSelection],
  )

  /**
   * The headline figures follow the campaign but not the status filter, and
   * not the search either, for the same reason: a search is a lens on the
   * table, not a change of what the campaign has cost.
   *
   * Campaign is a scope: it says which campaign these are the figures for.
   * Status is a lens on the table below, and the chip counts and both
   * follow-up panels already treat it that way -- the strip was the only
   * place it changed what the numbers meant. Selecting Prospects made the
   * campaign read "$0 of $0 committed", which looks like a broken campaign
   * rather than an empty slice, and took away the denominator the table is
   * being read against. Q20, decided.
   */
  const summary = useMemo(
    () => calculateCampaignSummary(filterCreatorsByCampaign(allCreators, filterSelection.campaign)),
    [allCreators, filterSelection.campaign],
  )

  /** Chip counts follow the campaign filter but not the status filter. */
  const countsByStatus = useMemo(
    () => countCreatorsByLifecycleStatus(allCreators, filterSelection.campaign),
    [allCreators, filterSelection.campaign],
  )

  /**
   * The two status panels are scoped to the selected campaign but ignore the
   * status filter, since they answer "what needs chasing on this campaign"
   * rather than "what is in the table". This mirrors the prototype and is
   * open question Q22.
   */
  const creatorsInCampaign = useMemo(
    () => filterCreatorsByCampaign(allCreators, filterSelection.campaign),
    [allCreators, filterSelection.campaign],
  )
  const creatorsAwaitingPayment = creatorsInCampaign.filter(isAwaitingPayment)
  const creatorsPaidButUndelivered = creatorsInCampaign.filter(isPaidButUndelivered)

  /**
   * Each campaign sets its own target. With every campaign in view there is
   * no single target, so the figures fall back to a default — open question
   * Q21.
   */
  const targetCostPerInstallInCents =
    selectedCampaign?.targetCostPerInstallInCents ?? DEFAULT_TARGET_COST_PER_INSTALL_IN_CENTS

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pb-10 pt-5 sm:px-6 md:gap-6 md:px-8 md:pb-12 md:pt-7">
      <DashboardSummaryStrip summary={summary} />

      <div className="flex flex-col gap-4">
        <CampaignFilterChipRow
          campaigns={campaigns}
          selectedCampaign={filterSelection.campaign}
          onSelectCampaign={selectCampaign}
          canEditSelectedCampaign={Boolean(selectedCampaign && onEditCampaign)}
          onCreateCampaign={onCreateCampaign}
          onEditSelectedCampaign={
            selectedCampaign && onEditCampaign ? () => onEditCampaign(selectedCampaign) : undefined
          }
          leading={
            <SearchField
              label="Search creators by name or code"
              placeholder="Search creator or code"
              value={filterSelection.searchText}
              onValueChange={setSearchText}
            />
          }
        />

        <CreatorStatusFilterChipRow
          selectedStatus={filterSelection.lifecycleStatus}
          onSelectStatus={selectLifecycleStatus}
          countsByStatus={countsByStatus}
        />
      </div>

      {selectedCampaign && (
        <CampaignBudgetPanel campaign={selectedCampaign} creators={allCreators} />
      )}

      <CreatorPerformanceTable
        creators={creatorsInTable}
        sortSelection={sortSelection}
        onColumnHeadingClick={handleColumnClick}
        targetCostPerInstallInCents={targetCostPerInstallInCents}
        onSelectCreator={onSelectCreator}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="px-4 py-4 sm:px-5.5 sm:py-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <SectionTitle>
              Installs <span className="text-amber">over time</span>
            </SectionTitle>
            <div className="text-[12px] text-ink-muted">
              Dashed lines mark stream days · last 6 weeks
            </div>
          </div>

          <InstallsOverTimeChart
            dailyInstallCounts={chart.dailyInstallCounts}
            streamDayMarkers={chart.streamDayMarkers}
            weekLabels={chart.weekLabels}
          />
        </Panel>

        <div className="grid gap-6">
          <DeliveredPaymentOpenPanel
            onRecordPayment={onRecordPayment}
            creators={creatorsAwaitingPayment}
            totalOutstandingBalanceInCents={
              calculateCampaignSummary(creatorsAwaitingPayment).totalOutstandingBalanceInCents
            }
          />

          <PaidNotDeliveredPanel creators={creatorsPaidButUndelivered} />
        </div>
      </div>
    </div>
  )
}

/** Re-exported so the filter sentinel is available to callers of this screen. */
export { EVERY_CAMPAIGN }
