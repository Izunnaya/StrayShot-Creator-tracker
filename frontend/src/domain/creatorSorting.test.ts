import { describe, expect, it } from 'vitest'
import { creators as fixtureCreators } from '@/data/fixtures'
import { createTestCreator, createTestPayment } from '@/testing/createTestCreator'
import {
  DEFAULT_SORT_SELECTION,
  getInitialDirectionForColumn,
  selectionAfterColumnClick,
  sortCreators,
} from './creatorSorting'

const bigSpender = createTestCreator({
  id: 1,
  name: 'Zara',
  creatorCode: 'ZARA',
  installsAttributed: 1000,
  totalViews: 500000,
  payments: [createTestPayment({ amount: 5000 })],
})

const bargain = createTestCreator({
  id: 2,
  name: 'Alex',
  creatorCode: 'ALEX',
  installsAttributed: 1000,
  totalViews: 100000,
  payments: [createTestPayment({ amount: 1000 })],
})

const neverPaid = createTestCreator({
  id: 3,
  name: 'Morgan',
  creatorCode: 'MORG',
  installsAttributed: 800,
  totalViews: 300000,
  payments: [],
})

const testCreators = [bigSpender, bargain, neverPaid]

const namesAfterSorting = (selection: Parameters<typeof sortCreators>[1]) =>
  sortCreators(testCreators, selection).map((creator) => creator.name)

describe('sortCreators', () => {
  it('sorts numeric columns smallest first when ascending', () => {
    expect(namesAfterSorting({ column: 'totalViews', direction: 'ascending' })).toEqual([
      'Alex',
      'Morgan',
      'Zara',
    ])
  })

  it('sorts numeric columns largest first when descending', () => {
    expect(namesAfterSorting({ column: 'totalViews', direction: 'descending' })).toEqual([
      'Zara',
      'Morgan',
      'Alex',
    ])
  })

  it('sorts text columns alphabetically', () => {
    expect(namesAfterSorting({ column: 'name', direction: 'ascending' })).toEqual([
      'Alex',
      'Morgan',
      'Zara',
    ])
  })

  it('sorts on money paid rather than the contracted amount', () => {
    expect(namesAfterSorting({ column: 'amountPaid', direction: 'descending' })).toEqual([
      'Zara',
      'Alex',
      'Morgan',
    ])
  })

  it('puts creators with no measurable cost per install last, not first', () => {
    // The regression this whole design exists to prevent: an unpaid creator
    // must not appear at the top of a cheapest-first list.
    expect(namesAfterSorting({ column: 'costPerInstall', direction: 'ascending' })).toEqual([
      'Alex',
      'Zara',
      'Morgan',
    ])
  })

  it('returns a new array and leaves the original order alone', () => {
    const sorted = sortCreators(testCreators, { column: 'name', direction: 'ascending' })

    expect(sorted).not.toBe(testCreators)
    expect(testCreators.map((creator) => creator.name)).toEqual(['Zara', 'Alex', 'Morgan'])
  })
})

describe('getInitialDirectionForColumn', () => {
  it('opens text columns A to Z', () => {
    expect(getInitialDirectionForColumn('name')).toBe('ascending')
    expect(getInitialDirectionForColumn('creatorCode')).toBe('ascending')
  })

  it('opens performance figures with the biggest first', () => {
    expect(getInitialDirectionForColumn('installsAttributed')).toBe('descending')
    expect(getInitialDirectionForColumn('totalViews')).toBe('descending')
    expect(getInitialDirectionForColumn('amountPaid')).toBe('descending')
  })

  it('opens cost per install cheapest first, because cheap is good', () => {
    expect(getInitialDirectionForColumn('costPerInstall')).toBe('ascending')
  })
})

describe('selectionAfterColumnClick', () => {
  it('switches to a new column in that column’s natural direction', () => {
    const selection = selectionAfterColumnClick(DEFAULT_SORT_SELECTION, 'installsAttributed')

    expect(selection).toEqual({ column: 'installsAttributed', direction: 'descending' })
  })

  it('reverses the column that is already sorted', () => {
    const firstClick = selectionAfterColumnClick(DEFAULT_SORT_SELECTION, 'installsAttributed')
    const secondClick = selectionAfterColumnClick(firstClick, 'installsAttributed')

    expect(secondClick).toEqual({ column: 'installsAttributed', direction: 'ascending' })
  })

  it('toggles back and forth on repeated clicks of the same column', () => {
    // First click selects the column in its natural direction; each click
    // after that flips it, so the team can never get stuck on one direction.
    const firstClick = selectionAfterColumnClick(DEFAULT_SORT_SELECTION, 'name')
    const secondClick = selectionAfterColumnClick(firstClick, 'name')
    const thirdClick = selectionAfterColumnClick(secondClick, 'name')

    expect(firstClick.direction).toBe('ascending')
    expect(secondClick.direction).toBe('descending')
    expect(thirdClick.direction).toBe('ascending')
  })

  it('does not change the selection it was given', () => {
    const original = { ...DEFAULT_SORT_SELECTION }
    selectionAfterColumnClick(DEFAULT_SORT_SELECTION, 'totalViews')

    expect(DEFAULT_SORT_SELECTION).toEqual(original)
  })
})

describe('the fixture data in the table', () => {
  it('opens on cost per install, cheapest first', () => {
    expect(DEFAULT_SORT_SELECTION).toEqual({ column: 'costPerInstall', direction: 'ascending' })
  })

  it('puts NovaKess at the top and the unpaid QuietStorm at the bottom', () => {
    const codes = sortCreators(fixtureCreators, DEFAULT_SORT_SELECTION).map(
      (creator) => creator.creatorCode,
    )

    expect(codes[0]).toBe('NOVA')
    expect(codes.at(-1)).toBe('STORM')
  })

  it('ranks the whole table by what each install actually cost', () => {
    const codes = sortCreators(fixtureCreators, DEFAULT_SORT_SELECTION).map(
      (creator) => creator.creatorCode,
    )

    expect(codes).toEqual([
      'NOVA',
      'GRIM',
      'RAZE',
      'MARA',
      'TORQ',
      'DEE',
      'SABLE',
      'MIRA',
      'HOLO',
      'LOTUS',
      'KODA',
      'VEXA',
      'BLUNT',
      'STORM',
    ])
  })
})
