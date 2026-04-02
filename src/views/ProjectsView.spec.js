import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProjectsView from './ProjectsView.vue'
import { createTestVuetify } from '../test/vuetify.js'

describe('ProjectsView.vue', () => {
  it('affiche le titre', () => {
    const wrapper = mount(ProjectsView, {
      global: { plugins: [createTestVuetify()] },
    })
    expect(wrapper.find('h1').text()).toContain('Vos Contacts')
  })
})
