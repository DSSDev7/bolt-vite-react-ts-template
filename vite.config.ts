import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babelPluginJsxSourceMetadata from './plugins/babel-plugin-jsx-source-metadata.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // Inject source location metadata for double-click-to-edit feature
          babelPluginJsxSourceMetadata
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
