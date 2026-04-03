import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './assets/main.css'
import { createVuetify } from 'vuetify'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { readStoredTheme } from './config/themeStorage.js'

const initialTheme = readStoredTheme()
if (typeof document !== 'undefined' && initialTheme === 'dark') {
  document.documentElement.classList.add('theme-dark')
}

const vuetify = createVuetify({
  theme: {
    defaultTheme: initialTheme,
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#975b7f',
          surface: '#ffffff',
          background: '#f9f6f8',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#dfbcd6',
          surface: '#1e1a22',
          background: '#121016',
        },
      },
    },
  },
})

createApp(App).use(vuetify).use(router).mount('#app')
