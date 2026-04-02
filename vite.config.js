import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
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
