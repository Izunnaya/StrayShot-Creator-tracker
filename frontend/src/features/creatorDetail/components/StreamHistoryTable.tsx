import type { Stream } from '../../../data/types'
import { formatDateWithoutYear, formatNumber } from '../../../lib/format'
import { PlatformTag } from '../../../ui'

/**
 * Every stream detected for this creator, newest first.
 *
 * Nothing here is editable, and deliberately so: these rows come from the
 * YouTube and Twitch integrations rather than from anyone typing them in, so
 * the table is a record of what happened, not a form.
 *
 * Two layouts, one set of markup. From sm up it is the six-column table the
 * design specifies, scrolling sideways below its minimum width rather than
 * compressing. On a phone it reflows instead: the row becomes date and
 * platform, then the title, then the three figures side by side under their
 * own labels. A phone-width table would have put views, peak and installs
 * behind a horizontal scroll with no visible scrollbar, which is a good way
 * to hide the numbers people came to read.
 */

const STREAM_TABLE_COLUMN_WIDTHS = 'sm:grid-cols-[0.9fr_2.2fr_0.8fr_0.9fr_0.9fr_0.8fr]'
const STREAM_TABLE_MINIMUM_WIDTH = 'sm:min-w-[720px]'

/** Column heading shown above each figure only while the row is stacked. */
function StackedLabel({ children }: { children: string }) {
  return (
    <span className="block text-[10px] uppercase tracking-[1px] text-ink-faint sm:hidden">
      {children}
    </span>
  )
}

export function StreamHistoryTable({ streams }: { streams: Stream[] }) {
  return (
    <div className="overflow-x-auto border border-hair bg-panel">
      <div
        className={`hidden border-b border-hair bg-panel-head px-4.5 py-2.5 text-[11px] uppercase tracking-[1.5px] text-ink-muted sm:grid ${STREAM_TABLE_COLUMN_WIDTHS} ${STREAM_TABLE_MINIMUM_WIDTH}`}
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
          className={`grid grid-cols-3 gap-x-3 gap-y-2 border-t border-hair-4 px-4 py-3 text-[14px] sm:gap-0 sm:px-4.5 sm:py-2.75 ${STREAM_TABLE_COLUMN_WIDTHS} ${STREAM_TABLE_MINIMUM_WIDTH}`}
        >
          <div className="order-1 col-span-2 text-ink-muted sm:order-0 sm:col-span-1">
            {formatDateWithoutYear(stream.streamedOn)}
          </div>

          <div className="order-3 col-span-3 pr-3 sm:order-0 sm:col-span-1">{stream.title}</div>

          <div className="order-2 text-right sm:order-0 sm:text-left">
            <PlatformTag platform={stream.platform} />
          </div>

          <div className="order-4 sm:order-0 sm:text-right">
            <StackedLabel>Views</StackedLabel>
            {formatNumber(stream.views)}
          </div>

          <div className="order-5 text-ink-muted sm:order-0 sm:text-right">
            <StackedLabel>Peak</StackedLabel>
            {formatNumber(stream.peakConcurrentViewers)}
          </div>

          <div className="order-6 font-semibold sm:order-0 sm:text-right">
            <StackedLabel>Installs</StackedLabel>
            {formatNumber(stream.installsAttributed)}
          </div>
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
