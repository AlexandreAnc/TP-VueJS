import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { buildRouter } from './router/buildRouter.js'
import { createTestVuetify } from './test/vuetify.js'

const { startFeaturedPollingMock } = vi.hoisted(() => ({
  startFeaturedPollingMock: vi.fn(),
}))

vi.mock('./composables/useFeaturedFeed.js', () => ({
  startFeaturedPolling: startFeaturedPollingMock,
}))

describe('App.vue', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  async function mountApp() {
    const { default: App } = await import('./App.vue')
    const router = buildRouter(createMemoryHistory())
    await router.push('/')
    const wrapper = mount(App, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    return wrapper
  }

  it('démarre le polling des avis mis en avant au montage', async () => {
    await mountApp()
    expect(startFeaturedPollingMock).toHaveBeenCalledTimes(1)
  })

  it('demande la permission Notification quand elle est à default', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'default'
    NotificationMock.requestPermission = requestPermission
    vi.stubGlobal('Notification', NotificationMock)

    await mountApp()

    expect(requestPermission).toHaveBeenCalledTimes(1)
  })

  it('n’essaie pas de redemander la permission si déjà décidée', async () => {
    const requestPermission = vi.fn().mockResolvedValue('denied')
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'denied'
    NotificationMock.requestPermission = requestPermission
    vi.stubGlobal('Notification', NotificationMock)

    await mountApp()

    expect(requestPermission).not.toHaveBeenCalled()
  })
})
