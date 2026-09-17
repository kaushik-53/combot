import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    // Tailwind v4 uses a Vite plugin instead of PostCSS — no tailwind.config.js needed
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls in dev so CORS and cookies work without a separate origin
      '/api': {
        target:      'http://localhost:5000',
        changeOrigin: true,
        // Ensure the refresh cookie is forwarded correctly
        cookiePathRewrite: { '/api/auth/refresh': '/api/auth/refresh' },
      },
    },
  },
});
