import { describe, expect, it } from 'vitest'
import { creators } from '@/data/fixtures'
import { currentTeamMember, teamMembers, type TeamMember } from '@/data/session'
import { findTeamMember, getTeamMemberName } from './teamMembers'

const directory: TeamMember[] = [
  { id: 'tm-one', name: 'M. Devlin' },
  { id: 'tm-two', name: 'M. Devlin' },
]

describe('looking a team member up', () => {
  it('tells two people with the same name apart', () => {
    // The whole reason the payment stores an id: a name cannot do this.
    expect(findTeamMember(directory, 'tm-two')?.id).toBe('tm-two')
    expect(getTeamMemberName(directory, 'tm-one')).toBe('M. Devlin')
    expect(getTeamMemberName(directory, 'tm-two')).toBe('M. Devlin')
  })

  it('says the directory has lost them rather than returning nothing', () => {
    /* The payment was recorded by someone and still says exactly who. It is
       the directory that cannot answer, which is a different problem from an
       entry nobody signed. */
    expect(getTeamMemberName(directory, 'tm-missing')).toBe('Unknown team member')
    expect(findTeamMember(directory, 'tm-missing')).toBeUndefined()
  })
})

describe('the fixture payments', () => {
  it('were all recorded by someone the directory knows', () => {
    /* A mistyped id is invisible otherwise: it renders as "Unknown team
       member" in a column nobody reads closely, on data that looks fine. */
    const unknown = creators
      .flatMap((creator) => creator.payments)
      .map((payment) => payment.recordedByTeamMemberId)
      .filter((id) => findTeamMember(teamMembers, id) === undefined)

    expect(unknown).toEqual([])
  })
})

describe('the session', () => {
  it('is someone in the directory, so what it stamps can be resolved', () => {
    expect(findTeamMember(teamMembers, currentTeamMember.id)).toEqual(currentTeamMember)
  })

  it('has ids that are unique, since everything is keyed on them', () => {
    expect(new Set(teamMembers.map((member) => member.id)).size).toBe(teamMembers.length)
  })
})
