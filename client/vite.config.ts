import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGitHubPages = !!process.env.GITHUB_PAGES

export default defineConfig({
  base: isGitHubPages ? '/NotTapTap/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5174'
    }
  }
})
