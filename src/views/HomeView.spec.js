import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HomeView from './HomeView.vue'
import { createTestVuetify } from '../test/vuetify.js'

describe('HomeView.vue', () => {
  it('affiche le titre d’accueil', () => {
    const wrapper = mount(HomeView, {
      global: { plugins: [createTestVuetify()] },
    })
    expect(wrapper.find('h1').text()).toContain('Accueil')
  })

  it('propose un lien vers le dépôt GitHub', () => {
    const wrapper = mount(HomeView, {
      global: { plugins: [createTestVuetify()] },
    })
    const link = wrapper.find('a[href="https://github.com/AlexandreAnc/TP-VueJS"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('target')).toBe('_blank')
  })
})
