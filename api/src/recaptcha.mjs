/**
 * Vérifie un jeton reCAPTCHA v3 auprès de Google.
 * @param {string} token
 * @param {string} [remoteIp]
 * @returns {Promise<{ ok: boolean, error?: string, score?: number }>}
 */
export async function verifyRecaptchaV3(token, remoteIp) {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'recaptcha_token_manquant' }
  }

  if (process.env.NODE_ENV !== 'production' && process.env.RECAPTCHA_SKIP_VERIFY === '1') {
    return { ok: true, score: 1 }
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    return { ok: false, error: 'recaptcha_secret_manquant' }
  }

  const params = new URLSearchParams({ secret, response: token })
  if (remoteIp) {
    params.append('remoteip', remoteIp)
  }

  let data
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    data = await res.json()
  } catch {
    return { ok: false, error: 'recaptcha_google_inaccessible' }
  }

  if (!data.success) {
    return { ok: false, error: 'recaptcha_invalide' }
  }

  if (data.action && data.action !== 'login') {
    return { ok: false, error: 'recaptcha_action_invalide' }
  }

  const score = Number(data.score)
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? 0.5)
  if (!Number.isFinite(score) || score < minScore) {
    return { ok: false, error: 'recaptcha_score_trop_bas', score }
  }

  return { ok: true, score }
}
