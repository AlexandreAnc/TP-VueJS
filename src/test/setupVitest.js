/**
 * Polyfills navigateur manquants dans jsdom (Vuetify 4 : ResizeObserver, etc.).
 */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock
