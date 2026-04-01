import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import LoginView from './LoginView.vue'
import { buildRouter } from '../router/buildRouter.js'
import { useAuth } from '../composables/useAuth.js'
import { createTestVuetify } from '../test/vuetify.js'

describe('LoginView.vue', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth().logout()
  })

  it('affiche une erreur si identifiants invalides', async () => {
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

  it('connecte avec admin / admin', async () => {
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
  })

  it('redirige depuis /login si la session est déjà active', async () => {
    useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/login')
    mount(LoginView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })
})
