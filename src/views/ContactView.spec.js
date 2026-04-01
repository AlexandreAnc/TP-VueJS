import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ContactView from './ContactView.vue'

describe('ContactView.vue', () => {
  it('affiche le titre', () => {
    const wrapper = mount(ContactView)
    expect(wrapper.find('h1').text()).toContain('Contact')
  })
})
