import type { Stream } from '../../../data/types'
import { formatDateWithoutYear, formatNumber } from '../../../lib/format'

/**
 * Every stream detected for this creator, newest first.
 *
 * Nothing here is editable, and deliberately so: these rows come from the
 * YouTube and Twitch integrations rather than from anyone typing them in, so
 * the table is a record of what happened, not a form.
 */

const STREAM_TABLE_COLUMN_WIDTHS = 'grid-cols-[0.9fr_2.2fr_0.8fr_0.9fr_0.9fr_0.8fr]'

export function StreamHistoryTable({ streams }: { streams: Stream[] }) {
  return (
    <div className="border border-hair bg-panel">
      <div
        className={`grid ${STREAM_TABLE_COLUMN_WIDTHS} border-b border-hair bg-panel-head px-4.5 py-2.5 text-[11px] uppercase tracking-[1.5px] text-ink-muted`}
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
        >
          <div className="text-ink-muted">{formatDateWithoutYear(stream.streamedOn)}</div>
          <div>{stream.title}</div>
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
