import crypto from 'node:crypto'

/**
 * Secret pour signer les jetons admin (variable d’environnement ADMIN_SESSION_SECRET).
 * En dev / tests, une valeur par défaut évite de bloquer le projet ; en production,
 * définissez impérativement une phrase longue et aléatoire.
 */
export function getAdminSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    'dev-only-secret-changez-moi-en-production'
  )
}

/** Durée de vie du jeton après connexion (24 h). */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Crée un jeton signé : le serveur peut prouver qu’il l’a émis, sans base de données.
 * Format : payload(base64url) + "." + signature HMAC-SHA256(base64url).
 */
export function createAdminToken(secret = getAdminSessionSecret()) {
  const exp = Date.now() + TOKEN_TTL_MS
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp }),
    'utf8',
  ).toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')
  return `${payload}.${signature}`
}

/**
 * Vérifie la signature et la date d’expiration.
 * @returns {{ ok: true } | { ok: false }}
 */
export function verifyAdminToken(token, secret = getAdminSessionSecret()) {
  if (!token || typeof token !== 'string') {
    return { ok: false }
  }
  const dot = token.indexOf('.')
  if (dot === -1) {
    return { ok: false }
  }
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!payload || !signature) {
    return { ok: false }
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')
  if (signature.length !== expected.length) {
    return { ok: false }
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return { ok: false }
  }
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (json.role !== 'admin' || typeof json.exp !== 'number') {
      return { ok: false }
    }
    if (Date.now() > json.exp) {
      return { ok: false }
    }
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

/**
 * Middleware Express : exige l’en-tête Authorization: Bearer <jeton>.
 */
export function requireAdmin() {
  return (req, res, next) => {
    const secret = getAdminSessionSecret()
    const header = req.headers.authorization
    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'connexion requise' })
    }
    const token = header.slice('Bearer '.length).trim()
    if (!verifyAdminToken(token, secret).ok) {
      return res
        .status(401)
        .json({ ok: false, error: 'session invalide ou expirée' })
    }
    next()
  }
}
