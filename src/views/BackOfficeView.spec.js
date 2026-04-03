import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAdminToken } from '../../api/src/adminToken.mjs'
import BackOfficeView from './BackOfficeView.vue'
import { buildRouter } from '../router/buildRouter.js'
import { useAuth } from '../composables/useAuth.js'
import { createTestVuetify } from '../test/vuetify.js'

const sampleItem = {
  id: 1,
  name: 'Alice',
  rating: 4,
  comment: '12345678901234567890',
  wouldRecommend: true,
  whitelisted: false,
  createdAt: '2020-01-01T00:00:00.000Z',
}

function loginFetchResult() {
  return {
    ok: true,
    json: () =>
      Promise.resolve({ ok: true, token: createAdminToken() }),
  }
}

describe('BackOfficeView.vue', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth().logout()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('charge la liste des avis (GET /api/avis) pour un admin connecté', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (String(url).includes('auth/login')) {
          return Promise.resolve(loginFetchResult())
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, items: [] }),
        })
      }),
    )
    await useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    mount(BackOfficeView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(globalThis.fetch).toHaveBeenCalled()
    expect(
      globalThis.fetch.mock.calls.some((c) => String(c[0]).includes('/api/avis')),
    ).toBe(true)
  })

  it('affiche les lignes retournées par l’API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (String(url).includes('auth/login')) {
          return Promise.resolve(loginFetchResult())
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, items: [sampleItem] }),
        })
      }),
    )
    await useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    const wrapper = mount(BackOfficeView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('En attente')
  })

  it('affiche une erreur si l’API liste échoue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (String(url).includes('auth/login')) {
          return Promise.resolve(loginFetchResult())
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'down' }),
        })
      }),
    )
    await useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    const wrapper = mount(BackOfficeView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('down')
  })

  it('appelle PATCH puis recharge la liste au clic sur « À la une »', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(loginFetchResult())
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, items: [sampleItem] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            item: { ...sampleItem, whitelisted: true },
          }),
      })
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            items: [{ ...sampleItem, whitelisted: true }],
          }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    const wrapper = mount(BackOfficeView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()

    const btn = wrapper.findAll('button').find((b) => b.text().includes('À la une'))
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/avis/1'),
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('appelle DELETE au clic sur Supprimer', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(loginFetchResult())
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, items: [sampleItem] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, deleted: 1 }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, items: [] }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    const wrapper = mount(BackOfficeView, {
      global: { plugins: [createTestVuetify(), router] },
    })
    await flushPromises()

    const deleteBtn = wrapper.findAll('button').find((b) => b.text().includes('Supprimer'))
    expect(deleteBtn).toBeTruthy()
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/avis/1'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
