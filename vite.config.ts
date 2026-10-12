import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // the path the site is served from: "/" by default, "/<repo>/" for GitHub Pages (set by the deploy workflow)
  base: process.env.BASE_PATH ?? '/',
})
