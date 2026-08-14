import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy every /students, /admin, /auth, /health, /roadmaps, /mentors
      // call through Vite so the browser sees same-origin — no CORS needed.
      '/students': { target: 'http://localhost:8000', changeOrigin: true },
      '/admin':    { target: 'http://localhost:8000', changeOrigin: true },
      '/auth':     { target: 'http://localhost:8000', changeOrigin: true },
      '/health':   { target: 'http://localhost:8000', changeOrigin: true },
      '/roadmaps': { target: 'http://localhost:8000', changeOrigin: true },
      '/mentors':  { target: 'http://localhost:8000', changeOrigin: true },
    }
  }
})
