import { describe, expect, it } from 'vitest'
import { createTestCreator, createTestPayment } from '@/testing/createTestCreator'
import {
  archiveCreator,
  canArchiveCreator,
  filterArchived,
  filterOutArchived,
  getArchiveBlockers,
  isArchived,
  restoreCreator,
} from './creatorArchive'

const settled = createTestCreator({
  contractedAmountInCents: 100_000,
  payments: [createTestPayment({ amountInCents: 100_000 })],
})

describe('whether a creator can be archived', () => {
  it('allows it once they are square', () => {
    expect(getArchiveBlockers(settled)).toEqual([])
    expect(canArchiveCreator(settled)).toBe(true)
  })

  it('allows a prospect, who agreed to nothing and is owed nothing', () => {
    const prospect = createTestCreator({ contractedAmountInCents: 0, payments: [] })

    expect(canArchiveCreator(prospect)).toBe(true)
  })

  it('refuses while money is still owed', () => {
    const owed = createTestCreator({
      contractedAmountInCents: 100_000,
      payments: [createTestPayment({ amountInCents: 40_000 })],
    })

    expect(getArchiveBlockers(owed)).toEqual(['has-open-balance'])
  })

  it('allows it for an overpaid creator, who is owed nothing', () => {
    const overpaid = createTestCreator({
      contractedAmountInCents: 100_000,
      payments: [createTestPayment({ amountInCents: 120_000 })],
    })

    expect(canArchiveCreator(overpaid)).toBe(true)
  })
})

describe('archiving and restoring', () => {
  it('records the day they left the roster, and takes it back on restore', () => {
    const archived = archiveCreator(settled, '2026-09-16')

    expect(isArchived(archived)).toBe(true)
    expect(archived.archivedOn).toBe('2026-09-16')
    expect(isArchived(restoreCreator(archived))).toBe(false)
    expect(restoreCreator(archived)).not.toHaveProperty('archivedOn')
  })

  it('changes nothing else, so the ledger and the figures still hold', () => {
    const archived = archiveCreator(settled, '2026-09-16')

    expect(archived.payments).toEqual(settled.payments)
    expect(archived.creatorCode).toBe(settled.creatorCode)
    expect(archived.contractedAmountInCents).toBe(settled.contractedAmountInCents)
  })

  it('leaves the creator it was given alone', () => {
    archiveCreator(settled, '2026-09-16')

    expect(isArchived(settled)).toBe(false)
  })
})

describe('the roster and the shelf', () => {
  const roster = [settled, archiveCreator(createTestCreator({ id: 2 }), '2026-09-16')]

  it('splits one list into the two', () => {
    expect(filterOutArchived(roster).map((creator) => creator.id)).toEqual([1])
    expect(filterArchived(roster).map((creator) => creator.id)).toEqual([2])
  })
})
