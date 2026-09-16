import type { Campaign, CreatorLifecycleStatus } from '@/data/types'
import {
  ARCHIVED_ONLY,
  EVERY_CAMPAIGN,
  EVERY_STATUS,
  type CampaignFilter,
  type LifecycleStatusFilter,
} from '@/domain/creatorFiltering'
import { Button, FilterSheetOption, FilterSheetSection, Modal } from '@/ui'

/**
 * The phone overview's filters, in a sheet: which campaign, and which point in
 * the lifecycle, as the phone design lays them out.
 *
 * A choice applies the moment it is tapped, so the list behind the sheet is
 * already narrowed when it closes; the button at the bottom says how many
 * creators that leaves, which is the reason for looking before closing.
 *
 * The status counts follow the campaign and ignore the status, as the chips
 * on the wide layout do, so every option says what it would reveal.
 */

const STATUS_OPTIONS: { status: CreatorLifecycleStatus; label: string }[] = [
  { status: 'prospect', label: 'Prospect' },
  { status: 'contracted', label: 'Contracted' },
  { status: 'active', label: 'Active' },
  { status: 'completed', label: 'Completed' },
]

export function CreatorFilterSheet({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  selectedStatus,
  onSelectStatus,
  countsByStatus,
  matchingCreatorCount,
  onEditSelectedCampaign,
  onClose,
}: {
  campaigns: Campaign[]
  selectedCampaign: CampaignFilter
  onSelectCampaign: (campaign: CampaignFilter) => void
  selectedStatus: LifecycleStatusFilter
  onSelectStatus: (status: LifecycleStatusFilter) => void
  countsByStatus: Record<CreatorLifecycleStatus, number> & { total: number; archived: number }
  /** How many creators the filters leave in the list, search included. */
  matchingCreatorCount: number
  /**
   * Edits the campaign in view. The phone design has no place for it, and
   * the chips that carried it on the wide layout are gone here, so it sits
   * by the campaigns it belongs to.
   */
  onEditSelectedCampaign?: () => void
  onClose: () => void
}) {
  return (
    <Modal
      title="Filter"
      labelId="creator-filter-title"
      onClose={onClose}
      titleAction={
        <button
          type="button"
          onClick={() => {
            onSelectCampaign(EVERY_CAMPAIGN)
            onSelectStatus(EVERY_STATUS)
          }}
          className="min-h-9 cursor-pointer whitespace-nowrap border-none bg-transparent py-1.5 text-[13px] uppercase tracking-[1px] text-ink-muted hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
        >
          Clear all
        </button>
      }
      footer={
        <Button variant="primary" size="block" onClick={onClose} className="mt-1.5">
          Show {matchingCreatorCount} {matchingCreatorCount === 1 ? 'creator' : 'creators'}
        </Button>
      }
    >
      <FilterSheetSection
        title="Campaign"
        className="mb-5.5"
        action={
          onEditSelectedCampaign && (
            <button
              type="button"
              onClick={onEditSelectedCampaign}
              className="cursor-pointer border-none bg-transparent p-0 text-[12px] uppercase tracking-[1px] text-ink-muted hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
            >
              Edit campaign
            </button>
          )
        }
      >
        <FilterSheetOption
          label="All campaigns"
          isSelected={selectedCampaign === EVERY_CAMPAIGN}
          onClick={() => onSelectCampaign(EVERY_CAMPAIGN)}
        />
        {campaigns.map((campaign) => (
          <FilterSheetOption
            key={campaign.id}
            label={campaign.name}
            isSelected={selectedCampaign === campaign.id}
            onClick={() => onSelectCampaign(campaign.id)}
          />
        ))}
      </FilterSheetSection>

      <FilterSheetSection title="Status">
        <FilterSheetOption
          label="All statuses"
          count={countsByStatus.total}
          isSelected={selectedStatus === EVERY_STATUS}
          onClick={() => onSelectStatus(EVERY_STATUS)}
        />
        {STATUS_OPTIONS.map((option) => (
          <FilterSheetOption
            key={option.status}
            label={option.label}
            count={countsByStatus[option.status]}
            isSelected={selectedStatus === option.status}
            onClick={() => onSelectStatus(option.status)}
          />
        ))}

        {/* The shelf, once anything is on it. */}
        {countsByStatus.archived > 0 && (
          <FilterSheetOption
            label="Archived"
            count={countsByStatus.archived}
            isSelected={selectedStatus === ARCHIVED_ONLY}
            onClick={() => onSelectStatus(ARCHIVED_ONLY)}
          />
        )}
      </FilterSheetSection>
    </Modal>
  )
}
