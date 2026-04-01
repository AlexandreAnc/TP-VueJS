import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { buildRouter } from './router/buildRouter.js'
import { createTestVuetify } from './test/vuetify.js'

describe('App.vue', () => {
  it('affiche la barre de navigation et le pied de page', async () => {
    const router = buildRouter(createMemoryHistory())
    await router.push('/')
    const wrapper = mount(App, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(wrapper.find('header.navbar').exists()).toBe(true)
    expect(wrapper.find('footer.app-footer').exists()).toBe(true)
  })
})
