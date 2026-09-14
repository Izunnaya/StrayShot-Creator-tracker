import type { CreatorLifecycleStatus } from '@/data/types'
import { EVERY_STATUS, type LifecycleStatusFilter } from '@/domain/creatorFiltering'
import { FilterChip, Label } from '@/ui'

/**
 * Narrows the creator table to one point in the lifecycle.
 *
 * Each chip carries the number of creators it would reveal. Those counts
 * respect the campaign filter but ignore the status filter, so every chip
 * stays informative rather than only the selected one showing a figure.
 *
 * On a phone the row scrolls sideways and drops its caption, as the campaign
 * chips above it do.
 */
const statusChips: { status: CreatorLifecycleStatus; label: string }[] = [
  { status: 'prospect', label: 'Prospect' },
  { status: 'contracted', label: 'Contracted' },
  { status: 'active', label: 'Active' },
  { status: 'completed', label: 'Completed' },
]

export function CreatorStatusFilterChipRow({
  selectedStatus,
  onSelectStatus,
  countsByStatus,
}: {
  selectedStatus: LifecycleStatusFilter
  onSelectStatus: (status: LifecycleStatusFilter) => void
  countsByStatus: Record<CreatorLifecycleStatus, number> & { total: number }
}) {
  return (
    <div className="scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:items-center md:overflow-visible md:px-0 md:pb-0">
      <Label className="mr-1.5 hidden md:block">Status</Label>

      <FilterChip
        label="All"
        count={countsByStatus.total}
        isSelected={selectedStatus === EVERY_STATUS}
        onClick={() => onSelectStatus(EVERY_STATUS)}
      />

      {statusChips.map((chip) => (
        <FilterChip
          key={chip.status}
          label={chip.label}
          count={countsByStatus[chip.status]}
          isSelected={selectedStatus === chip.status}
          onClick={() => onSelectStatus(chip.status)}
        />
      ))}
    </div>
  )
}
