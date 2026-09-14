import type { Campaign } from '@/data/types'
import { EVERY_CAMPAIGN, type CampaignFilter } from '@/domain/creatorFiltering'
import { Button, FilterSheetOption, FilterSheetSection, Modal } from '@/ui'

/**
 * The phone ledger's campaign filter, in a sheet, as the phone design lays it
 * out. The dates stay on the screen beside the button, where they are typed
 * against a statement, so the sheet holds only what is chosen from a list.
 *
 * Clear all clears the dates too: it is the one control that promises the
 * whole ledger back, and a range left behind would break that promise
 * somewhere the sheet does not show.
 */
export function LedgerFilterSheet({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  onClearAll,
  matchingPaymentCount,
  onClose,
}: {
  campaigns: Campaign[]
  selectedCampaign: CampaignFilter
  onSelectCampaign: (campaign: CampaignFilter) => void
  /** Clears the campaign and the date range. */
  onClearAll: () => void
  /** How many payments the filters leave in the ledger, search included. */
  matchingPaymentCount: number
  onClose: () => void
}) {
  return (
    <Modal
      title="Filter"
      labelId="ledger-filter-title"
      onClose={onClose}
      titleAction={
        <button
          type="button"
          onClick={onClearAll}
          className="min-h-9 cursor-pointer whitespace-nowrap border-none bg-transparent py-1.5 text-[13px] uppercase tracking-[1px] text-ink-muted hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
        >
          Clear all
        </button>
      }
      footer={
        <Button variant="primary" size="block" onClick={onClose} className="mt-1.5">
          Show {matchingPaymentCount} {matchingPaymentCount === 1 ? 'payment' : 'payments'}
        </Button>
      }
    >
      <FilterSheetSection title="Campaign">
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
    </Modal>
  )
}
