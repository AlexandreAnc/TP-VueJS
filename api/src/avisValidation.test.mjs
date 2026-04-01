import { describe, expect, it } from 'vitest'
import { parseAvisId, validateAvisPayload } from './avisValidation.mjs'

describe('parseAvisId', () => {
  it('accepte des entiers positifs', () => {
    expect(parseAvisId('1')).toBe(1)
    expect(parseAvisId('42')).toBe(42)
  })

  it('refuse 0, négatifs, décimaux et non numériques', () => {
    expect(parseAvisId('0')).toBeNull()
    expect(parseAvisId('-1')).toBeNull()
    expect(parseAvisId('3.5')).toBeNull()
    expect(parseAvisId('abc')).toBeNull()
    expect(parseAvisId('')).toBeNull()
  })
})

describe('validateAvisPayload', () => {
  const valid = {
    name: 'Jean',
    rating: 4,
    comment: 'abcdefghij',
    wouldRecommend: true,
  }

  it('valide un payload correct', () => {
    const r = validateAvisPayload(valid)
    expect(r.ok).toBe(true)
    expect(r.errors).toHaveLength(0)
    expect(r.name).toBe('Jean')
    expect(r.rating).toBe(4)
    expect(r.comment).toBe('abcdefghij')
    expect(r.wouldRecommend).toBe(true)
  })

  it('rejette un nom trop court ou trop long', () => {
    expect(validateAvisPayload({ ...valid, name: 'a' }).ok).toBe(false)
    expect(validateAvisPayload({ ...valid, name: 'x'.repeat(121) }).ok).toBe(false)
  })

  it('rejette une note hors plage ou non entière', () => {
    expect(validateAvisPayload({ ...valid, rating: 0 }).ok).toBe(false)
    expect(validateAvisPayload({ ...valid, rating: 6 }).ok).toBe(false)
    expect(validateAvisPayload({ ...valid, rating: 3.5 }).ok).toBe(false)
  })

  it('rejette un commentaire trop court ou trop long', () => {
    expect(validateAvisPayload({ ...valid, comment: '123456789' }).ok).toBe(false)
    expect(validateAvisPayload({ ...valid, comment: 'x'.repeat(501) }).ok).toBe(false)
  })

  it('exige wouldRecommend booléen', () => {
    expect(validateAvisPayload({ ...valid, wouldRecommend: 'oui' }).ok).toBe(false)
    expect(validateAvisPayload({ ...valid, wouldRecommend: null }).ok).toBe(false)
  })

  it('trim le nom et le commentaire', () => {
    const r = validateAvisPayload({
      name: '  Bob  ',
      rating: 2,
      comment: '  abcdefghij  ',
      wouldRecommend: false,
    })
    expect(r.ok).toBe(true)
    expect(r.name).toBe('Bob')
    expect(r.comment).toBe('abcdefghij')
  })
})
