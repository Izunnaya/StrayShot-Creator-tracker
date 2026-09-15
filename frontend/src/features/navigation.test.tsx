// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * Every screen has an address. These prove the addresses mean something: that
 * moving around changes them, that opening one lands on its screen, and that
 * the browser's Back goes where it should.
 */

afterEach(cleanup)

const creatorTable = () => within(screen.getByRole('table', { name: 'Creator performance' }))
const ledger = () => within(screen.getByRole('table', { name: 'Payments' }))

/** What the browser does on Back: move the URL, then fire popstate. */
function pressBrowserBack(path: string, state: unknown = null) {
  act(() => {
    window.history.replaceState(state, '', path)
    window.dispatchEvent(new PopStateEvent('popstate', { state }))
  })
}

describe('moving around', () => {
  it('gives the ledger and each creator an address of their own', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(window.location.pathname).toBe('/')

    await user.click(screen.getByRole('button', { name: 'Payments' }))
    expect(window.location.pathname).toBe('/payments')

    await user.click(ledger().getAllByRole('button', { name: 'IronLotus' })[0]!)
    expect(window.location.pathname).toBe('/creators/9')
    expect(screen.getByRole('heading', { name: 'IronLotus' })).toBeTruthy()
  })

  it('goes back to the tab a creator was opened from', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Payments' }))
    await user.click(ledger().getAllByRole('button', { name: 'IronLotus' })[0]!)
    // The ledger's tab stays marked while its creator is open.
    expect(screen.getByRole('button', { name: 'Payments' }).getAttribute('aria-current')).toBe(
      'page',
    )

    await user.click(screen.getByRole('button', { name: /All creators/ }))
    expect(window.location.pathname).toBe('/payments')
  })
})

describe('opening an address directly', () => {
  it('lands on the ledger', () => {
    window.history.replaceState(null, '', '/payments')
    render(<App />)

    expect(screen.getByRole('table', { name: 'Payments' })).toBeTruthy()
  })

  it('lands on a creator', () => {
    window.history.replaceState(null, '', '/creators/1')
    render(<App />)

    expect(screen.getByRole('heading', { name: 'NovaKess' })).toBeTruthy()
  })

  it('sends a creator who does not exist to the overview, and off the dead address', () => {
    window.history.replaceState(null, '', '/creators/999')
    render(<App />)

    expect(creatorTable().getByRole('button', { name: 'NovaKess' })).toBeTruthy()
    expect(window.location.pathname).toBe('/')
  })
})

describe("the browser's Back button", () => {
  it('returns from a creator to the screen before it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(creatorTable().getByRole('button', { name: 'NovaKess' }))
    expect(screen.getByRole('heading', { name: 'NovaKess' })).toBeTruthy()

    pressBrowserBack('/')

    expect(creatorTable().getByRole('button', { name: 'NovaKess' })).toBeTruthy()
  })
})
