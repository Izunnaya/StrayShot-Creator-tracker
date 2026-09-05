import type { CreatorTableColumnKey } from '../../domain/creatorSorting'

/**
 * The shape of the creator performance table, defined once and used by both
 * the header row and the data rows.
 *
 * This is deliberately shared rather than repeated: when the two grids were
 * defined separately in the design prototype they drifted apart twice, and
 * the headings ended up sitting over the wrong values.
 */

export const CREATOR_TABLE_COLUMN_WIDTHS =
  'grid-cols-[1.5fr_0.95fr_0.8fr_0.65fr_0.75fr_0.9fr_0.9fr_0.8fr_1.45fr_0.95fr]'

/**
 * Below this width the money columns start splitting mid-number, so the
 * table scrolls horizontally inside its panel instead of compressing.
 */
export const CREATOR_TABLE_MINIMUM_WIDTH_PX = 1320

/** Padding either side of the table, matched between header and rows. */
export const CREATOR_TABLE_HORIZONTAL_PADDING = 'px-4.5'

export interface CreatorTableColumn {
  /** What the column sorts on. Independent of the heading text. */
  key: CreatorTableColumnKey
  heading: string
}

export const CREATOR_TABLE_COLUMNS: CreatorTableColumn[] = [
  { key: 'name', heading: 'Creator' },
  { key: 'lifecycleStatus', heading: 'Status' },
  { key: 'platform', heading: 'Platform' },
  { key: 'creatorCode', heading: 'Code' },
  { key: 'streamsDelivered', heading: 'Streams' },
  { key: 'totalViews', heading: 'Views' },
  { key: 'peakConcurrentViewers', heading: 'Peak' },
  { key: 'installsAttributed', heading: 'Installs' },
  { key: 'amountPaid', heading: 'Paid / agreed' },
  { key: 'costPerInstall', heading: 'Cost / install' },
]
