import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [react(), tailwindcss()],
  test: {
    // The domain layer is plain TypeScript, so tests need no browser
    // environment. The rendered tests opt into jsdom per file, with a
    // `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    /* The rendered tests drive the whole application through user-event,
       which types a character at a time and re-renders between each one. A
       few of them run close to five seconds on a loaded machine, so the
       default timeout fails them for being slow rather than wrong -- which
       is the most expensive kind of red there is. */
    testTimeout: 20_000,
  },
})
