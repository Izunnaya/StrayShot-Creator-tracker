import type { Stream } from '@/data/types'
import { formatCountCompact, formatDateWithoutYear, formatNumber } from '@/lib/format'

/**
 * Every stream detected for this creator, newest first.
 *
 * Nothing here is editable, and deliberately so: these rows come from the
 * YouTube and Twitch integrations rather than from anyone typing them in, so
 * the table is a record of what happened, not a form.
 *
 * The table is the wide layout, scrolling sideways below its minimum width
 * rather than compressing. The phone layout uses the cards further down.
 */

const STREAM_TABLE_COLUMNS = 'grid-cols-[0.9fr_2.2fr_0.8fr_0.9fr_0.9fr_0.8fr] min-w-180'

const NO_STREAMS =
  'No streams detected yet. They appear here automatically once this creator goes live.'

export function StreamHistoryTable({ streams }: { streams: Stream[] }) {
  return (
    <div className="overflow-x-auto border border-hair bg-panel">
      <div
        className={`grid border-b border-hair bg-panel-head px-4.5 py-2.5 text-[11px] uppercase tracking-[1.5px] text-ink-muted ${STREAM_TABLE_COLUMNS}`}
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
          className={`grid border-t border-hair-4 px-4.5 py-2.75 text-[14px] ${STREAM_TABLE_COLUMNS}`}
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
          {NO_STREAMS}
        </div>
      )}
    </div>
  )
}

/** The phone layout: one card per stream, title first, with its two figures. */
export function StreamHistoryCards({ streams }: { streams: Stream[] }) {
  if (streams.length === 0) {
    return (
      <div className="border border-hair bg-panel px-3.75 py-4 text-[14px] text-ink-muted">
        {NO_STREAMS}
      </div>
    )
  }

  return (
    <ul className="flex list-none flex-col gap-2">
      {streams.map((stream) => (
        <li key={stream.id} className="border border-hair bg-panel px-3.75 py-3.25">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] text-ink">{stream.title}</span>
            <span className="whitespace-nowrap font-mono text-[12px] text-ink-muted">
              {formatDateWithoutYear(stream.streamedOn)}
            </span>
          </div>
          <div className="mt-2.25 flex gap-5 text-[12px] text-ink-dim">
            <span>
              Views{' '}
              <span className="font-mono text-ink-quiet">{formatCountCompact(stream.views)}</span>
            </span>
            <span>
              Installs{' '}
              <span className="font-mono text-amber">
                {formatCountCompact(stream.installsAttributed)}
              </span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
