// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * Creating and editing a campaign, driven through the rendered application.
 *
 * The case worth proving is the rename: creators point at a campaign by id,
 * so renaming one should be visible everywhere immediately and should not
 * strand a single creator. Before that change it would have meant rewriting
 * the name held on every creator record.
 */

afterEach(cleanup)

const dialog = () => within(screen.getByRole('dialog'))
const creatorTable = () => within(screen.getByRole('table', { name: 'Creator performance' }))

async function fillCampaign(
  user: ReturnType<typeof userEvent.setup>,
  fields: { name?: string; start?: string; end?: string; budget?: string; target?: string },
) {
  if (fields.name !== undefined)
    await user.type(dialog().getByLabelText('Campaign name'), fields.name)
  if (fields.start !== undefined)
    await user.type(dialog().getByLabelText('Start date'), fields.start)
  if (fields.end !== undefined) await user.type(dialog().getByLabelText('End date'), fields.end)
  if (fields.budget !== undefined)
    await user.type(dialog().getByLabelText('Total budget in dollars'), fields.budget)
  if (fields.target !== undefined)
    await user.type(dialog().getByLabelText('Target cost per install in dollars'), fields.target)
}

describe('creating a campaign', () => {
  it('adds it to the filter chips', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('button', { name: /Winter Offensive/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: '+ New campaign' }))
    await fillCampaign(user, {
      name: 'Winter Offensive',
      start: '2026-11-01',
      end: '2026-12-24',
      budget: '30000',
      target: '3.50',
    })
    await user.click(dialog().getByRole('button', { name: 'Create campaign' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: /Winter Offensive/ })).toBeTruthy()
  })

  it('starts empty with nobody on it, so filtering to it shows no creators', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '+ New campaign' }))
    await fillCampaign(user, {
      name: 'Winter Offensive',
      start: '2026-11-01',
      end: '2026-12-24',
      budget: '30000',
      target: '3.50',
    })
    await user.click(dialog().getByRole('button', { name: 'Create campaign' }))
    await user.click(screen.getByRole('button', { name: /Winter Offensive/ }))

    expect(creatorTable().getByText('No creators match this filter.')).toBeTruthy()
  })

  it('refuses a name another campaign already has, and says which rule was broken', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '+ New campaign' }))
    await fillCampaign(user, {
      name: 'Clan Wars Update',
      start: '2026-11-01',
      end: '2026-12-24',
      budget: '30000',
      target: '3.50',
    })
    await user.click(dialog().getByRole('button', { name: 'Create campaign' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(dialog().getByRole('alert').textContent).toMatch(/already has that name/)
  })

  it('refuses an end date before the start', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '+ New campaign' }))
    await fillCampaign(user, {
      name: 'Backwards',
      start: '2026-12-01',
      end: '2026-11-01',
      budget: '30000',
      target: '3.50',
    })
    await user.click(dialog().getByRole('button', { name: 'Create campaign' }))

    expect(dialog().getByRole('alert').textContent).toMatch(/end date is before the start/)
  })
})

describe('editing a campaign', () => {
  /** Editing is only offered once the dashboard is showing one campaign. */
  async function openTheEditFormForSeason2(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /Season 2 Launch/ }))
    await user.click(screen.getByRole('button', { name: 'Edit campaign' }))
  }

  it('is offered only when a single campaign is in view', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryByRole('button', { name: 'Edit campaign' })).toBeNull()

    await user.click(screen.getByRole('button', { name: /Season 2 Launch/ }))

    expect(screen.getByRole('button', { name: 'Edit campaign' })).toBeTruthy()
  })

  it('opens with the campaign already in the form', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheEditFormForSeason2(user)

    expect((dialog().getByLabelText('Campaign name') as HTMLInputElement).value).toBe(
      'Season 2 Launch',
    )
    expect((dialog().getByLabelText('Total budget in dollars') as HTMLInputElement).value).toBe(
      '30000',
    )
  })

  it('renames without stranding the creators on it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheEditFormForSeason2(user)

    const name = dialog().getByLabelText('Campaign name')
    await user.clear(name)
    await user.type(name, 'Season Two Relaunch')
    await user.click(dialog().getByRole('button', { name: 'Save changes' }))

    // The chip is renamed, still selected, and its seven creators are still on it.
    expect(screen.getByRole('button', { name: /Season Two Relaunch/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Season 2 Launch/ })).toBeNull()
    expect(creatorTable().getAllByRole('row')).toHaveLength(8)
    expect(creatorTable().getByText('NovaKess')).toBeTruthy()
  })

  it('carries the new name onto the creator detail screen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheEditFormForSeason2(user)

    const name = dialog().getByLabelText('Campaign name')
    await user.clear(name)
    await user.type(name, 'Season Two Relaunch')
    await user.click(dialog().getByRole('button', { name: 'Save changes' }))
    await user.click(creatorTable().getByRole('button', { name: 'NovaKess' }))

    expect(screen.getByText('Season Two Relaunch')).toBeTruthy()
  })

  it('changes the cost-per-install target everyone on it is judged against', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheEditFormForSeason2(user)

    // NovaKess runs at $0.76 an install, under the $3.50 target and green.
    const novaKessCostPerInstall = () =>
      within(creatorTable().getByRole('button', { name: 'NovaKess' }).closest('tr')!).getByText(
        '$0.76',
      )
    expect(novaKessCostPerInstall().className).toMatch(/text-good/)

    // A target of $0.40 puts them past the 1.6x tolerance and into red.
    const target = dialog().getByLabelText('Target cost per install in dollars')
    await user.clear(target)
    await user.type(target, '0.40')
    await user.click(dialog().getByRole('button', { name: 'Save changes' }))

    expect(novaKessCostPerInstall().className).toMatch(/text-bad/)
  })
})
