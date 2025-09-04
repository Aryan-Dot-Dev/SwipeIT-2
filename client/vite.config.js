import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '.',
        short_name: '.',
        description: 'A Progressive Web App built with React and Vite',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    }), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Proxy function calls during development to avoid CORS with Supabase Functions
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/functions/v1': {
        target: 'https://guzggqrlaexecpzyesxm.supabase.co',
        changeOrigin: true,
        secure: true,
  rewrite: (path) => path.replace(/^\/functions\/v1/, '/functions/v1'),
      },
    },
  },
})
