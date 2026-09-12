// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * Interaction tests for the dashboard.
 *
 * The domain suite proves the calculations; these prove the wiring around
 * them — that a filter reaches the table, that a heading click reorders it,
 * and that coming back from a creator does not throw the team's filters away.
 *
 * Every query is scoped to the table on purpose. Below lg the same creators
 * also render as cards, and both trees exist in jsdom because no CSS is
 * applied, so an unscoped getByText would match twice and pass for the wrong
 * reason.
 */

afterEach(cleanup)

/* Two tables render on the dashboard: this one, and the accessible data
   table behind the installs chart. Select by caption, not position. */
const creatorTable = () => within(screen.getByRole('table', { name: 'Creator performance' }))

/** Creator names in table order, ignoring the heading row. */
function creatorNamesInTableOrder(): string[] {
  return creatorTable()
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('rowheader')[0]?.textContent?.trim() ?? '')
    .filter((name) => name.length > 0)
}

describe('filtering the dashboard by campaign', () => {
  it('narrows the table to the selected campaign', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(creatorTable().queryByText('NovaKess')).not.toBeNull()

    await user.click(screen.getByRole('button', { name: /Clan Wars Update/ }))

    expect(creatorTable().queryByText('PixelMara')).not.toBeNull()
    expect(creatorTable().queryByText('NovaKess')).toBeNull()
  })

  it('narrows the table to the selected lifecycle status', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /^Completed/ }))

    const names = creatorNamesInTableOrder()
    expect(names.length).toBeGreaterThan(0)
    expect(names).not.toContain('QuietStorm')
  })
})

describe('sorting the creator table', () => {
  it('reorders by the clicked column and records the direction for assistive technology', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(creatorTable().getByRole('button', { name: /Installs/ }))

    // Installs sorts highest-first on the first click, so the campaign's
    // strongest performer leads.
    expect(creatorNamesInTableOrder()[0]).toBe('RazeHavoc')

    const installsHeader = creatorTable()
      .getAllByRole('columnheader')
      .find((header) => header.textContent?.includes('Installs'))
    expect(installsHeader?.getAttribute('aria-sort')).toBe('descending')
  })

  it('reverses the order when the same column is clicked again', async () => {
    const user = userEvent.setup()
    render(<App />)

    const installsHeading = () => creatorTable().getByRole('button', { name: /Installs/ })
    await user.click(installsHeading())
    await user.click(installsHeading())

    expect(creatorNamesInTableOrder()[0]).toBe('QuietStorm')
  })
})

describe('returning from a creator', () => {
  it('keeps the filters and sort the team had applied', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Clan Wars Update/ }))
    await user.click(creatorTable().getByRole('button', { name: /Installs/ }))
    const orderBeforeLeaving = creatorNamesInTableOrder()

    await user.click(creatorTable().getByRole('button', { name: 'PixelMara' }))
    expect(screen.getByRole('heading', { name: 'PixelMara' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /All creators/ }))

    expect(creatorNamesInTableOrder()).toEqual(orderBeforeLeaving)
    expect(creatorTable().queryByText('NovaKess')).toBeNull()
    expect(
      screen.getByRole('button', { name: /Clan Wars Update/ }).getAttribute('aria-pressed'),
    ).toBe('true')
  })
})

describe('what the headline figures answer', () => {
  /* Campaign is a scope and status is a lens: the figures say which campaign
     they are for, and the table below says which creators are being looked
     at. Q20. */

  it('follows the campaign the figures are for', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('$47,000')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Season 2 Launch/ }))

    expect(screen.getByText('$28,700')).toBeTruthy()
  })

  it('stays put while the status filter narrows the table under it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /^Prospect/ }))

    /* Every prospect has nothing agreed and nothing paid, so following the
       status filter here read "$0 paid of $0 committed" -- a campaign that
       looks broken rather than a slice that happens to be empty. */
    expect(screen.getByText('$47,000')).toBeTruthy()
    expect(screen.queryByText('$0')).toBeNull()
  })
})

describe('a campaign against its budget', () => {
  it('shows what is committed once a single campaign is in view', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Clan Wars Update/ }))

    expect(screen.getByText(/\$20,900 committed of \$22,000 budget/)).toBeTruthy()
    expect(screen.getByText('$1,100 left to commit')).toBeTruthy()
  })

  it('says when a campaign has committed past it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Season 2 Launch/ }))

    // $34,300 of deals against a $30,000 budget, which nothing on screen
    // reported until this panel existed.
    expect(screen.getByText('$4,300 over budget')).toBeTruthy()
  })

  it('is absent with every campaign at once, where there is no one budget', () => {
    render(<App />)

    expect(screen.queryByText(/committed of/)).toBeNull()
  })
})
