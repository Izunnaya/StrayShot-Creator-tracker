import type { Creator } from '@/data/types'
import { getDiscardBlockers, type DiscardBlocker } from '@/domain/creatorDiscard'
import { Button, dialogActionsClasses, Modal } from '@/ui'

/**
 * Throwing away a creator record that should never have existed: a duplicate,
 * or a test entry.
 *
 * It opens whether or not the record can go. A button that does nothing when
 * pressed teaches nobody anything, and "why can I not delete this?" is the
 * question worth answering — so when the record has to stay, this says which
 * of the three things happened to it and offers no way through. Q51.
 */

const blockerText: Record<DiscardBlocker, string> = {
  'has-payments': 'Money has been recorded against them, and it is in the ledger.',
  'has-streams': 'Streams have been detected for them, which is the record of what they delivered.',
  'invite-claimed': 'They have claimed their portal account, so someone is using it.',
}

export function DiscardCreatorModal({
  creator,
  streamCount,
  onConfirm,
  onClose,
}: {
  creator: Creator
  /** How many streams have been detected for them. */
  streamCount: number
  onConfirm: () => void
  onClose: () => void
}) {
  const blockers = getDiscardBlockers(creator, streamCount)

  if (blockers.length > 0) {
    return (
      <Modal
        title="Cannot discard"
        subtitle={`${creator.name} stays in the roster`}
        labelId="discard-creator-title"
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
        <ul className="flex list-none flex-col gap-2.5 text-[14px] text-ink-muted">
          {blockers.map((blocker) => (
            <li key={blocker} className="border border-hair bg-sunk-2 px-4 py-3">
              {blockerText[blocker]}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[13px] text-ink-muted">
          Discarding is only for a record nothing has happened to. Correct what is wrong by editing
          them instead — every field, including the code and the campaign, can be changed.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      title="Discard creator"
      subtitle={`${creator.name} · ${creator.creatorCode}`}
      labelId="discard-creator-title"
      width="narrow"
      onClose={onClose}
      footer={
        <div className={dialogActionsClasses}>
          <Button variant="cancel" size="sheet" onClick={onClose}>
            Keep them
          </Button>
          <Button variant="danger" size="sheet" onClick={onConfirm}>
            Discard creator
          </Button>
        </div>
      }
    >
      <p className="text-[14px] text-ink-muted">
        Nothing has been recorded against {creator.name}: no payments, no streams detected, and no
        claimed portal account. The record is removed for good, and their code{' '}
        <span className="font-mono text-amber">{creator.creatorCode}</span> becomes free for someone
        else.
      </p>

      <p className="mt-3 text-[13px] text-ink-muted">
        This cannot be undone. If you only need to correct something, edit them instead.
      </p>
    </Modal>
  )
}
