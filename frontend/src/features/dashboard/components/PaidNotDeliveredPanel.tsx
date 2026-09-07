import type { Creator } from '../../../data/types'
import { getAmountPaid, getUndeliveredStreamCount } from '../../../domain/creatorCalculations'
import { formatMoney } from '../../../lib/format'
import { Panel, SectionTitle } from '../../../ui'

/**
 * The mirror image of the payment-open panel: creators who have taken money
 * but still owe streams. Read-only — the team chases these by hand, there is
 * nothing to record here.
 */
export function PaidNotDeliveredPanel({ creators }: { creators: Creator[] }) {
  return (
    <Panel className="px-5 py-4.5">
      <SectionTitle size="small" className="mb-3">
        Paid, not delivered
      </SectionTitle>

      {creators.length === 0 && (
        <div className="border-t border-hair-3 pt-3 text-[14px] text-ink-muted">
          Nobody is behind on their committed streams.
        </div>
      )}

      {creators.map((creator) => {
        const streamsStillDue = getUndeliveredStreamCount(creator)

        return (
          <div
            key={creator.id}
            className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 border-t border-hair-3 py-2 text-[14px]"
          >
            <span>{creator.name}</span>
            <span className="text-ink-muted">
              {formatMoney(getAmountPaid(creator))} paid · {streamsStillDue} stream
              {streamsStillDue === 1 ? '' : 's'} due
            </span>
          </div>
        )
      })}
    </Panel>
  )
}
