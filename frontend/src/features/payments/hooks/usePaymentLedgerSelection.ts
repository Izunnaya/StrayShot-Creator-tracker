import { useState } from 'react'
import type { CampaignFilter } from '@/domain/creatorFiltering'
import {
  DEFAULT_LEDGER_SORT,
  ledgerSortAfterColumnClick,
  nextLedgerSort,
  UNFILTERED_LEDGER,
  type LedgerFilter,
  type LedgerSortColumn,
  type LedgerSortSelection,
} from '@/domain/paymentLedger'

/**
 * Holds what the ledger is narrowed to and how it is ordered.
 *
 * Kept by the app shell rather than the screen, so it survives a trip to a
 * creator and back as the dashboard's does. It is separate from the
 * dashboard's on purpose: narrowing one screen is not an instruction about the
 * other. The rules for what a click does live in the domain; this only stores
 * the result.
 */
export function usePaymentLedgerSelection() {
  const [filter, setFilter] = useState<LedgerFilter>(UNFILTERED_LEDGER)
  const [sort, setSort] = useState<LedgerSortSelection>(DEFAULT_LEDGER_SORT)

  const update = (changes: Partial<LedgerFilter>) =>
    setFilter((current) => ({ ...current, ...changes }))

  return {
    filter,
    sort,
    selectCampaign: (campaign: CampaignFilter) => update({ campaign }),
    setSearchText: (searchText: string) => update({ searchText }),
    setPaidFrom: (paidFrom: string) => update({ paidFrom }),
    setPaidTo: (paidTo: string) => update({ paidTo }),
    handleColumnClick: (column: LedgerSortColumn) =>
      setSort((current) => ledgerSortAfterColumnClick(current, column)),
    stepSort: () => setSort(nextLedgerSort),
  }
}
