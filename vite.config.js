import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // In production build VITE_API_URL is baked in — no proxy needed.
  // In dev, proxy /api to the backend (localhost or custom VITE_BACKEND_URL).
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],

    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor:  ['react', 'react-dom', 'react-router-dom'],
            ui:      ['react-hot-toast'],
            http:    ['axios'],
          },
        },
      },
    },
  };
});
