import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      template: {
        compilerOptions: {
          // Treat all tags with a dash or custom tags like 'webview' as custom elements
          isCustomElement: (tag) => ['webview'].includes(tag),
        }
      }
    })
  ],
})