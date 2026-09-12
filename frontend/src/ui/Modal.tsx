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

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    /* The panel itself is the fallback: a dialog whose body happens to hold
       nothing focusable would otherwise leave focus on whatever opened it,
       out on the page behind. */
    const initialFocus = focusableWithin(panel.current)[0] ?? panel.current
    initialFocus?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = focusableWithin(panel.current)
      if (focusable.length === 0) {
        // Nothing to move between, so Tab must not walk out to the page.
        event.preventDefault()
        panel.current?.focus()
        return
      }

      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const movingBackwards = event.shiftKey
      const active = document.activeElement

      /* Watching only the two ends assumes focus is always on one of the
         dialog's own controls. It need not be: the panel takes focus when
         anyone clicks the heading or the dead space around it, a control
         that had focus can be removed from under it, and the fallback puts
         it there deliberately. From any of those, one Tab reaches the page
         behind. So the move is worked out from wherever focus actually is
         rather than only at the edges. */
      event.preventDefault()
      const nextInCycle = movingBackwards
        ? [...focusable].reverse().find((candidate) => comesBefore(candidate, active))
        : focusable.find((candidate) => comesBefore(active, candidate))
      ;(nextInCycle ?? (movingBackwards ? last : first)).focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/78 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panel}
        tabIndex={-1}
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

/**
 * Everything inside the panel a person can reach with Tab, in document order.
 *
 * A selector is only the first half of the question. Whether the browser will
 * actually put focus somewhere depends on things CSS cannot ask about, and an
 * element that refuses focus must not become the edge the cycle turns on --
 * Tab there lands on nothing, and the trap has a hole in exactly the place it
 * was supposed to be closed.
 *
 * Known limit: within a radio group only the checked radio is tab-reachable,
 * and this does not model that. The consequence is a cycle that turns one
 * control early, not focus escaping, which is not worth the machinery until
 * something here uses radios.
 */
function focusableWithin(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return Array.from(
    container.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'),
  ).filter(isTabReachable)
}

function isTabReachable(element: HTMLElement): boolean {
  /* Taken out of the tab order deliberately, however focusable it stays to
     script -- the panel itself is the reason that pattern exists here. */
  if (element.tabIndex < 0) return false
  if ('disabled' in element && element.disabled === true) return false
  // A hidden input is a value being carried, not a control to land on.
  if (element instanceof HTMLInputElement && element.type === 'hidden') return false
  if (element.closest('[hidden], [inert]')) return false
  return isRendered(element)
}

/**
 * Whether `node` sits earlier in the document than `other`, which is what
 * "the next one along" means once focus can start from outside the ring.
 */
function comesBefore(node: Node | null, other: Node | null): boolean {
  if (!node || !other) return false
  return Boolean(node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING)
}

function isRendered(element: HTMLElement): boolean {
  /* checkVisibility answers this properly in a browser: ancestors, collapsed
     content, the lot. jsdom has no layout and no such method, so tests fall
     back to what is legible without one. */
  if (typeof element.checkVisibility === 'function') return element.checkVisibility()
  return getComputedStyle(element).display !== 'none'
}
