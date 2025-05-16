// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optional: If you want to ensure assets are served from the root
  // base: './',
  // Optional: Configure server port
  // server: {
  //   port: 3000,
  // },
})
