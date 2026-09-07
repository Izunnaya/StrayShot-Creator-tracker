import type { Stream } from '../../../data/types'
import { formatDateWithoutYear, formatNumber } from '../../../lib/format'

/**
 * Every stream detected for this creator, newest first.
 *
 * Nothing here is editable, and deliberately so: these rows come from the
 * YouTube and Twitch integrations rather than from anyone typing them in, so
 * the table is a record of what happened, not a form.
 *
 * Below the minimum width the table scrolls sideways inside its own box
 * rather than compressing, which is the same rule the creator performance
 * table follows: stream titles and view counts stop being readable long
 * before they stop fitting.
 */

const STREAM_TABLE_COLUMN_WIDTHS = 'grid-cols-[0.9fr_2.2fr_0.8fr_0.9fr_0.9fr_0.8fr]'
const STREAM_TABLE_MINIMUM_WIDTH_PX = 720

export function StreamHistoryTable({ streams }: { streams: Stream[] }) {
  return (
    <div className="overflow-x-auto border border-hair bg-panel">
      <div
        className={`grid ${STREAM_TABLE_COLUMN_WIDTHS} border-b border-hair bg-panel-head px-4.5 py-2.5 text-[11px] uppercase tracking-[1.5px] text-ink-muted`}
        style={{ minWidth: STREAM_TABLE_MINIMUM_WIDTH_PX }}
      >
        <div>Date</div>
        <div>Title</div>
        <div>Platform</div>
        <div className="text-right">Views</div>
        <div className="text-right">Peak</div>
        <div className="text-right">Installs</div>
      </div>

      {streams.map((stream) => (
        <div
          key={stream.id}
          className={`grid ${STREAM_TABLE_COLUMN_WIDTHS} border-t border-hair-4 px-4.5 py-2.75 text-[14px]`}
          style={{ minWidth: STREAM_TABLE_MINIMUM_WIDTH_PX }}
        >
          <div className="text-ink-muted">{formatDateWithoutYear(stream.streamedOn)}</div>
          <div className="pr-3">{stream.title}</div>
          <div className="text-ink-muted">{stream.platform}</div>
          <div className="text-right">{formatNumber(stream.views)}</div>
          <div className="text-right text-ink-muted">
            {formatNumber(stream.peakConcurrentViewers)}
          </div>
          <div className="text-right font-semibold">{formatNumber(stream.installsAttributed)}</div>
        </div>
      ))}

      {streams.length === 0 && (
        <div className="border-t border-hair-4 px-4.5 py-5 text-[14px] text-ink-muted">
          No streams detected yet. They appear here automatically once this creator goes live.
        </div>
      )}
    </div>
  )
}
