import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Explicit build path + React support
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist', // 👈 ensures /dist folder is created for Docker
  },
})
