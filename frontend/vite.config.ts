import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../static',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    proxy: {
      '/ask': 'http://localhost:50505',
      '/chat': 'http://localhost:50505',
      '/citation': 'http://localhost:50505' // Updated to correct backend port
    }
  }
})
