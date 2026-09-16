import { describe, expect, it } from 'vitest'
import { createTestCreator, createTestPayment } from '@/testing/createTestCreator'
import { canDiscardCreator, getDiscardBlockers } from './creatorDiscard'

describe('whether a creator can be discarded', () => {
  it('allows it while nothing has happened to the record', () => {
    const prospect = createTestCreator({ payments: [], portalInviteState: 'not sent' })

    expect(getDiscardBlockers(prospect, 0)).toEqual([])
    expect(canDiscardCreator(prospect, 0)).toBe(true)
  })

  it('allows it after an invite has gone out but before it is claimed', () => {
    // The invite is a message, not a record of anything that happened here.
    const invited = createTestCreator({ payments: [], portalInviteState: 'sent' })

    expect(canDiscardCreator(invited, 0)).toBe(true)
  })

  it('refuses once money is in the ledger', () => {
    const paid = createTestCreator({ payments: [createTestPayment()] })

    expect(getDiscardBlockers(paid, 0)).toEqual(['has-payments'])
  })

  it('counts a reversed payment, which is still two rows in the ledger', () => {
    const reversed = createTestCreator({
      payments: [
        createTestPayment({ id: 1, amountInCents: 100_000 }),
        createTestPayment({ id: 2, amountInCents: -100_000, reversesPaymentId: 1 }),
      ],
    })

    expect(canDiscardCreator(reversed, 0)).toBe(false)
  })

  it('refuses once a stream has been detected, or the portal has been claimed', () => {
    const streamed = createTestCreator({ payments: [] })
    const claimed = createTestCreator({ payments: [], portalInviteState: 'claimed' })

    expect(getDiscardBlockers(streamed, 2)).toEqual(['has-streams'])
    expect(getDiscardBlockers(claimed, 0)).toEqual(['invite-claimed'])
  })

  it('reports every reason at once, money first', () => {
    const everything = createTestCreator({
      payments: [createTestPayment()],
      portalInviteState: 'claimed',
    })

    expect(getDiscardBlockers(everything, 3)).toEqual([
      'has-payments',
      'has-streams',
      'invite-claimed',
    ])
  })
})
