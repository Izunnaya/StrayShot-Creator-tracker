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

/** The payment rows: everything in the body, not the headings or the total. */
const ledgerRows = () => within(ledger().getAllByRole('rowgroup')[1]!).getAllByRole('row')
const ledgerRowCount = () => ledgerRows().length

/** Each row's reference, top to bottom. */
const referencesInOrder = () =>
  ledgerRows().map((row) => row.querySelectorAll('td')[3]?.textContent ?? '')

/** The total closing the table, as "Total · N payments in filter" and the amount. */
const ledgerFooter = () => within(ledger().getAllByRole('rowgroup')[2]!)

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

    const newest = within(ledgerRows()[0]!)

    expect(newest.getByRole('button', { name: 'IronLotus' })).toBeTruthy()
    expect(newest.getByText('Aug 25, 2026')).toBeTruthy()
    expect(newest.getByText('$2,200')).toBeTruthy()
    expect(newest.getByText('WISE-8955-F')).toBeTruthy()
  })

  it('totals what was paid, to the dollar the rest of the app agrees on', async () => {
    await openTheLedger()

    // The dashboard opens showing the same $47,000 paid.
    expect(ledgerFooter().getByText('$47,000')).toBeTruthy()
    expect(ledgerFooter().getByText('Total · 18 payments in filter')).toBeTruthy()
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

describe('searching the ledger', () => {
  const searchBox = () =>
    screen.getByRole('searchbox', { name: 'Search payments by creator or reference' })

  it('finds a payment by the reference on the statement', async () => {
    const user = await openTheLedger()

    await user.type(searchBox(), 'wise-8842')

    expect(referencesInOrder()).toEqual(['WISE-8842-B'])
    expect(ledgerFooter().getByText('Total · 1 payment in filter')).toBeTruthy()
    expect(ledgerFooter().getByText('$4,500')).toBeTruthy()
  })

  it('finds every payment to a creator by name or by code', async () => {
    const user = await openTheLedger()

    await user.type(searchBox(), 'GRIM')
    expect(referencesInOrder()).toEqual(['TRF-2451-02', 'TRF-2280-09'])

    await user.clear(searchBox())
    await user.type(searchBox(), 'grimtac')
    expect(ledgerRowCount()).toBe(2)
  })

  it('says nothing matches rather than showing an empty table', async () => {
    const user = await openTheLedger()

    await user.type(searchBox(), 'NO-SUCH-REFERENCE')

    expect(ledger().getByText('No payments match this filter.')).toBeTruthy()
    expect(ledgerFooter().getByText('$0')).toBeTruthy()
  })
})

describe('narrowing the ledger to a date range', () => {
  const searchBox = () =>
    screen.getByRole('searchbox', { name: 'Search payments by creator or reference' })
  const from = () => screen.getByLabelText('Paid From')
  const to = () => screen.getByLabelText('Paid To')

  it('keeps both ends of the range, and totals only what is inside it', async () => {
    const user = await openTheLedger()

    // Aug 14 is the last day in range, and NovaKess was paid on it.
    await user.type(from(), '2026-08-01')
    await user.type(to(), '2026-08-14')

    expect(ledgerRowCount()).toBe(6)
    expect(referencesInOrder()[0]).toBe('TRF-2413-11')
    expect(ledgerFooter().getByText('Total · 6 payments in filter')).toBeTruthy()
    expect(ledgerFooter().getByText('$12,800')).toBeTruthy()
  })

  it('works with only one end set', async () => {
    const user = await openTheLedger()

    await user.type(from(), '2026-08-20')

    expect(referencesInOrder()).toEqual(['WISE-8955-F', 'WISE-8901-D', 'WISE-8842-B'])
  })

  it('explains a range that ends before it starts', async () => {
    const user = await openTheLedger()

    await user.type(from(), '2026-08-20')
    await user.type(to(), '2026-08-01')

    expect(
      ledger().getByText(
        'The From date is after the To date, so no payment can fall between them.',
      ),
    ).toBeTruthy()
  })

  it('combines with the campaign and the search', async () => {
    const user = await openTheLedger()

    await user.click(screen.getByRole('button', { name: 'Season 2 Launch' }))
    await user.type(from(), '2026-08-01')
    await user.type(searchBox(), 'TRF')

    expect(referencesInOrder()).toEqual(['TRF-2451-02', 'TRF-2413-11', 'TRF-2402-08'])
  })
})

describe('sorting the ledger', () => {
  const heading = (name: RegExp) => ledger().getByRole('button', { name })
  const headerCell = (name: string) =>
    ledger()
      .getAllByRole('columnheader')
      .find((header) => header.textContent?.includes(name))

  it('opens newest first, and says so to assistive technology', async () => {
    await openTheLedger()

    expect(headerCell('Date')?.getAttribute('aria-sort')).toBe('descending')
    expect(headerCell('Amount')?.getAttribute('aria-sort')).toBe('none')
  })

  it('reverses the date order when the date heading is clicked', async () => {
    const user = await openTheLedger()

    await user.click(heading(/^Date/))

    // DeadeyeDee's July 16 payment is the oldest on record.
    expect(referencesInOrder()[0]).toBe('WISE-7702-C')
    expect(headerCell('Date')?.getAttribute('aria-sort')).toBe('ascending')
  })

  it('puts the largest payment first on the first click of amount, then the smallest', async () => {
    const user = await openTheLedger()

    await user.click(heading(/Amount/))
    // RazeHavoc was paid $4,500 twice; the tie goes to the more recent.
    expect(referencesInOrder().slice(0, 2)).toEqual(['WISE-8842-B', 'WISE-7710-A'])
    expect(headerCell('Amount')?.getAttribute('aria-sort')).toBe('descending')
    expect(headerCell('Date')?.getAttribute('aria-sort')).toBe('none')

    await user.click(heading(/Amount/))
    expect(referencesInOrder()[0]).toBe('PP-5702-R')
  })

  it('does not change the total, only the order', async () => {
    const user = await openTheLedger()

    await user.click(heading(/Amount/))

    expect(ledgerRowCount()).toBe(18)
    expect(ledgerFooter().getByText('Total · 18 payments in filter')).toBeTruthy()
  })
})

describe('following a payment to the creator it went to', () => {
  it('keeps the search, dates and order for the trip back', async () => {
    const user = await openTheLedger()

    await user.type(
      screen.getByRole('searchbox', { name: 'Search payments by creator or reference' }),
      'LOTUS',
    )
    await user.type(screen.getByLabelText('Paid From'), '2026-08-01')
    await user.click(ledger().getByRole('button', { name: /Amount/ }))

    await user.click(ledger().getByRole('button', { name: 'IronLotus' }))
    await user.click(screen.getByRole('button', { name: /All creators/ }))

    expect(referencesInOrder()).toEqual(['WISE-8955-F'])
    expect((screen.getByLabelText('Paid From') as HTMLInputElement).value).toBe('2026-08-01')
  })

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
    expect(ledgerFooter().getByText('$48,500')).toBeTruthy()
  })

  it('names who recorded it, resolved from the id the payment stores', async () => {
    const user = userEvent.setup()
    render(<App />)

    // The fixture payments carry ids; the directory supplies the names.
    await user.click(screen.getByRole('button', { name: 'Payments' }))
    expect(within(ledgerRows()[0]!).getByText('M. Devlin')).toBeTruthy()

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
    expect(ledger().getByText('-$1,600')).toBeTruthy()
    expect(ledgerFooter().getByText('$45,400')).toBeTruthy()
  })
})
