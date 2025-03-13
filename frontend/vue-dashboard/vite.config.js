import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/conversations': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/conversations/, '/api/conversations')
      },
      '/api/auth': {
        target: 'http://localhost:3013',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, '')
      },
      '/api/memory': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/memory/, '/api/memory')
      },
      '/api/filesystem': {
        target: 'http://localhost:3012',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/filesystem/, '')
      },
      '/api/brave-search': {
        target: 'http://localhost:3014',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/brave-search/, '')
      },
      '/api/ollama': {
        target: 'http://localhost:3015',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '')
      }
    }
  },
  // Reduce file watchers to avoid ENOSPC error
  optimizeDeps: {
    include: ['vue']
  },
  fs: {
    strict: false
  }
});