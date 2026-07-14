import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { serviceWorkerPlugin } from './vite-plugin-sw'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://arti47.github.io/fallout-solo/ on GitHub Pages
  base: '/fallout-solo/',
  plugins: [react(), tailwindcss(), serviceWorkerPlugin()],
})
