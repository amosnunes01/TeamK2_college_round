import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { handsfreeWsPlugin } from './src/plugins/handsfreeWsPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), handsfreeWsPlugin()],
})
