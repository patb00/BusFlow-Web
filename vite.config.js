import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is '/' for a root deploy (own domain) and '/<repo>/' on GitHub Pages, where the site
// lives in a subdirectory. The workflow sets VITE_BASE; everything else derives from it
// (asset URLs, the router basename, the 404 redirect).
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
