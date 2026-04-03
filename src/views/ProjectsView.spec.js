import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProjectsView from './ProjectsView.vue'
import { createTestVuetify } from '../test/vuetify.js'

describe('ProjectsView.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    })
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn(),
      },
      configurable: true,
    })
  })

  it('affiche un message si le contexte n’est pas sécurisé', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
    })
    const wrapper = mount(ProjectsView, {
      global: { plugins: [createTestVuetify()] },
    })
    expect(wrapper.text()).toContain('Fonction disponible uniquement en HTTPS.')

    await wrapper.get('[data-testid="btn-locate"]').trigger('click')
    expect(wrapper.text()).toContain('contexte sécurisé')
  })

  it('affiche la position et la carte quand la géolocalisation réussit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ display_name: 'Paris, France' }),
      }),
    )
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (onSuccess) => {
          onSuccess({ coords: { latitude: 48.8566, longitude: 2.3522 } })
        },
      },
      configurable: true,
    })

    const wrapper = mount(ProjectsView, {
      global: { plugins: [createTestVuetify()] },
    })

    await wrapper.get('[data-testid="btn-locate"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Latitude')
    expect(wrapper.text()).toContain('48.8566')
    expect(wrapper.text()).toContain('Paris, France')
    expect(wrapper.find('iframe.osm-map').exists()).toBe(true)
    expect(wrapper.find('a').attributes('href')).toContain('openstreetmap.org')
  })

  it('affiche un message en cas de refus de permission', async () => {
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_ok, onError) => onError({ code: 1 }),
      },
      configurable: true,
    })
    const wrapper = mount(ProjectsView, {
      global: { plugins: [createTestVuetify()] },
    })
    await wrapper.get('[data-testid="btn-locate"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Permission refusée')
  })
})
