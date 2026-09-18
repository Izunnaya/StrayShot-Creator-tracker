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
 * Every dialog carries a close button at the top, so it is always part of the
 * Tab cycle: first in the panel, though a dialog opens on its first control
 * rather than on it. A dialog with nothing else to focus falls back to it,
 * rather than leaving focus stranded on the page behind.
 */

const closeButton = () => screen.getByRole('button', { name: 'Close dialog' })

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

    await user.tab() // Save -> round to the close button, not out to the page
    expect(document.activeElement).toBe(closeButton())

    await user.tab() // close button -> Amount
    expect(document.activeElement).toBe(screen.getByLabelText('Amount'))
  })

  it('cycles Shift+Tab back through the close button to the last control', async () => {
    const user = userEvent.setup()
    renderModal(<input aria-label="Amount" />, <button type="button">Save</button>)

    await user.tab({ shift: true }) // Amount -> the close button above it
    expect(document.activeElement).toBe(closeButton())

    await user.tab({ shift: true }) // close button -> round to Save
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))
  })
})

describe('a dialog with no controls of its own', () => {
  it('focuses its close button rather than leaving focus on the opener', () => {
    renderModal(<p>Nothing here can take focus.</p>)

    expect(document.activeElement).toBe(closeButton())
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'opener' }))
  })

  it('keeps Tab inside, instead of walking out to the page behind', async () => {
    const user = userEvent.setup()
    renderModal(<p>Nothing here can take focus.</p>)

    await user.tab()
    expect(document.activeElement).toBe(closeButton())

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(closeButton())
  })
})

describe('controls the browser will not focus', () => {
  /* Each of these is matched by a plain "is it a control" selector but is not
     in the tab order. Treating one as the first or last control puts the edge
     of the cycle on something Tab cannot land on. */
  const unreachable = (
    <>
      <button type="button" disabled>
        Saving
      </button>
      <button type="button" tabIndex={-1}>
        Roving
      </button>
      <input type="hidden" name="campaignId" value="1" />
      <input aria-label="Reference" style={{ display: 'none' }} />
      <div hidden>
        <button type="button">Inside a hidden branch</button>
      </div>
    </>
  )

  it('skips them and focuses the one control that is really there', () => {
    renderModal(
      <>
        {unreachable}
        <input aria-label="Amount" />
      </>,
    )

    expect(document.activeElement).toBe(screen.getByLabelText('Amount'))
  })

  it('turns the cycle on the real controls, not on them', async () => {
    const user = userEvent.setup()
    renderModal(
      <>
        {unreachable}
        <input aria-label="Amount" />
      </>,
      <button type="button">Save</button>,
    )

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))

    await user.tab()
    expect(document.activeElement).toBe(closeButton())

    await user.tab()
    expect(document.activeElement).toBe(screen.getByLabelText('Amount'))
  })

  it('treats a dialog holding nothing else as having only its close button', async () => {
    const user = userEvent.setup()
    renderModal(unreachable)

    expect(document.activeElement).toBe(closeButton())

    await user.tab()
    expect(document.activeElement).toBe(closeButton())
  })
})

describe('focus that is not on a control of its own', () => {
  /* Tab has to be worked out from wherever focus actually is. Watching only
     the first and last control leaves every other starting point free to
     Tab straight out of the dialog, and there are three ordinary ways to be
     at one: clicking the heading, a control disappearing from under focus,
     and the empty-dialog fallback. */

  it('sends Tab from the panel itself to the first control, the close button', async () => {
    const user = userEvent.setup()
    const { panel } = renderModal(
      <input aria-label="Amount" />,
      <button type="button">Save</button>,
    )

    panel.focus() // what clicking the heading or the dead space around it does
    await user.tab()

    expect(document.activeElement).toBe(closeButton())
  })

  it('sends Shift+Tab from the panel itself to the last control', async () => {
    const user = userEvent.setup()
    const { panel } = renderModal(
      <input aria-label="Amount" />,
      <button type="button">Save</button>,
    )

    panel.focus()
    await user.tab({ shift: true })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))
  })

  it('pulls focus back in when it has drifted out to the page behind', async () => {
    const user = userEvent.setup()
    const { panel } = renderModal(
      <input aria-label="Amount" />,
      <button type="button">Save</button>,
    )

    screen.getByRole('button', { name: 'opener' }).focus()
    await user.tab()

    expect(panel.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).toBe(closeButton())
  })

  it('carries on from a control the tab order skips, rather than starting over', async () => {
    const user = userEvent.setup()
    renderModal(
      <>
        <input aria-label="Amount" />
        <button type="button" tabIndex={-1}>
          Roving
        </button>
        <input aria-label="Reference" />
      </>,
    )

    screen.getByRole('button', { name: 'Roving' }).focus() // reachable by mouse
    await user.tab()

    expect(document.activeElement).toBe(screen.getByLabelText('Reference'))
  })
})

describe('closing', () => {
  it('closes from the close button', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal(<input aria-label="Amount" />)

    await user.click(closeButton())

    expect(onClose).toHaveBeenCalled()
  })

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
