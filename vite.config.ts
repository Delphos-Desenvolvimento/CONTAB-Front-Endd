import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = (env.VITE_API_URL || '').trim()

  return {
    plugins: [react()],
    base: '/',
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      sourcemap: false,
      // Skipping gzip size reporting saves noticeable time on large MUI bundles
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          // Keep React out of library chunks — splitting recharts/d3 away from React
          // caused "can't access property useState, X is undefined" at runtime.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom', 'scheduler'],
            mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            tiptap: [
              '@tiptap/react',
              '@tiptap/starter-kit',
              '@tiptap/extension-color',
              '@tiptap/extension-font-family',
              '@tiptap/extension-heading',
              '@tiptap/extension-image',
              '@tiptap/extension-link',
              '@tiptap/extension-text-align',
              '@tiptap/extension-text-style',
              '@tiptap/extension-underline',
            ],
          },
        },
      },
    },
    esbuild: {
      legalComments: 'none',
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
