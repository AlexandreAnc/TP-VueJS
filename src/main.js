import 'vuetify/styles'
import './assets/main.css'
import { createVuetify } from 'vuetify'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
  },
})

createApp(App).use(vuetify).use(router).mount('#app')
