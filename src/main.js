import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#0078b6',    // Pharmacy blue
          secondary: '#26a69a',  // Teal green
          error: '#d32f2f',      // Red
          success: '#4caf50',    // Green
          warning: '#ff9800',    // Orange
          info: '#2196f3',       // Light blue
          background: '#ffffff', // White
          surface: '#f5f9fc',    // Light blue-gray
        }
      }
    }
  }
})

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.use(i18n)
app.mount('#app')
