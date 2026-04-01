/** Validation des payloads POST /api/avis (réutilisable côté tests). */

export function parseAvisId(param) {
  const id = Number(param)
  if (!Number.isInteger(id) || id < 1) return null
  return id
}

export function validateAvisPayload(body) {
  const errors = []
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const rating = body?.rating
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : ''
  const wouldRecommend = body?.wouldRecommend

  if (name.length < 2 || name.length > 120) {
    errors.push('name: entre 2 et 120 caractères')
  }
  const r = Number(rating)
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    errors.push('rating: entier entre 1 et 5')
  }
  if (comment.length < 10 || comment.length > 500) {
    errors.push('comment: entre 10 et 500 caractères')
  }
  if (typeof wouldRecommend !== 'boolean') {
    errors.push('wouldRecommend: booléen requis')
  }
  return { ok: errors.length === 0, errors, name, rating: r, comment, wouldRecommend }
}
