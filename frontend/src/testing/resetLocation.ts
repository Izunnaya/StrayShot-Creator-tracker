import { afterEach } from 'vitest'

/**
 * The screen showing now lives in the URL, and jsdom keeps one URL for every
 * test in a file. Without this, a test that ends on the ledger would start the
 * next one there too, and pass or fail by the order the file runs in.
 */
afterEach(() => {
  if (typeof window !== 'undefined') window.history.replaceState(null, '', '/')
})
