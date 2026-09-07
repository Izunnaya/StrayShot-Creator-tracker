import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [react(), tailwindcss()],
  test: {
    // The domain layer is plain TypeScript, so tests need no browser
    // environment. Add an environment here if component tests are added later.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
