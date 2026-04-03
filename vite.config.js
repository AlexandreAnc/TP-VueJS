import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import vuetify from 'vite-plugin-vuetify'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const root = fileURLToPath(new URL('.', import.meta.url))
  // En `vite build`, Vite ne charge pas `.env.development` : on fusionne pour garder la clé publique reCAPTCHA si elle n’est que là.
  const envForMode = loadEnv(mode, root, 'VITE_')
  const envForDev = loadEnv('development', root, 'VITE_')
  const recaptchaSiteKey = (
    envForMode.VITE_RECAPTCHA_SITE_KEY ||
    envForDev.VITE_RECAPTCHA_SITE_KEY ||
    ''
  ).trim()

  return {
    define: {
      __RECAPTCHA_SITE_KEY__: JSON.stringify(recaptchaSiteKey),
    },
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'TP VueJS',
          short_name: 'TP VueJS',
          description:
            'Application web — TP Vue.js : avis, fonctionnalités et back-office.',
          theme_color: '#975b7f',
          background_color: '#f9f6f8',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          lang: 'fr',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
          globIgnores: [
            '**/materialdesignicons-webfont-*.ttf',
            '**/materialdesignicons-webfont-*.eot',
            '**/materialdesignicons-webfont-*.woff',
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
        devOptions: {
          enabled: false,
        },
      }),
      vueDevTools(),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
