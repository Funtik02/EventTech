import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Запросы /api уходят на Express-сервер из папки server/
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
