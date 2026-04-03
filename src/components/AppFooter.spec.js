import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppFooter from './AppFooter.vue'
import { createTestVuetify } from '../test/vuetify.js'

describe('AppFooter.vue', () => {
  it('affiche le titre et le lien crédit', () => {
    const wrapper = mount(AppFooter, {
      global: { plugins: [createTestVuetify()] },
    })
    expect(wrapper.text()).toContain('TP VueJS')
    expect(wrapper.find('a[href="https://alexanc.fr"]').exists()).toBe(true)
  })
})
