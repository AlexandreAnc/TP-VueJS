import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HomeView from './HomeView.vue'

describe('HomeView.vue', () => {
  it('affiche le titre d’accueil', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.find('h1').text()).toContain('Accueil')
  })
})
