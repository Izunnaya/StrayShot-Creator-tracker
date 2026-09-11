// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * Undoing a payment, driven through the rendered application.
 *
 * The behaviour under test is the one that makes an append-only ledger worth
 * having: the mistake stays visible, the correction sits beside it, and the
 * totals come out right because the two sum to nothing.
 */

afterEach(cleanup)

const dialog = () => within(screen.getByRole('dialog'))

/** NovaKess has two payments and an open balance, so both controls apply. */
async function openNovaKess() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(
    within(screen.getByRole('table', { name: 'Creator performance' })).getByRole('button', {
      name: 'NovaKess',
    }),
  )
  return user
}

describe('reversing a payment', () => {
  it('offers a reversal on each payment in the history', async () => {
    await openNovaKess()

    expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(2)
  })

  it('confirms what it is about to do before doing it', async () => {
    const user = await openNovaKess()

    await user.click(screen.getAllByRole('button', { name: 'Reverse' })[0]!)

    expect(dialog().getByText(/stays in the history/)).toBeTruthy()
    expect(dialog().getByText(/-\$1,600\.00/)).toBeTruthy()
  })

  it('leaves the original alone and adds the cancelling record beside it', async () => {
    const user = await openNovaKess()

    // Paid $3,200 across two payments before anything is reversed.
    expect(screen.getByText(/\$3,200\.00 of \$4,800\.00 paid across 2 payments/)).toBeTruthy()

    await user.click(screen.getAllByRole('button', { name: 'Reverse' })[0]!)
    await user.click(dialog().getByRole('button', { name: 'Reverse payment' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText(/\$1,600\.00 of \$4,800\.00 paid across 1 payment/)).toBeTruthy()
    expect(screen.getByText('Reversal')).toBeTruthy()
    expect(screen.getByText('Reversed')).toBeTruthy()
  })

  it('will not reverse the same payment twice, or reverse a reversal', async () => {
    const user = await openNovaKess()

    await user.click(screen.getAllByRole('button', { name: 'Reverse' })[0]!)
    await user.click(dialog().getByRole('button', { name: 'Reverse payment' }))

    // Two records became three, and only the untouched payment can be undone.
    expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(1)
  })

  it('changes nothing when the confirmation is dismissed', async () => {
    const user = await openNovaKess()

    await user.click(screen.getAllByRole('button', { name: 'Reverse' })[0]!)
    await user.click(dialog().getByRole('button', { name: 'Keep it' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText(/\$3,200\.00 of \$4,800\.00 paid across 2 payments/)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(2)
  })

  it('puts the money back into what is outstanding', async () => {
    const user = await openNovaKess()

    await user.click(screen.getAllByRole('button', { name: 'Reverse' })[0]!)
    await user.click(dialog().getByRole('button', { name: 'Reverse payment' }))

    // $4,800 agreed, $1,600 still paid, so $3,200 is open again.
    expect(screen.getByText(/\$3,200\.00 open/)).toBeTruthy()
  })
})
