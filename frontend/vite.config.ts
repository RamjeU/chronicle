import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The dataset lives one level up in /data so Python scripts and the app share it.
  server: { fs: { allow: ['..'] } },
})
