import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@ai-video-editor/shared': resolve(__dirname, '../../packages/shared/src')
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    // Enable CORS for Electron
    cors: true,
    // Allow external connections
    hmr: {
      port: 3000
    },
    // Add a test route to verify the server is working
    proxy: {
      '/test': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/test/, '')
      }
    }
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  // Ensure proper asset handling in Electron
  publicDir: 'public'
});
