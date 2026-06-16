import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const productionApiUrl = 'https://contab-pi.com.br'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index-d3394580.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: productionApiUrl,
        changeOrigin: true
      }
    }
  },
  define: {
    'import.meta.env.VITE_APP_TITLE': JSON.stringify('Contab'),
    'import.meta.env.VITE_API_URL': JSON.stringify(productionApiUrl),
  },
})
