import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'https://task-manager-fullstack-liart.vercel.app',
        changeOrigin: true,
      },
      '/tasks': {
        target: 'https://task-manager-fullstack-liart.vercel.app',
        changeOrigin: true,
      }
    }
  }
})