import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// @ts-ignore
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
  },
})
