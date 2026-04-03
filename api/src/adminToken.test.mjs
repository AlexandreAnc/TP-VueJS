import { describe, expect, it } from 'vitest'
import {
  createAdminToken,
  verifyAdminToken,
} from './adminToken.mjs'

describe('adminToken', () => {
  const secret = 'test-secret-fixe-pour-les-tests'

  it('accepte un jeton fraîchement créé', () => {
    const token = createAdminToken(secret)
    expect(verifyAdminToken(token, secret)).toEqual({ ok: true })
  })

  it('refuse si le secret ne correspond pas', () => {
    const token = createAdminToken(secret)
    expect(verifyAdminToken(token, 'autre-secret').ok).toBe(false)
  })

  it('refuse un jeton trafiqué', () => {
    const token = createAdminToken(secret)
    const broken = token.slice(0, -3) + 'xxx'
    expect(verifyAdminToken(broken, secret).ok).toBe(false)
  })

  it('refuse une chaîne vide', () => {
    expect(verifyAdminToken('', secret).ok).toBe(false)
  })
})
