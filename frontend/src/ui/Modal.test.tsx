// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

/**
 * The dialog shell's behaviour, which every modal in the application
 * inherits: focus goes in, cannot leave by Tab, and comes back out to
 * whatever opened it.
 *
 * The case worth the most here is a dialog with nothing focusable in it.
 * None of today's modals are like that — they all have footer buttons — but
 * the shell is shared, and a content-only dialog would otherwise leave focus
 * stranded on the page behind while appearing to be modal.
 */

afterEach(cleanup)

function renderModal(children: React.ReactNode, footer?: React.ReactNode) {
  const onClose = vi.fn()
  render(
    <>
      <button type="button">opener</button>
      <Modal title="Record payment" onClose={onClose} footer={footer}>
        {children}
      </Modal>
    </>,
  )
  return { onClose, panel: screen.getByRole('dialog') }
}

describe('a dialog with something to focus', () => {
  it('moves focus to the first control in it', () => {
    renderModal(<input aria-label="Amount" />, <button type="button">Save</button>)

    expect(document.activeElement).toBe(screen.getByLabelText('Amount'))
  })

  it('cycles Tab from the last control back to the first', async () => {
    const user = userEvent.setup()
    renderModal(<input aria-label="Amount" />, <button type="button">Save</button>)

    await user.tab() // Amount -> Save
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))

    await user.tab() // Save -> back to Amount, not out to the page
    expect(document.activeElement).toBe(screen.getByLabelText('Amount'))
  })

  it('cycles Shift+Tab from the first control back to the last', async () => {
    const user = userEvent.setup()
    renderModal(<input aria-label="Amount" />, <button type="button">Save</button>)

    await user.tab({ shift: true })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))
  })
})

describe('a dialog with nothing focusable in it', () => {
  it('focuses the dialog itself rather than leaving focus on the opener', () => {
    const { panel } = renderModal(<p>Nothing here can take focus.</p>)

    expect(document.activeElement).toBe(panel)
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'opener' }))
  })

  it('keeps Tab inside, instead of walking out to the page behind', async () => {
    const user = userEvent.setup()
    const { panel } = renderModal(<p>Nothing here can take focus.</p>)

    await user.tab()
    expect(document.activeElement).toBe(panel)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(panel)
  })
})

describe('closing', () => {
  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal(<input aria-label="Amount" />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('returns focus to whatever opened it', () => {
    const opener = document.createElement('button')
    opener.textContent = 'opener'
    document.body.appendChild(opener)
    opener.focus()

    const { unmount } = render(
      <Modal title="Record payment" onClose={() => {}}>
        <input aria-label="Amount" />
      </Modal>,
    )
    expect(document.activeElement).toBe(screen.getByLabelText('Amount'))

    unmount()
    expect(document.activeElement).toBe(opener)

    opener.remove()
  })

  it('lets the page scroll again once it is gone', () => {
    const { unmount } = render(
      <Modal title="Record payment" onClose={() => {}}>
        <input aria-label="Amount" />
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).not.toBe('hidden')
  })
})
