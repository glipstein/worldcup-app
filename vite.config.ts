/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to the GitHub repo name so assets resolve correctly on GitHub Pages
// Change this if your repo is named differently
export default defineConfig({
  plugins: [react()],
  base: '/worldcup-app/',
  test: {
    environment: 'node',
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-map': ['react-simple-maps'],
        },
      },
    },
  },
})
