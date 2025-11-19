import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Organizador Financiero Pro',
        short_name: 'Finanzas Pro',
        description: 'Una aplicación web intuitiva para organizar tus ingresos mensuales, asignar presupuestos a diferentes categorías de gastos y visualizar la distribución de tu dinero de manera clara y efectiva.',
        theme_color: '#171717',
        background_color: '#171717',
        display: 'standalone',
        scope: command === 'build' ? '/WAPP/' : '/',
        start_url: command === 'build' ? '/WAPP/' : '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
}));