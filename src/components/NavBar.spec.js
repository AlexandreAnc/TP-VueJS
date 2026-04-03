import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import NavBar from './NavBar.vue'
import { buildRouter } from '../router/buildRouter.js'
import { useAuth } from '../composables/useAuth.js'
import { createTestVuetify } from '../test/vuetify.js'

describe('NavBar.vue', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth().logout()
  })

  it('affiche les liens principaux', async () => {
    const router = buildRouter(createMemoryHistory())
    await router.push('/')
    const wrapper = mount(NavBar, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Accueil')
    expect(text).toContain('Avis')
    expect(text).toContain('Connexion')
  })

  it('affiche Back Office et déconnexion si connecté', async () => {
    useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/')
    const wrapper = mount(NavBar, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Back Office')
    expect(wrapper.text()).toContain('Déconnexion')
  })

  it('déconnecte au clic sur le bouton Déconnexion', async () => {
    useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/')
    const wrapper = mount(NavBar, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    await wrapper.find('button.btn-logout').trigger('click')
    expect(useAuth().isLoggedIn.value).toBe(false)
  })

  it('ramène à l’accueil si déconnexion depuis le back-office', async () => {
    useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    const wrapper = mount(NavBar, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    await wrapper.find('button.btn-logout').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })
})
