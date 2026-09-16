import type { Creator } from '@/data/types'
import { Button, PlatformTag } from '@/ui'

/**
 * Who this creator is, and the code everything about them is tracked by.
 *
 * The code gets its own amber-framed box rather than sitting in the meta row:
 * it is the one value on this screen the team reads out loud to someone, and
 * the design gives it that weight everywhere it appears.
 *
 * The wide layout's header. On a phone the masthead carries the way back and
 * the screen draws its own, shorter header.
 */
export function CreatorDetailHeader({
  creator,
  campaignName,
  onBack,
  onEditCreator,
  onDiscardCreator,
}: {
  creator: Creator
  /** Looked up by the screen: a creator holds only the campaign's id. */
  campaignName: string
  onBack: () => void
  /** Opens the add/edit creator modal, prefilled. Disabled when absent. */
  onEditCreator?: (creator: Creator) => void
  /** Offers to throw the record away. Whether it can go is Q51's rule. */
  onDiscardCreator?: () => void
}) {
  return (
    <div>
      <Button variant="text" onClick={onBack} className="mb-5">
        ← All creators
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-[1px] text-ink text-shadow-stencil">
            {creator.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[14px] text-ink-muted">
            <PlatformTag platform={creator.platform} />
            <span>{campaignName}</span>
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
            <div className="text-[10px] uppercase tracking-[2px] text-ink-muted">Code</div>
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

          {/* Red rather than grey, because it destroys a record -- but an
              outline rather than a fill, because it is an offer, not the
              confirmation. The solid red is on the dialog it opens. */}
          {onDiscardCreator && (
            <Button variant="dangerOutline" onClick={onDiscardCreator}>
              Discard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
