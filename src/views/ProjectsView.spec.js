import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProjectsView from './ProjectsView.vue'

describe('ProjectsView.vue', () => {
  it('affiche le titre', () => {
    const wrapper = mount(ProjectsView)
    expect(wrapper.find('h1').text()).toContain('Vos Projets')
  })
})
