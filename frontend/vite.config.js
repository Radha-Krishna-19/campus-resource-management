import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing libraries into their own chunks so
        // browsers cache them independently of app code — the single
        // ~1MB bundle otherwise triggered Vite's chunk-size warning and
        // meant any app change busted the cache for chart/animation code too.
        manualChunks: {
          recharts: ['recharts'],
          'framer-motion': ['framer-motion'],
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    globals: true
  }
})