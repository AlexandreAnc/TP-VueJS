import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAdminToken } from '../../api/src/adminToken.mjs'
import { useAuth } from './useAuth.js'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth().logout()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('refuse des identifiants incorrects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ ok: false }),
      }),
    )
    expect(await useAuth().login('x', 'y')).toBe(false)
    expect(useAuth().isLoggedIn.value).toBe(false)
  })

  it('accepte admin / admin quand l’API renvoie un jeton', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ ok: true, token: createAdminToken() }),
      }),
    )
    expect(await useAuth().login('admin', 'admin')).toBe(true)
    expect(useAuth().isLoggedIn.value).toBe(true)
    expect(localStorage.getItem('tp_vuejs_admin_token')).toBeTruthy()
  })

  it('logout efface la session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ ok: true, token: createAdminToken() }),
      }),
    )
    await useAuth().login('admin', 'admin')
    useAuth().logout()
    expect(useAuth().isLoggedIn.value).toBe(false)
    expect(localStorage.getItem('tp_vuejs_admin_token')).toBeNull()
  })
})
