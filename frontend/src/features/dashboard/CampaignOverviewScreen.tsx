import { useMemo } from "react";
import type { Creator } from "../../data/types";
import {
  campaigns,
  chartWeekLabels,
  creators as allCreators,
  dailyInstallCounts,
  streamDayMarkers,
} from "../../data/fixtures";
import { calculateCampaignSummary } from "../../domain/campaignSummary";
import { DEFAULT_TARGET_COST_PER_INSTALL } from "../../domain/costPerInstallRating";
import {
  isAwaitingPayment,
  isPaidButUndelivered,
} from "../../domain/creatorCalculations";
import {
  countCreatorsByLifecycleStatus,
  EVERY_CAMPAIGN,
  filterCreators,
  filterCreatorsByCampaign,
} from "../../domain/creatorFiltering";
import { sortCreators } from "../../domain/creatorSorting";
import { Panel, SectionTitle } from "../../ui";
import { CampaignFilterChipRow } from "./components/CampaignFilterChipRow";
import { CreatorPerformanceTable } from "./components/CreatorPerformanceTable";
import { CreatorStatusFilterChipRow } from "./components/CreatorStatusFilterChipRow";
import { DashboardSummaryStrip } from "./components/DashboardSummaryStrip";
import { DeliveredPaymentOpenPanel } from "./components/DeliveredPaymentOpenPanel";
import { InstallsOverTimeChart } from "./components/InstallsOverTimeChart";
import { PaidNotDeliveredPanel } from "./components/PaidNotDeliveredPanel";
import { useCreatorFilterSelection } from "./hooks/useCreatorFilterSelection";
import { useCreatorSortSelection } from "./hooks/useCreatorSortSelection";

/**
 * The team's main screen: how the campaign is performing, who is owed money,
 * and who still owes streams.
 *
 * This is the only place on the dashboard that holds state. Everything below
 * it receives what to show and reports what was clicked, which keeps the
 * components reusable on the creator detail screen and the ledger later.
 *
 * Data still comes from the fixture module. Replacing those imports with API
 * calls is the whole of this screen's Phase 5 work.
 */
export function CampaignOverviewScreen({
  onSelectCreator,
}: {
  /** Opens the creator detail screen for the row that was clicked. */
  onSelectCreator?: (creator: Creator) => void;
} = {}) {
  const {
    selection: filterSelection,
    selectCampaign,
    selectLifecycleStatus,
    hasSpecificCampaignSelected,
  } = useCreatorFilterSelection();
  const { selection: sortSelection, handleColumnClick } =
    useCreatorSortSelection();

  /**
   * The creator table shows creators matching BOTH filters, sorted by the
   * selected column.
   */
  const creatorsInTable = useMemo(
    () =>
      sortCreators(filterCreators(allCreators, filterSelection), sortSelection),
    [filterSelection, sortSelection],
  );

  /**
   * The headline figures are calculated from the same filtered set, so
   * narrowing the filters also narrows the totals. Whether the team expects
   * the status filter to move these figures is open question Q20.
   */
  const summary = useMemo(
    () =>
      calculateCampaignSummary(filterCreators(allCreators, filterSelection)),
    [filterSelection],
  );

  /** Chip counts follow the campaign filter but not the status filter. */
  const countsByStatus = useMemo(
    () => countCreatorsByLifecycleStatus(allCreators, filterSelection.campaign),
    [filterSelection.campaign],
  );

  /**
   * The two status panels are scoped to the selected campaign but ignore the
   * status filter, since they answer "what needs chasing on this campaign"
   * rather than "what is in the table". This mirrors the prototype and is
   * open question Q22.
   */
  const creatorsInCampaign = useMemo(
    () => filterCreatorsByCampaign(allCreators, filterSelection.campaign),
    [filterSelection.campaign],
  );
  const creatorsAwaitingPayment = creatorsInCampaign.filter(isAwaitingPayment);
  const creatorsPaidButUndelivered =
    creatorsInCampaign.filter(isPaidButUndelivered);

  /**
   * Each campaign sets its own target. With every campaign in view there is
   * no single target, so the figures fall back to a default — open question
   * Q21.
   */
  const selectedCampaign = campaigns.find(
    (campaign) => campaign.name === filterSelection.campaign,
  );
  const targetCostPerInstall =
    selectedCampaign?.targetCostPerInstall ?? DEFAULT_TARGET_COST_PER_INSTALL;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-8 pb-12 pt-7">
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
        targetCostPerInstall={targetCostPerInstall}
        onSelectCreator={onSelectCreator}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="px-5.5 py-5">
          <div className="mb-4 flex items-baseline justify-between">
            <SectionTitle>
              Installs <span className="text-amber">over time</span>
            </SectionTitle>
            <div className="text-[12px] text-ink-muted">
              Dashed lines mark stream days · last 6 weeks
            </div>
          </div>

          <InstallsOverTimeChart
            dailyInstallCounts={dailyInstallCounts}
            streamDayMarkers={streamDayMarkers}
            weekLabels={chartWeekLabels}
          />
        </Panel>

        <div className="grid gap-6">
          <DeliveredPaymentOpenPanel
            creators={creatorsAwaitingPayment}
            totalOutstandingBalance={
              calculateCampaignSummary(creatorsAwaitingPayment)
                .totalOutstandingBalance
            }
          />

          <PaidNotDeliveredPanel creators={creatorsPaidButUndelivered} />
        </div>
      </div>
    </div>
  );
}

/** Re-exported so the filter sentinel is available to callers of this screen. */
export { EVERY_CAMPAIGN };
