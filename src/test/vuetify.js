import { createVuetify } from 'vuetify'

/** Instance Vuetify minimale pour les tests de composants. */
export function createTestVuetify() {
  return createVuetify({
    theme: {
      defaultTheme: 'light',
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
}
