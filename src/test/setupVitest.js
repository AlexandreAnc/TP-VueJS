import { vi } from 'vitest'

vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'test-recaptcha-site-key')
vi.stubEnv('VITE_RECAPTCHA_DEV_BYPASS', '0')

/**
 * Polyfills navigateur manquants dans jsdom (Vuetify 4 : ResizeObserver, etc.).
 */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock
