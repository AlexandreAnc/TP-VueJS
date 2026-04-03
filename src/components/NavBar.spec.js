import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAdminToken } from '../../api/src/adminToken.mjs'
import NavBar from './NavBar.vue'
import { buildRouter } from '../router/buildRouter.js'
import { useAuth } from '../composables/useAuth.js'
import { createTestVuetify } from '../test/vuetify.js'

describe('NavBar.vue', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth().logout()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('déconnecte au clic et met à jour la session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ ok: true, token: createAdminToken() }),
      }),
    )
    await useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/')
    const wrapper = mount(NavBar, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    await wrapper.find('[data-testid="btn-logout"]').trigger('click')
    expect(useAuth().isLoggedIn.value).toBe(false)
  })

  it('redirige vers l’accueil si déconnexion depuis le back-office', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ ok: true, token: createAdminToken() }),
      }),
    )
    await useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    const wrapper = mount(NavBar, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    await wrapper.find('[data-testid="btn-logout"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })
})
