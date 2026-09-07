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
