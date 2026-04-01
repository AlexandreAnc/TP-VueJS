import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AboutView from './AboutView.vue'

describe('AboutView.vue', () => {
  it('affiche le titre', () => {
    const wrapper = mount(AboutView)
    expect(wrapper.find('h1').text()).toContain('A propos')
  })
})
