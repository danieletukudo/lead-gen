import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://lead-gen-aes4.onrender.com',  // Local development
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/health': {
        target: 'https://lead-gen-aes4.onrender.com',
        changeOrigin: true,
      }
    }
  }
})

