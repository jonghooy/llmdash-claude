import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  server: {
    port: 3091,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      'www.llmdash.com',
      'llmdash.com',
      '.llmdash.com'
    ],
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});