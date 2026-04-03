import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAdminToken } from '../../api/src/adminToken.mjs'
import LoginView from './LoginView.vue'
import { buildRouter } from '../router/buildRouter.js'
import { useAuth } from '../composables/useAuth.js'
import { createTestVuetify } from '../test/vuetify.js'

describe('LoginView.vue', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth().logout()
    vi.stubGlobal('grecaptcha', {
      ready: (cb) => {
        cb?.()
      },
      execute: vi.fn().mockResolvedValue('test-recaptcha-token'),
    })
    globalThis.fetch = vi.fn()
  })

  it('affiche une erreur si l’API refuse les identifiants', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: 'Identifiant ou mot de passe incorrect.',
        }),
    })
    const router = buildRouter(createMemoryHistory())
    await router.push('/login')
    const wrapper = mount(LoginView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await wrapper.find('input[name="username"]').setValue('bad')
    await wrapper.find('input[name="password"]').setValue('bad')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(wrapper.text()).toContain('incorrect')
  })

  it('POST /api/auth/login puis session active si identifiants valides', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ ok: true, token: createAdminToken() }),
    })
    const router = buildRouter(createMemoryHistory())
    await router.push('/login')
    const wrapper = mount(LoginView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await wrapper.find('input[name="username"]').setValue('admin')
    await wrapper.find('input[name="password"]').setValue('admin')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(useAuth().isLoggedIn.value).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
