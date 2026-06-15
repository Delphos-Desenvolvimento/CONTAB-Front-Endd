import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
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
        target: 'https://contab-pi.com.br',
        changeOrigin: true
      }
    }
  },
  define: {
    'import.meta.env.VITE_APP_TITLE': JSON.stringify('Contab'),
  },
})
