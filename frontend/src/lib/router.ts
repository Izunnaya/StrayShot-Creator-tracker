import { useSyncExternalStore } from 'react'

/**
 * Which screen is showing, held in the address bar.
 *
 * Three routes do not need a routing library. This is the History API and a
 * parser: every screen gets a URL that can be shared, bookmarked and reloaded,
 * and the browser's Back and Forward move between them.
 *
 *   /                 the campaign overview
 *   /payments         the payments ledger
 *   /creators/:id     one creator
 *
 * Anything else reads as the overview rather than a blank page.
 *
 * Deployment note: a static host has to answer every one of these paths with
 * index.html, or a reload on /payments is a 404. Vite's dev server already
 * does this.
 */

export type Route =
  { screen: 'overview' } | { screen: 'payments' } | { screen: 'creator'; creatorId: number }

/** The tab a creator's screen was opened from, carried in history state. */
export type RouteOrigin = 'overview' | 'payments'

interface RouteHistoryState {
  from?: RouteOrigin
}

const NAVIGATE_EVENT = 'app:navigate'

export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/payments') return { screen: 'payments' }

  const creator = /^\/creators\/(\d+)$/.exec(path)
  if (creator) return { screen: 'creator', creatorId: Number(creator[1]) }

  return { screen: 'overview' }
}

export function pathForRoute(route: Route): string {
  switch (route.screen) {
    case 'overview':
      return '/'
    case 'payments':
      return '/payments'
    case 'creator':
      return `/creators/${route.creatorId}`
  }
}

/**
 * Moves to a route. Pushes a history entry, so Back returns here, unless
 * `replace` is set -- for correcting an address that led nowhere.
 */
export function navigate(
  route: Route,
  options: { replace?: boolean; from?: RouteOrigin } = {},
): void {
  const state: RouteHistoryState = options.from ? { from: options.from } : {}
  const path = pathForRoute(route)
  if (options.replace) window.history.replaceState(state, '', path)
  else window.history.pushState(state, '', path)
  // pushState raises no event of its own; this lets every useRoute re-read.
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(NAVIGATE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(NAVIGATE_EVENT, onChange)
  }
}

/* The snapshot is the path and the origin as one string, so it compares by
   value and a render happens only when one of them actually changes. */
function locationSnapshot(): string {
  const from = (window.history.state as RouteHistoryState | null)?.from ?? ''
  return `${window.location.pathname}#${from}`
}

/** The current route, and the tab a creator's screen was opened from if any. */
export function useRoute(): { route: Route; from: RouteOrigin | undefined } {
  const snapshot = useSyncExternalStore(subscribe, locationSnapshot, () => '/#')
  const separator = snapshot.lastIndexOf('#')
  const from = snapshot.slice(separator + 1)
  return {
    route: parseRoute(snapshot.slice(0, separator)),
    from: from === 'overview' || from === 'payments' ? from : undefined,
  }
}
