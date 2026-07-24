import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import manifest from './src/manifest.json'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      port: 5173,
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        admin: 'admin.html',
      },
    },
  },
})
