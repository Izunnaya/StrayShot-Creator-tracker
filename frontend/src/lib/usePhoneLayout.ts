import { useSyncExternalStore } from 'react'

/**
 * Whether the screen is below a breakpoint.
 *
 * Most of the responsive work in this application is CSS, and should stay
 * that way. These exist for the places where the narrow design is not a
 * restyle but different controls — a bottom tab bar instead of masthead tabs,
 * cards with their own Record payment button instead of a table. Rendering
 * both and hiding one with CSS would leave two of every control in the
 * document, and every query for one would have to guess which was meant.
 *
 * Environments without matchMedia (jsdom, in tests) get the wide layout, the
 * one the design was reviewed at first.
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {}
      }
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
    () => false,
  )
}

/** Below Tailwind's md breakpoint, 768px: the phone design. */
export function usePhoneLayout(): boolean {
  return useMediaQuery('(max-width: 767.98px)')
}

/**
 * Below Tailwind's lg breakpoint, 1024px: too narrow for a table that needs
 * 1320px before its money columns stop splitting mid-number.
 */
export function useNarrowLayout(): boolean {
  return useMediaQuery('(max-width: 1023.98px)')
}
