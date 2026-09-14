// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * The payments ledger, driven through the rendered application.
 *
 * The domain suite proves what the ledger is made of. These prove the thing
 * that makes it worth having: it is derived from the same records every other
 * screen reads, so money recorded or reversed anywhere is in it at once and
 * cannot disagree with the screen it was entered on.
 */

afterEach(cleanup)

const dialog = () => within(screen.getByRole('dialog'))
const ledger = () => within(screen.getByRole('table', { name: 'Payments' }))
const creatorTable = () => within(screen.getByRole('table', { name: 'Creator performance' }))

/** Every row but the column headings. */
const ledgerRowCount = () => ledger().getAllByRole('row').length - 1

async function openTheLedger() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Payments' }))
  return user
}

describe('the ledger', () => {
  it('gathers every payment the team has made', async () => {
    await openTheLedger()

    expect(ledgerRowCount()).toBe(18)
  })

  it('leads with the most recent one, whoever it went to', async () => {
    await openTheLedger()

    const newest = within(ledger().getAllByRole('row')[1]!)

    expect(newest.getByRole('button', { name: 'IronLotus' })).toBeTruthy()
    expect(newest.getByText('Aug 25, 2026')).toBeTruthy()
    expect(newest.getByText('$2,200.00')).toBeTruthy()
    expect(newest.getByText('WISE-8955-F')).toBeTruthy()
  })

  it('totals what was paid, to the dollar the rest of the app agrees on', async () => {
    await openTheLedger()

    // The dashboard opens showing the same $47,000 paid.
    expect(screen.getByText('$47,000')).toBeTruthy()
    expect(screen.getByText('to 13 creators')).toBeTruthy()
  })

  it('narrows to one campaign without touching the dashboard filter', async () => {
    const user = await openTheLedger()

    await user.click(screen.getByRole('button', { name: 'Clan Wars Update' }))
    expect(ledgerRowCount()).toBe(7)
    expect(ledger().queryAllByRole('button', { name: 'IronLotus' })).toHaveLength(0)

    // The dashboard was never narrowed, so it still holds every creator.
    await user.click(screen.getByRole('button', { name: 'Overview' }))
    expect(creatorTable().getByRole('button', { name: 'IronLotus' })).toBeTruthy()
  })
})

describe('following a payment to the creator it went to', () => {
  it('opens their screen and comes back to the ledger, not the dashboard', async () => {
    const user = await openTheLedger()

    // IronLotus was paid twice, so the ledger holds two of them.
    await user.click(ledger().getAllByRole('button', { name: 'IronLotus' })[0]!)
    expect(screen.getByRole('button', { name: /Record payment/ })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /All creators/ }))

    // Back where it was left: the ledger, not the screen behind the tab.
    expect(screen.getByRole('table', { name: 'Payments' })).toBeTruthy()
    expect(screen.queryByRole('table', { name: 'Creator performance' })).toBeNull()
  })
})

describe('money entered elsewhere', () => {
  it('reaches the ledger as soon as it is recorded', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: /Record payment/ })[0]!)
    await user.type(dialog().getByLabelText('Amount paid in dollars'), '1500')
    await user.type(dialog().getByLabelText('Reference or transaction ID'), 'LEDGER-TEST-1')
    await user.click(dialog().getByRole('button', { name: 'Save payment' }))

    await user.click(screen.getByRole('button', { name: 'Payments' }))

    expect(ledgerRowCount()).toBe(19)
    expect(ledger().getByText('LEDGER-TEST-1')).toBeTruthy()
    expect(screen.getByText('$48,500')).toBeTruthy()
  })

  it('names who recorded it, resolved from the id the payment stores', async () => {
    const user = userEvent.setup()
    render(<App />)

    // The fixture payments carry ids; the directory supplies the names.
    await user.click(screen.getByRole('button', { name: 'Payments' }))
    expect(within(ledger().getAllByRole('row')[1]!).getByText('M. Devlin')).toBeTruthy()

    // A payment recorded now is stamped with the session's id, and reads back
    // as that person's name without the name ever being written down.
    await user.click(screen.getByRole('button', { name: 'Overview' }))
    await user.click(screen.getAllByRole('button', { name: /Record payment/ })[0]!)
    await user.type(dialog().getByLabelText('Amount paid in dollars'), '250')
    await user.type(dialog().getByLabelText('Reference or transaction ID'), 'WHO-RECORDED-1')
    await user.click(dialog().getByRole('button', { name: 'Save payment' }))
    await user.click(screen.getByRole('button', { name: 'Payments' }))

    const recorded = ledger().getByText('WHO-RECORDED-1').closest('tr')!
    expect(within(recorded).getByText('A. Raouf')).toBeTruthy()
  })

  it('shows a reversal beside what it undid, and takes it off the total', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(creatorTable().getByRole('button', { name: 'NovaKess' }))
    await user.click(screen.getAllByRole('button', { name: /^Reverse payment of/ })[0]!)
    await user.click(dialog().getByRole('button', { name: /Reverse payment/ }))

    await user.click(screen.getByRole('button', { name: 'Payments' }))

    /* Both halves stay in the record -- that is the point of an append-only
       ledger -- so the row count goes up while the money goes down. */
    expect(ledgerRowCount()).toBe(19)
    expect(ledger().getAllByText('Reversal')).toHaveLength(1)
    expect(ledger().getAllByText('Reversed')).toHaveLength(1)
    expect(ledger().getByText('-$1,600.00')).toBeTruthy()
    expect(screen.getByText('$45,400')).toBeTruthy()
  })
})
