import type { Campaign } from '../../../data/types'
import { EVERY_CAMPAIGN, type CampaignFilter } from '../../../domain/creatorFiltering'
import { Button, FilterChip, Label } from '../../../ui'

/**
 * Which campaign the dashboard is showing. Everything below this row — the
 * figures, the table, the status panels — is scoped by the selection here.
 *
 * The New campaign and Edit campaign controls are rendered but not yet
 * connected; the campaign modal is Module 1's frontend work (tasks 1.12-1.14).
 */
export function CampaignFilterChipRow({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  canEditSelectedCampaign,
}: {
  campaigns: Campaign[]
  selectedCampaign: CampaignFilter
  onSelectCampaign: (campaign: CampaignFilter) => void
  canEditSelectedCampaign: boolean
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
          isSelected={selectedCampaign === campaign.name}
          onClick={() => onSelectCampaign(campaign.name)}
        />
      ))}

      <Button variant="addNew">+ New campaign</Button>

      {canEditSelectedCampaign && <Button variant="text">Edit campaign</Button>}
    </div>
  )
}
