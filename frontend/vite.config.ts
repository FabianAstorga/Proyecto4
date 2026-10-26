import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// El AppHost de Aspire inyecta SERVER_HTTP / SERVER_HTTPS.
// El fallback permite levantar el frontend solo con `npm run dev`.
const apiTarget =
  process.env.SERVER_HTTPS ||
  process.env.SERVER_HTTP ||
  'http://localhost:5328';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Las llamadas al backend ASP.NET Core pasan por este proxy en desarrollo.
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
