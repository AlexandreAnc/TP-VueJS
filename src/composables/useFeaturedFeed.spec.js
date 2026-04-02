import { beforeEach, describe, expect, it, vi } from 'vitest'

function mockFetchResponse({ ok = true, items = [], error = 'err' } = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(ok ? { items } : { error }),
  })
}

describe('useFeaturedFeed', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('setAppBadge appelle navigator.setAppBadge avec un minimum de 1', async () => {
    const setAppBadgeMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { setAppBadge: setAppBadgeMock },
      configurable: true,
    })
    const mod = await import('./useFeaturedFeed.js')
    await mod.setAppBadge(0)
    expect(setAppBadgeMock).toHaveBeenCalledWith(1)
  })

  it('clearAppBadge appelle navigator.clearAppBadge si disponible', async () => {
    const clearMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { clearAppBadge: clearMock },
      configurable: true,
    })
    const mod = await import('./useFeaturedFeed.js')
    await mod.clearAppBadge()
    expect(clearMock).toHaveBeenCalled()
  })

  it('loadFeatured initialise le bootstrap et les ids vus au premier chargement', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ items: [{ id: 1, name: 'A' }] }))
    const mod = await import('./useFeaturedFeed.js')
    await mod.loadFeatured()

    expect(mod.featured.value).toHaveLength(1)
    expect(localStorage.getItem('tp_vuejs_featured_bootstrapped')).toBe('1')
    expect(localStorage.getItem('tp_vuejs_featured_ids')).toBe('[1]')
  })

  it('loadFeatured expose une erreur si la réponse API est non-ok', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ ok: false, error: 'serveur' }))
    const mod = await import('./useFeaturedFeed.js')
    await mod.loadFeatured()
    expect(mod.featured.value).toEqual([])
    expect(mod.featuredError.value).toBe('serveur')
  })

  it('loadFeatured envoie notif + badge pour des ids frais après bootstrap', async () => {
    localStorage.setItem('tp_vuejs_featured_bootstrapped', '1')
    localStorage.setItem('tp_vuejs_featured_ids', '[1]')
    localStorage.setItem('tp_vuejs_notif_enabled', '1')

    const setAppBadgeMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { setAppBadge: setAppBadgeMock },
      configurable: true,
    })

    const NotificationMock = vi.fn()
    NotificationMock.permission = 'granted'
    vi.stubGlobal('Notification', NotificationMock)
    vi.stubGlobal('fetch', mockFetchResponse({ items: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] }))

    const mod = await import('./useFeaturedFeed.js')
    await mod.loadFeatured()

    expect(NotificationMock).toHaveBeenCalledTimes(1)
    expect(setAppBadgeMock).toHaveBeenCalledWith(1)
  })

  it('acknowledgeFeaturedSeen met à jour les ids vus et efface la pastille', async () => {
    localStorage.setItem('tp_vuejs_featured_bootstrapped', '1')
    localStorage.setItem('tp_vuejs_featured_ids', '[]')
    const clearMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', {
      value: { clearAppBadge: clearMock },
      configurable: true,
    })
    vi.stubGlobal('fetch', mockFetchResponse({ items: [{ id: 9, name: 'Z' }] }))
    const mod = await import('./useFeaturedFeed.js')

    await mod.acknowledgeFeaturedSeen()

    expect(localStorage.getItem('tp_vuejs_featured_ids')).toBe('[9]')
    expect(clearMock).toHaveBeenCalled()
  })

  it('startFeaturedPolling ne crée qu’un seul intervalle et stop le nettoie', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', mockFetchResponse({ items: [] }))
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const mod = await import('./useFeaturedFeed.js')

    mod.startFeaturedPolling()
    mod.startFeaturedPolling()
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    mod.stopFeaturedPolling()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
