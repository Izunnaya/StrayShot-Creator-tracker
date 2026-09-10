import { useEffect, useRef, type ReactNode } from 'react'
import { joinClassNames } from '@/lib/classNames'

/**
 * The dialog shell every modal in the application sits in.
 *
 * The design gives modals a stencil cut across the top-right corner and an
 * amber hairline, which is why the clip and the border live here rather than
 * in each modal — three more are coming (campaign, creator, and this one's
 * siblings) and they should not each reinvent the frame.
 *
 * Behaviour that a dialog owes the person using it, in one place: Escape
 * closes it, clicking the ground outside closes it, focus moves into it on
 * open and cannot leave by Tab while it is open, and focus returns to
 * whatever opened it on close. The page behind does not scroll.
 */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  labelId = 'modal-title',
}: {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  /** Actions row, kept out of the scrolling body so it stays reachable. */
  footer?: ReactNode
  labelId?: string
}) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    focusableWithin(panel.current)[0]?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = focusableWithin(panel.current)
      if (focusable.length === 0) return

      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const movingBackwards = event.shiftKey

      if (movingBackwards && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!movingBackwards && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/78 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        onClick={(event) => event.stopPropagation()}
        className={joinClassNames(
          'flex max-h-[92vh] w-full flex-col border border-amber bg-panel',
          'sm:clip-corner sm:max-h-[88vh] sm:w-[560px]',
        )}
      >
        <div className="px-5 pt-5 sm:px-7 sm:pt-6">
          <h2
            id={labelId}
            className="font-display text-[20px] uppercase tracking-[1.5px] text-amber sm:text-[22px]"
          >
            {title}
          </h2>
          {subtitle && <div className="mt-1 text-[14px] text-ink-muted">{subtitle}</div>}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">{children}</div>

        {footer && <div className="border-t border-hair px-5 py-4 sm:px-7">{footer}</div>}
      </div>
    </div>
  )
}

/** Everything inside the panel a person can Tab to, in document order. */
function focusableWithin(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return [
    ...container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ]
}
