import { beforeEach, describe, expect, it } from 'vitest'
import { useAuth } from './useAuth.js'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth().logout()
  })

  it('refuse des identifiants incorrects', () => {
    expect(useAuth().login('x', 'y')).toBe(false)
    expect(useAuth().isLoggedIn.value).toBe(false)
  })

  it('accepte admin / admin', () => {
    expect(useAuth().login('admin', 'admin')).toBe(true)
    expect(useAuth().isLoggedIn.value).toBe(true)
    expect(localStorage.getItem('tp_vuejs_auth')).toBe('1')
  })

  it('logout efface la session', () => {
    useAuth().login('admin', 'admin')
    useAuth().logout()
    expect(useAuth().isLoggedIn.value).toBe(false)
    expect(localStorage.getItem('tp_vuejs_auth')).toBeNull()
  })
})
