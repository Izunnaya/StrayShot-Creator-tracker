import { useMemo } from 'react'
import { buildInstallChart } from '@/domain/installChart'
import type { Creator } from '@/data/types'
import { campaigns, dailyInstalls, chartStartDate, chartDayCount, streams } from '@/data/fixtures'
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
import { Panel, SectionTitle } from '@/ui'
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
  creators: allCreators,
  onSelectCreator,
  onRecordPayment,
  filterState,
  sortState,
}: {
  /** Every creator, before either filter narrows them. */
  creators: Creator[]
  filterState: ReturnType<typeof useCreatorFilterSelection>
  sortState: ReturnType<typeof useCreatorSortSelection>
  /** Opens the creator detail screen for the row that was clicked. */
  onSelectCreator?: (creator: Creator) => void
  /** Opens the record payment modal for a row in the outstanding panel. */
  onRecordPayment?: (creator: Creator) => void
}) {
  const {
    selection: filterSelection,
    selectCampaign,
    selectLifecycleStatus,
    hasSpecificCampaignSelected,
  } = filterState
  const { selection: sortSelection, handleColumnClick } = sortState

  /**
   * The creator table shows creators matching BOTH filters, sorted by the
   * selected column.
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
   * The headline figures are calculated from the same filtered set, so
   * narrowing the filters also narrows the totals. Whether the team expects
   * the status filter to move these figures is open question Q20.
   */
  const summary = useMemo(
    () => calculateCampaignSummary(filterCreators(allCreators, filterSelection)),
    [allCreators, filterSelection],
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
  const selectedCampaign = campaigns.find((campaign) => campaign.name === filterSelection.campaign)
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
          canEditSelectedCampaign={hasSpecificCampaignSelected}
        />

        <CreatorStatusFilterChipRow
          selectedStatus={filterSelection.lifecycleStatus}
          onSelectStatus={selectLifecycleStatus}
          countsByStatus={countsByStatus}
        />
      </div>

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
