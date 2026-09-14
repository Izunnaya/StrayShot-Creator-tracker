import type { Campaign } from '@/data/types'
import { EVERY_CAMPAIGN, type CampaignFilter } from '@/domain/creatorFiltering'
import { Button, FilterChip, Label } from '@/ui'

/**
 * Which campaign the dashboard is showing. Everything below this row — the
 * figures, the table, the status panels — is scoped by the selection here.
 *
 * Editing is offered only when a single campaign is in view, since that is
 * the only time there is one campaign to mean. Creating is offered only where
 * the screen can handle it -- the ledger filters by campaign without owning
 * them, and a button that does nothing when pressed is worse than no button.
 */
export function CampaignFilterChipRow({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  canEditSelectedCampaign,
  onCreateCampaign,
  onEditSelectedCampaign,
}: {
  campaigns: Campaign[]
  selectedCampaign: CampaignFilter
  onSelectCampaign: (campaign: CampaignFilter) => void
  canEditSelectedCampaign: boolean
  onCreateCampaign?: () => void
  onEditSelectedCampaign?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label className="mr-1.5">Campaign</Label>

      <FilterChip
        label="All campaigns"
        isSelected={selectedCampaign === EVERY_CAMPAIGN}
        onClick={() => onSelectCampaign(EVERY_CAMPAIGN)}
      />

      {campaigns.map((campaign) => (
        <FilterChip
          key={campaign.id}
          label={campaign.name}
          isSelected={selectedCampaign === campaign.id}
          onClick={() => onSelectCampaign(campaign.id)}
        />
      ))}

      {onCreateCampaign && (
        <Button variant="addNew" onClick={onCreateCampaign}>
          + New campaign
        </Button>
      )}

      {canEditSelectedCampaign && onEditSelectedCampaign && (
        <Button variant="text" onClick={onEditSelectedCampaign}>
          Edit campaign
        </Button>
      )}
    </div>
  )
}
