import type { Creator } from '@/data/types'
import { getArchiveBlockers } from '@/domain/creatorArchive'
import { getOutstandingBalance } from '@/domain/creatorCalculations'
import { formatPaymentAmount } from '@/lib/format'
import { Button, dialogActionsClasses, Modal } from '@/ui'

/**
 * Taking a creator out of the roster once their work is over.
 *
 * Like the discard dialog, it opens either way and says why when the answer
 * is no — here there is only one reason, and it is the one that matters:
 * money still owed. Q51.
 */
export function ArchiveCreatorModal({
  creator,
  onConfirm,
  onClose,
}: {
  creator: Creator
  onConfirm: () => void
  onClose: () => void
}) {
  const blockers = getArchiveBlockers(creator)

  if (blockers.length > 0) {
    return (
      <Modal
        title="Cannot archive"
        subtitle={`${creator.name} is still owed money`}
        labelId="archive-creator-title"
        width="narrow"
        onClose={onClose}
        footer={
          <div className="flex justify-end">
            <Button variant="cancel" size="sheet" onClick={onClose} className="md:w-auto">
              Close
            </Button>
          </div>
        }
      >
        <div className="border border-hair bg-sunk-2 px-4 py-3.5 text-[14px]">
          <span className="text-ink-muted">Open balance</span>
          <span className="ml-3 font-semibold text-bad">
            {formatPaymentAmount(getOutstandingBalance(creator))}
          </span>
        </div>

        <p className="mt-4 text-[14px] text-ink-muted">
          Archiving says the work is finished, and a debt says it is not. An archived creator leaves
          the roster, which is where anyone would go looking for someone to pay.
        </p>

        <p className="mt-3 text-[13px] text-ink-muted">
          Record the payment that settles them, or reverse what was agreed, and then archive.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      title="Archive creator"
      subtitle={`${creator.name} · ${creator.creatorCode}`}
      labelId="archive-creator-title"
      width="narrow"
      onClose={onClose}
      footer={
        <div className={dialogActionsClasses}>
          <Button variant="cancel" size="sheet" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sheet" onClick={onConfirm}>
            Archive creator
          </Button>
        </div>
      }
    >
      <p className="text-[14px] text-ink-muted">
        {creator.name} leaves the roster and the status filters. Nothing else changes: their
        payments stay in the ledger, their installs and spend stay in the campaign&rsquo;s figures,
        and <span className="font-mono text-amber">{creator.creatorCode}</span> stays theirs.
      </p>

      <p className="mt-3 text-[13px] text-ink-muted">
        They can be found again under the Archived filter, and restored from their own screen.
      </p>
    </Modal>
  )
}
