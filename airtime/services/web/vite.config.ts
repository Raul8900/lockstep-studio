import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import { defineConfig } from 'vitest/config'

// VITE_MOCK=1 builds the dashboard with MSW and fixture data instead of a live control service.
const mock = process.env.VITE_MOCK === '1'
const controlUrl = (process.env.CONTROL_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '')

/**
 * Serves (dev) and emits (build) MSW's service worker straight from node_modules, so the mock
 * build always uses the worker that matches the installed msw and nothing generated is committed.
 * Only active in mock mode: the production build never contains the worker.
 */
function mswWorker(): Plugin {
  const workerFile = fileURLToPath(new URL('./node_modules/msw/lib/mockServiceWorker.js', import.meta.url))
  const serve = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use('/mockServiceWorker.js', (_req, res) => {
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache')
      res.end(readFileSync(workerFile))
    })
  }
  return {
    name: 'airtime-msw-worker',
    configureServer: serve,
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'mockServiceWorker.js', source: readFileSync(workerFile, 'utf8') })
    },
  }
}

const proxy = mock
  ? undefined
  : {
      // SSE streams (/api/events, /api/productions/{id}/live) pass through the dev proxy unbuffered.
      '/api': { target: controlUrl, changeOrigin: false },
    }

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(mock ? [mswWorker()] : [])],
  server: { host: '127.0.0.1', port: 5173, proxy },
  preview: { host: '127.0.0.1', port: 4173, proxy },
  // Pages are lazy-loaded routes, so the chart library only loads with the pages that draw charts.
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
})
