import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/collect': 'http://localhost:3000',
    },
  },
})
