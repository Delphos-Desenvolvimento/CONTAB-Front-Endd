import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = (env.VITE_API_URL || '').trim()

  return {
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
          target: apiUrl || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    define: {
      'import.meta.env.VITE_APP_TITLE': JSON.stringify('Contab'),
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  }
})
