// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * The phone layout's filters, which the phone design moves out of chip rows
 * and into a sheet behind one button.
 *
 * jsdom has no layout and no matchMedia, so the app renders its wide layout
 * there by default. These tests report a phone-width screen instead, which is
 * the only way to reach the controls the phone layout renders in their place.
 */

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

afterEach(() => {
  cleanup()
  // @ts-expect-error -- put jsdom back as it was, without matchMedia.
  delete window.matchMedia
})

const sheet = () => within(screen.getByRole('dialog'))

describe('filtering creators on a phone', () => {
  const filterButton = () => screen.getByRole('button', { name: /^Filter creators\./ })

  it('says nothing is applied until something is', () => {
    render(<App />)

    expect(filterButton().getAttribute('aria-label')).toBe('Filter creators. All creators')
    expect(screen.queryByRole('button', { name: 'Clan Wars Update' })).toBeNull()
  })

  it('narrows the roster from the sheet, and says how many that leaves', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(filterButton())
    await user.click(sheet().getByRole('button', { name: 'Clan Wars Update' }))

    expect(
      sheet().getByRole('button', { name: 'Clan Wars Update' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(sheet().getByRole('button', { name: 'Show 7 creators' })).toBeTruthy()

    await user.click(sheet().getByRole('button', { name: 'Show 7 creators' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(filterButton().getAttribute('aria-label')).toBe('Filter creators. Clan Wars Update')
    expect(screen.getByText('7 creators')).toBeTruthy()
  })

  it('counts both filters once both are applied, and clears them together', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(filterButton())
    await user.click(sheet().getByRole('button', { name: 'Season 2 Launch' }))
    await user.click(sheet().getByRole('button', { name: /^Completed/ }))

    expect(sheet().getByRole('button', { name: 'Show 4 creators' })).toBeTruthy()

    await user.click(sheet().getByRole('button', { name: 'Show 4 creators' }))
    expect(filterButton().getAttribute('aria-label')).toBe('Filter creators. 2 active')

    await user.click(filterButton())
    await user.click(sheet().getByRole('button', { name: 'Clear all' }))

    expect(sheet().getByRole('button', { name: 'Show 14 creators' })).toBeTruthy()
  })
})

describe('filtering payments on a phone', () => {
  async function openTheLedger() {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Payments' }))
    return user
  }

  const filterButton = () => screen.getByRole('button', { name: /^Filter payments\./ })

  it('narrows the ledger to a campaign from the sheet', async () => {
    const user = await openTheLedger()

    await user.click(filterButton())
    await user.click(sheet().getByRole('button', { name: 'Clan Wars Update' }))
    await user.click(sheet().getByRole('button', { name: 'Show 7 payments' }))

    expect(filterButton().getAttribute('aria-label')).toBe('Filter payments. Clan Wars Update')
    expect(screen.getByText('7 payments')).toBeTruthy()
  })

  it('clears the dates along with the campaign', async () => {
    const user = await openTheLedger()

    await user.type(screen.getByLabelText('Paid From'), '2026-08-20')
    await user.click(filterButton())
    await user.click(sheet().getByRole('button', { name: 'Season 2 Launch' }))
    expect(sheet().getByRole('button', { name: 'Show 2 payments' })).toBeTruthy()

    await user.click(sheet().getByRole('button', { name: 'Clear all' }))

    expect(sheet().getByRole('button', { name: 'Show 18 payments' })).toBeTruthy()
    expect((screen.getByLabelText('Paid From') as HTMLInputElement).value).toBe('')
  })
})
