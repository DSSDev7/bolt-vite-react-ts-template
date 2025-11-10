import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // Inject source location metadata for double-click-to-edit feature
          ['./plugins/babel-plugin-jsx-source-metadata.js']
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
