import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import AvisView from './AvisView.vue'
import { buildRouter } from '../router/buildRouter.js'
import { createTestVuetify } from '../test/vuetify.js'

describe('AvisView.vue', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, items: [] }),
        }),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('charge les avis publics au montage', async () => {
    const router = buildRouter(createMemoryHistory())
    await router.push('/avis')
    mount(AvisView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('affiche le titre et la section formulaire', async () => {
    const router = buildRouter(createMemoryHistory())
    await router.push('/avis')
    const wrapper = mount(AvisView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(wrapper.find('h1').text()).toContain('Avis')
    expect(wrapper.text()).toContain('Laisser un avis')
  })

  it('affiche une carte pour chaque avis public retourné', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              items: [
                {
                  id: 1,
                  name: 'Visiteur',
                  rating: 5,
                  comment: '12345678901234567890',
                  wouldRecommend: true,
                  createdAt: '2020-06-15T12:00:00.000Z',
                },
              ],
            }),
        }),
      ),
    )
    const router = buildRouter(createMemoryHistory())
    await router.push('/avis')
    const wrapper = mount(AvisView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Visiteur')
    expect(wrapper.text()).toContain('5/5')
  })

  it('affiche un avertissement si le chargement des avis publics échoue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'serveur' }),
        }),
      ),
    )
    const router = buildRouter(createMemoryHistory())
    await router.push('/avis')
    const wrapper = mount(AvisView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(wrapper.text()).toMatch(/Impossible de charger|serveur/)
  })

  it('soumet le formulaire complet avec succès', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, items: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, item: { id: 99 } }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const router = buildRouter(createMemoryHistory())
    await router.push('/avis')
    const wrapper = mount(AvisView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    wrapper.vm.form.name = 'Jean'
    wrapper.vm.form.rating = 5
    wrapper.vm.form.comment = 'Commentaire suffisamment long pour passer la validation'
    wrapper.vm.form.wouldRecommend = true
    wrapper.vm.step = 3
    await wrapper.vm.$nextTick()

    await wrapper.findAll('button').find((b) => b.text().includes('Valider l’avis')).trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Votre avis a bien été enregistré')
  })

  it('affiche une erreur quand la soumission API échoue', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, items: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ errors: ['name: invalide'] }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const router = buildRouter(createMemoryHistory())
    await router.push('/avis')
    const wrapper = mount(AvisView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    wrapper.vm.form.name = 'Jean'
    wrapper.vm.form.rating = 4
    wrapper.vm.form.comment = 'Commentaire suffisamment long pour passer la validation'
    wrapper.vm.form.wouldRecommend = true
    wrapper.vm.step = 3
    await wrapper.vm.$nextTick()
    await wrapper.findAll('button').find((b) => b.text().includes('Valider l’avis')).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('name: invalide')
  })
})
