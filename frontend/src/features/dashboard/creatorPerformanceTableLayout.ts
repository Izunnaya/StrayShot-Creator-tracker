import type { CreatorTableColumnKey } from '@/domain/creatorSorting'

// Shared column proportions preserve header and cell alignment.
export const CREATOR_TABLE_COLUMN_WEIGHTS = [1.5, 0.95, 0.8, 0.65, 0.75, 0.9, 0.9, 0.8, 1.45, 0.95]
export const CREATOR_TABLE_MINIMUM_WIDTH_PX = 1320

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
