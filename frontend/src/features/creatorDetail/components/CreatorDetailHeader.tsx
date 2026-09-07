import type { Creator } from '../../../data/types'
import { Button, Label, PlatformTag } from '../../../ui'

/**
 * Who this creator is, and the code everything about them is tracked by.
 *
 * The code gets its own amber-framed box rather than sitting in the meta row:
 * it is the one value on this screen the team reads out loud to someone, and
 * the design gives it that weight everywhere it appears.
 */
export function CreatorDetailHeader({
  creator,
  onBack,
  onEditCreator,
}: {
  creator: Creator
  onBack: () => void
  /**
   * Opens the add/edit creator modal, prefilled. That modal is Module 4, so
   * until it exists the control renders disabled — see task 3.13.
   */
  onEditCreator?: (creator: Creator) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button variant="text" onClick={onBack} className="px-0">
          ← All creators
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-[1px] text-ink text-shadow-stencil">
            {creator.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[14px] text-ink-muted">
            <PlatformTag platform={creator.platform} />
            <span>{creator.campaignName}</span>
            <span>{creator.audienceSize} subscribers</span>
            <a
              href={`https://${creator.channelUrl}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink-muted hover:text-amber"
            >
              {creator.channelUrl}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="border border-amber px-4.5 py-2.5 text-center">
            <Label>Code</Label>
            <div className="font-head text-[22px] font-semibold tracking-[3px] text-amber">
              {creator.creatorCode}
            </div>
          </div>

          <Button
            variant="secondary"
            disabled={onEditCreator === undefined}
            onClick={onEditCreator ? () => onEditCreator(creator) : undefined}
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}
