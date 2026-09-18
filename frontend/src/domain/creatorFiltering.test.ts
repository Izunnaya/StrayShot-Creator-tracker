import { describe, expect, it } from 'vitest'
import { creators as fixtureCreators } from '@/data/fixtures'
import { createTestCreator, createTestPayment } from '@/testing/createTestCreator'
import { archiveCreator } from './creatorArchive'
import {
  ARCHIVED_ONLY,
  countCreatorsByLifecycleStatus,
  EVERY_CAMPAIGN,
  EVERY_STATUS,
  filterCreators,
  filterCreatorsByCampaign,
  filterCreatorsByLifecycleStatus,
  filterCreatorsBySearch,
} from './creatorFiltering'

/* The fixtures' two campaigns, and two of this file's own. Creators point at
   a campaign by id, so the names live here only to keep the tests readable. */
const WINTER_OFFENSIVE = 101
const SUMMER_PUSH = 102
const SEASON_2_LAUNCH = 1
const CLAN_WARS_UPDATE = 2

/** A creator on each campaign, at a different point in the lifecycle. */
const contractedOnWinter = createTestCreator({
  id: 1,
  name: 'Contracted Winter',
  campaignId: WINTER_OFFENSIVE,
  streamsCommitted: 2,
  streamsDelivered: 0,
})

const activeOnWinter = createTestCreator({
  id: 2,
  name: 'Active Winter',
  campaignId: WINTER_OFFENSIVE,
  streamsCommitted: 2,
  streamsDelivered: 1,
})

const completedOnSummer = createTestCreator({
  id: 3,
  name: 'Completed Summer',
  campaignId: SUMMER_PUSH,
  streamsCommitted: 1,
  streamsDelivered: 1,
  contractedAmountInCents: 100000,
  payments: [createTestPayment({ amountInCents: 100000 })],
})

const testCreators = [contractedOnWinter, activeOnWinter, completedOnSummer]

describe('filterCreatorsByCampaign', () => {
  it('keeps everyone when no campaign is selected', () => {
    expect(filterCreatorsByCampaign(testCreators, EVERY_CAMPAIGN)).toHaveLength(3)
  })

  it('keeps only the creators on the named campaign', () => {
    const winter = filterCreatorsByCampaign(testCreators, WINTER_OFFENSIVE)

    expect(winter.map((creator) => creator.name)).toEqual(['Contracted Winter', 'Active Winter'])
  })

  it('returns nothing for a campaign with no creators on it', () => {
    expect(filterCreatorsByCampaign(testCreators, 999)).toEqual([])
  })
})

describe('filterCreatorsByLifecycleStatus', () => {
  it('keeps everyone when no status is selected', () => {
    expect(filterCreatorsByLifecycleStatus(testCreators, EVERY_STATUS)).toHaveLength(3)
  })

  it('keeps only the creators at the chosen point in the lifecycle', () => {
    expect(filterCreatorsByLifecycleStatus(testCreators, 'active').map((c) => c.name)).toEqual([
      'Active Winter',
    ])
    expect(filterCreatorsByLifecycleStatus(testCreators, 'completed').map((c) => c.name)).toEqual([
      'Completed Summer',
    ])
  })

  it('returns nothing when no creator is at that point yet', () => {
    expect(filterCreatorsByLifecycleStatus(testCreators, 'prospect')).toEqual([])
  })
})

describe('archived creators through the status filter', () => {
  const withArchived = [...testCreators, archiveCreator(completedOnSummer, '2026-09-16')]

  it('hides them from every status, because they are out of the roster', () => {
    expect(filterCreatorsByLifecycleStatus(withArchived, EVERY_STATUS)).toHaveLength(3)
    expect(filterCreatorsByLifecycleStatus(withArchived, 'completed')).toHaveLength(1)
  })

  it('shows only them, and all of them, under the archived selection', () => {
    const archived = filterCreatorsByLifecycleStatus(withArchived, ARCHIVED_ONLY)

    expect(archived.map((creator) => creator.name)).toEqual(['Completed Summer'])
  })

  it('counts them beside the roster rather than within it', () => {
    const counts = countCreatorsByLifecycleStatus(withArchived, EVERY_CAMPAIGN)

    expect(counts.total).toBe(3)
    expect(counts.completed).toBe(1)
    expect(counts.archived).toBe(1)
  })
})

describe('filterCreatorsBySearch', () => {
  const searchable = [
    createTestCreator({ id: 1, name: 'IronLotus', creatorCode: 'LOTUS' }),
    createTestCreator({ id: 2, name: 'NovaKess', creatorCode: 'NOVA' }),
    createTestCreator({ id: 3, name: 'MiraPlays', creatorCode: 'MIRA' }),
  ]
  const namesFor = (searchText: string) =>
    filterCreatorsBySearch(searchable, searchText).map((creator) => creator.name)

  it('matches part of a name, ignoring case', () => {
    expect(namesFor('kess')).toEqual(['NovaKess'])
  })

  it('matches the code when the name gives no hint of it', () => {
    expect(namesFor('lotus')).toEqual(['IronLotus'])
    expect(namesFor('LOT')).toEqual(['IronLotus'])
  })

  it('ignores the spaces a pasted code arrives with', () => {
    expect(namesFor('  NOVA\t')).toEqual(['NovaKess'])
  })

  it('keeps everyone for an empty or blank search', () => {
    expect(namesFor('')).toHaveLength(3)
    expect(namesFor('   ')).toHaveLength(3)
  })

  it('returns nothing when nobody matches', () => {
    expect(namesFor('zzz')).toEqual([])
  })
})

describe('filterCreators', () => {
  it('applies the search on top of the campaign and status', () => {
    const result = filterCreators(testCreators, {
      campaign: WINTER_OFFENSIVE,
      lifecycleStatus: EVERY_STATUS,
      searchText: 'active',
    })

    expect(result.map((creator) => creator.name)).toEqual(['Active Winter'])
  })

  it('applies both filters together', () => {
    const result = filterCreators(testCreators, {
      campaign: WINTER_OFFENSIVE,
      lifecycleStatus: 'active',
    })

    expect(result.map((creator) => creator.name)).toEqual(['Active Winter'])
  })

  it('returns nothing when the two filters have no overlap', () => {
    const result = filterCreators(testCreators, {
      campaign: SUMMER_PUSH,
      lifecycleStatus: 'contracted',
    })

    expect(result).toEqual([])
  })

  it('leaves the original list untouched', () => {
    filterCreators(testCreators, { campaign: SUMMER_PUSH, lifecycleStatus: EVERY_STATUS })

    expect(testCreators).toHaveLength(3)
  })
})

describe('countCreatorsByLifecycleStatus', () => {
  it('counts every status within the selected campaign', () => {
    const counts = countCreatorsByLifecycleStatus(testCreators, WINTER_OFFENSIVE)

    expect(counts).toEqual({
      total: 2,
      prospect: 0,
      contracted: 1,
      active: 1,
      completed: 0,
      archived: 0,
    })
  })

  it('counts across every campaign when none is selected', () => {
    const counts = countCreatorsByLifecycleStatus(testCreators, EVERY_CAMPAIGN)

    expect(counts.total).toBe(3)
    expect(counts.completed).toBe(1)
  })

  it('keeps every chip informative by ignoring the status filter', () => {
    // The counts deliberately do not narrow when a status is selected —
    // otherwise picking "Active" would show a figure on that chip and zero on
    // all the others, which tells the team nothing about what else is there.
    const counts = countCreatorsByLifecycleStatus(testCreators, EVERY_CAMPAIGN)

    expect(counts.contracted).toBe(1)
    expect(counts.active).toBe(1)
    expect(counts.completed).toBe(1)
  })
})

describe('the fixture data through the filters', () => {
  it('splits 14 creators across the two campaigns', () => {
    expect(filterCreatorsByCampaign(fixtureCreators, SEASON_2_LAUNCH)).toHaveLength(7)
    expect(filterCreatorsByCampaign(fixtureCreators, CLAN_WARS_UPDATE)).toHaveLength(7)
    expect(filterCreatorsByCampaign(fixtureCreators, EVERY_CAMPAIGN)).toHaveLength(14)
  })

  it('counts 8 active and 6 completed overall', () => {
    const counts = countCreatorsByLifecycleStatus(fixtureCreators, EVERY_CAMPAIGN)

    expect(counts).toEqual({
      total: 14,
      prospect: 0,
      contracted: 0,
      active: 8,
      completed: 6,
      archived: 0,
    })
  })

  it('counts 3 active and 4 completed within Season 2 Launch', () => {
    const counts = countCreatorsByLifecycleStatus(fixtureCreators, SEASON_2_LAUNCH)

    expect(counts).toEqual({
      total: 7,
      prospect: 0,
      contracted: 0,
      active: 3,
      completed: 4,
      archived: 0,
    })
  })
})
