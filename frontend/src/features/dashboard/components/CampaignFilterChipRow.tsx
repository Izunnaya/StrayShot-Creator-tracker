import type { ReactNode } from 'react'
import type { Campaign } from '@/data/types'
import { EVERY_CAMPAIGN, type CampaignFilter } from '@/domain/creatorFiltering'
import { usePhoneLayout } from '@/lib/usePhoneLayout'
import { Button, FilterChip, Label } from '@/ui'

/**
 * Which campaign the dashboard is showing. Everything below this row — the
 * figures, the table, the status panels — is scoped by the selection here.
 *
 * Editing is offered only when a single campaign is in view, since that is
 * the only time there is one campaign to mean. Creating is offered only where
 * the screen can handle it -- the ledger filters by campaign without owning
 * them, and a button that does nothing when pressed is worse than no button.
 *
 * From md up the search leads the row, the chips follow, and the ledger's
 * date range comes after, all as items of one wrapping row as the design
 * lays them out. On a phone the search takes a line of its own, the chips
 * wrap onto as many lines as they need without their caption, and the dates
 * come after. The chip group is `display: contents` from md up, which is what
 * lets its chips rejoin the wrapping row there.
 *
 * The mobile design scrolls the chips sideways instead. It is not followed:
 * with the scrollbar hidden, the selected campaign, + Campaign and Edit
 * campaign all sat past the edge of a 390px screen with nothing to say they
 * were there.
 */
export function CampaignFilterChipRow({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  canEditSelectedCampaign,
  onCreateCampaign,
  onEditSelectedCampaign,
  leading,
  trailing,
}: {
  campaigns: Campaign[]
  selectedCampaign: CampaignFilter
  onSelectCampaign: (campaign: CampaignFilter) => void
  canEditSelectedCampaign: boolean
  onCreateCampaign?: () => void
  onEditSelectedCampaign?: () => void
  /** Placed before the chips: the screen's search. */
  leading?: ReactNode
  /** Placed after the chips and their controls. */
  trailing?: ReactNode
}) {
  const isPhone = usePhoneLayout()

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-2">
      {leading}

      <div className="flex flex-wrap gap-2 md:contents">
        <Label className="mr-1.5 hidden md:block">Campaign</Label>

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
          <Button variant="addNew" onClick={onCreateCampaign} className="shrink-0">
            {isPhone ? '+ Campaign' : '+ New campaign'}
          </Button>
        )}

        {canEditSelectedCampaign && onEditSelectedCampaign && (
          <Button
            variant="text"
            onClick={onEditSelectedCampaign}
            className="shrink-0 md:px-1 md:py-1.5 md:text-[12px]"
          >
            Edit campaign
          </Button>
        )}
      </div>

      {trailing}
    </div>
  )
}
