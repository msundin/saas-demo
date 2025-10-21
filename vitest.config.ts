import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        '.next/',
        'vitest.setup.ts',
        '**/*.config.{ts,js}',
        '**/types/**',
        '**/*.d.ts',
        '**/__tests__/**',
        'src/app/**/page.tsx', // Page wrappers (just layout)
        'src/app/**/layout.tsx', // Layout components
        'src/middleware.ts', // Middleware (E2E tested)
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
