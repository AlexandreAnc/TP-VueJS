import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { buildRouter } from './buildRouter.js'

describe('buildRouter', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth().logout()
  })

  it('utilise startViewTransition pour la navigation si disponible', async () => {
    const svt = vi.fn((cb) => {
      cb()
      return { finished: Promise.resolve(), ready: Promise.resolve() }
    })
    const original = document.startViewTransition
    document.startViewTransition = svt
    try {
      const router = buildRouter(createMemoryHistory())
      await router.push('/')
      await router.push('/avis')
      expect(svt).toHaveBeenCalled()
    } finally {
      document.startViewTransition = original
    }
  })

  it('redirige /back-office vers login si non connecté', async () => {
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/back-office')
  })

  it('autorise /back-office si connecté', async () => {
    useAuth().login('admin', 'admin')
    const router = buildRouter(createMemoryHistory())
    await router.push('/back-office')
    expect(router.currentRoute.value.name).toBe('back-office')
  })

  it('laisse passer les routes publiques', async () => {
    const router = buildRouter(createMemoryHistory())
    await router.push('/avis')
    expect(router.currentRoute.value.name).toBe('avis')
  })
})
