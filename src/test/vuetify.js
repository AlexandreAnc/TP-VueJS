import { createVuetify } from 'vuetify'

/** Instance Vuetify minimale pour les tests de composants. */
export function createTestVuetify() {
  return createVuetify({
    theme: { defaultTheme: 'light' },
  })
}
