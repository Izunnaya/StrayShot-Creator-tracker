// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * Archiving a creator, driven through the rendered application.
 *
 * The point of archiving is that it hides someone from the roster without
 * taking anything away from the record, so these check both halves: that they
 * leave the table, and that the money they were paid is still in the ledger
 * and the campaign's figures.
 */

afterEach(cleanup)

const dialog = () => within(screen.getByRole('dialog'))
const creatorTable = () => within(screen.getByRole('table', { name: 'Creator performance' }))
const ledger = () => within(screen.getByRole('table', { name: 'Payments' }))

/** RazeHavoc is completed and settled: $9,000 of $9,000, nothing open. */
async function archiveRazeHavoc(user: ReturnType<typeof userEvent.setup>) {
  await user.click(creatorTable().getByRole('button', { name: 'RazeHavoc' }))
  await user.click(screen.getByRole('button', { name: 'Archive' }))
  await user.click(dialog().getByRole('button', { name: 'Archive creator' }))
}

describe('archiving a creator', () => {
  it('takes them out of the roster and its counts', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('button', { name: 'All 14' })).toBeTruthy()

    await archiveRazeHavoc(user)

    // Their own screen stays open, saying so, with the way back on it.
    expect(screen.getByText(/^Archived/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Restore' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /All creators/ }))
    expect(creatorTable().queryByRole('button', { name: 'RazeHavoc' })).toBeNull()
    expect(screen.getByRole('button', { name: 'All 13' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Completed/ }).textContent).toMatch(/5/)
  })

  it('keeps their money in the ledger and in the campaign figures', async () => {
    const user = userEvent.setup()
    render(<App />)

    await archiveRazeHavoc(user)
    await user.click(screen.getByRole('button', { name: /All creators/ }))

    // $47,000 paid across every creator, archived or not.
    expect(screen.getByText('$47,000')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Payments' }))
    expect(ledger().getAllByRole('button', { name: 'RazeHavoc' }).length).toBe(2)
  })

  it('finds them again under Archived, and restores them', async () => {
    const user = userEvent.setup()
    render(<App />)

    await archiveRazeHavoc(user)
    await user.click(screen.getByRole('button', { name: /All creators/ }))
    await user.click(screen.getByRole('button', { name: /^Archived/ }))

    expect(creatorTable().getByRole('button', { name: 'RazeHavoc' })).toBeTruthy()

    await user.click(creatorTable().getByRole('button', { name: 'RazeHavoc' }))
    await user.click(screen.getByRole('button', { name: 'Restore' }))

    expect(screen.queryByText(/^Archived/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Archive' })).toBeTruthy()
  })

  it('refuses while money is still owed, and says what is open', async () => {
    const user = userEvent.setup()
    render(<App />)

    // NovaKess has $1,600 open on a $4,800 deal.
    await user.click(creatorTable().getByRole('button', { name: 'NovaKess' }))
    await user.click(screen.getByRole('button', { name: 'Archive' }))

    expect(dialog().getByText('Open balance')).toBeTruthy()
    expect(dialog().getByText('$1,600')).toBeTruthy()
    expect(dialog().queryByRole('button', { name: 'Archive creator' })).toBeNull()

    await user.click(dialog().getByRole('button', { name: 'Close' }))
    await user.click(screen.getByRole('button', { name: /All creators/ }))
    expect(creatorTable().getByRole('button', { name: 'NovaKess' })).toBeTruthy()
  })
})
