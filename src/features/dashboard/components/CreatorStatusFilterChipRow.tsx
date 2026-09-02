import type { CreatorLifecycleStatus } from '../../../data/types'
import { EVERY_STATUS, type LifecycleStatusFilter } from '../../../domain/creatorFiltering'
import { FilterChip, Label } from '../../../ui'

/**
 * Narrows the creator table to one point in the lifecycle.
 *
 * Each chip carries the number of creators it would reveal. Those counts
 * respect the campaign filter but ignore the status filter, so every chip
 * stays informative rather than only the selected one showing a figure.
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
    <div className="flex flex-wrap items-center gap-2">
      <Label className="mr-1.5">Status</Label>

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
