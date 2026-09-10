// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'

/**
 * Recording a payment, driven through the rendered application.
 *
 * The domain suite proves the arithmetic; these prove the thing the team
 * actually depends on — that money recorded in the modal reaches every figure
 * on the screen behind it, and that a form which cannot be saved says why
 * rather than closing silently.
 */

afterEach(cleanup)

const dialog = () => within(screen.getByRole('dialog'))

async function openTheFirstOutstandingRow() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getAllByRole('button', { name: /Record payment/ })[0]!)
  return user
}

describe('recording a payment', () => {
  it('opens from the outstanding panel with the balance already shown', async () => {
    await openTheFirstOutstandingRow()

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(dialog().getByText(/Agreed/)).toBeTruthy()
    expect(dialog().getByLabelText('Amount paid in dollars')).toBeTruthy()
  })

  it('adds the money to every figure on the screen behind it', async () => {
    const user = await openTheFirstOutstandingRow()

    // The dashboard opens showing $47,000 paid across every creator.
    expect(screen.getByText('$47,000')).toBeTruthy()

    await user.type(dialog().getByLabelText('Amount paid in dollars'), '1500')
    await user.click(dialog().getByRole('button', { name: 'Save payment' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('$48,500')).toBeTruthy()
  })

  it('keeps exact cents rather than rounding them away', async () => {
    const user = await openTheFirstOutstandingRow()

    await user.type(dialog().getByLabelText('Amount paid in dollars'), '100.49')
    await user.click(dialog().getByRole('button', { name: 'Save payment' }))

    // 47,000 + 100.49, shown to the dollar in the summary strip.
    expect(screen.getByText('$47,100')).toBeTruthy()
  })

  it('says what the balance becomes before anything is saved', async () => {
    const user = await openTheFirstOutstandingRow()

    await user.type(dialog().getByLabelText('Amount paid in dollars'), '500')

    expect(dialog().getByRole('status').textContent).toMatch(/After saving/)
    expect(dialog().getByRole('status').textContent).toMatch(/still open/)
  })

  it('warns about an overpayment but still allows it', async () => {
    const user = await openTheFirstOutstandingRow()

    await user.type(dialog().getByLabelText('Amount paid in dollars'), '99999')

    expect(dialog().getByRole('status').textContent).toMatch(/more than the deal/)

    await user.click(dialog().getByRole('button', { name: 'Save payment' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('refuses to save an empty amount, and says why', async () => {
    const user = await openTheFirstOutstandingRow()

    await user.click(dialog().getByRole('button', { name: 'Save payment' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(dialog().getByRole('alert').textContent).toMatch(/Enter the amount/)
  })

  it('refuses an amount it cannot read', async () => {
    const user = await openTheFirstOutstandingRow()

    await user.type(dialog().getByLabelText('Amount paid in dollars'), 'twelve hundred')
    await user.click(dialog().getByRole('button', { name: 'Save payment' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(dialog().getByRole('alert').textContent).toMatch(/cannot be read/)
  })

  it('fills the exact balance from the shortcut', async () => {
    const user = await openTheFirstOutstandingRow()

    await user.click(dialog().getByRole('button', { name: /Pay full balance/ }))

    expect(dialog().getByRole('status').textContent).toMatch(/balance closed/)
  })

  it('dates the payment when the modal opens, not when the app started', () => {
    // A dashboard left open overnight: yesterday when it rendered, today by
    // the time someone records a payment on it. fireEvent rather than
    // user-event here, because user-event waits on timers that are faked.
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2026, 8, 10, 23, 55))
      render(<App />)

      vi.setSystemTime(new Date(2026, 8, 11, 0, 5))
      fireEvent.click(screen.getAllByRole('button', { name: /Record payment/ })[0]!)

      const datePaid = dialog().getByLabelText('Date paid') as HTMLInputElement
      expect(datePaid.value).toBe('2026-09-11')
      expect(datePaid.max).toBe('2026-09-11')
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes on Escape without recording anything', async () => {
    const user = await openTheFirstOutstandingRow()

    await user.type(dialog().getByLabelText('Amount paid in dollars'), '1500')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('$47,000')).toBeTruthy()
  })
})
