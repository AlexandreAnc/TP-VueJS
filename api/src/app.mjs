import cors from 'cors'
import express from 'express'
import { parseAvisId, validateAvisPayload } from './avisValidation.mjs'
import { verifyRecaptchaV3 } from './recaptcha.mjs'

/**
 * @param {() => import('@prisma/client').PrismaClient} getPrisma
 */
export function createApp(getPrisma) {
  const mapAvis = (a) => ({
    id: a.id,
    name: a.authorName,
    rating: a.rating,
    comment: a.comment,
    wouldRecommend: a.recommends,
    whitelisted: a.whitelisted,
    createdAt: a.createdAt,
  })

  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/', async (_req, res) => {
    const now = new Date().toISOString()
    const uptimeSeconds = Math.round(process.uptime() * 100) / 100
    let dbOk = false
    let dbError = null
    try {
      const p = getPrisma()
      await p.$queryRawUnsafe('SELECT 1 AS one')
      dbOk = true
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err)
    }
    res.json({
      ok: dbOk,
      service: 'tp-vuejs-api',
      db: dbOk ? { ok: true } : { ok: false, error: dbError },
      uptimeSeconds,
      now,
    })
  })

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'tp-vuejs-api' })
  })

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'tp-vuejs-api' })
  })

  app.get('/api/db', async (_req, res) => {
    try {
      const p = getPrisma()
      const rows = await p.$queryRawUnsafe(
        'SELECT current_database() AS db, current_user AS user',
      )
      res.json({ ok: true, postgres: rows[0] || null })
    } catch (err) {
      res.status(503).json({
        ok: false,
        error: err instanceof Error ? err.message : 'erreur postgres',
      })
    }
  })

  app.get('/api/avis/public', async (req, res) => {
    try {
      const raw = Number(req.query.limit)
      const limit = Number.isFinite(raw) ? Math.min(50, Math.max(1, Math.floor(raw))) : 20
      const p = getPrisma()
      const items = await p.avis.findMany({
        where: { whitelisted: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      res.json({ ok: true, items: items.map(mapAvis) })
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'erreur serveur',
      })
    }
  })

  app.get('/api/avis', async (req, res) => {
    try {
      const raw = Number(req.query.limit)
      const limit = Number.isFinite(raw) ? Math.min(100, Math.max(1, Math.floor(raw))) : 30
      const p = getPrisma()
      const items = await p.avis.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      res.json({ ok: true, items: items.map(mapAvis) })
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'erreur serveur',
      })
    }
  })

  app.post('/api/avis', async (req, res) => {
    const v = validateAvisPayload(req.body)
    if (!v.ok) {
      return res.status(400).json({ ok: false, errors: v.errors })
    }
    try {
      const p = getPrisma()
      const item = await p.avis.create({
        data: {
          authorName: v.name,
          rating: v.rating,
          comment: v.comment,
          recommends: v.wouldRecommend,
          whitelisted: false,
        },
      })
      res.status(201).json({ ok: true, item: mapAvis(item) })
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'erreur serveur',
      })
    }
  })

  app.patch('/api/avis/:id', async (req, res) => {
    const id = parseAvisId(req.params.id)
    if (id == null) {
      return res.status(400).json({ ok: false, error: 'id invalide' })
    }
    const w = req.body?.whitelisted
    if (typeof w !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'whitelisted: booléen requis' })
    }
    try {
      const p = getPrisma()
      const existing = await p.avis.findUnique({ where: { id } })
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'avis introuvable' })
      }
      const item = await p.avis.update({
        where: { id },
        data: { whitelisted: w },
      })
      res.json({ ok: true, item: mapAvis(item) })
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'erreur serveur',
      })
    }
  })

  app.delete('/api/avis/:id', async (req, res) => {
    const id = parseAvisId(req.params.id)
    if (id == null) {
      return res.status(400).json({ ok: false, error: 'id invalide' })
    }
    try {
      const p = getPrisma()
      const existing = await p.avis.findUnique({ where: { id } })
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'avis introuvable' })
      }
      await p.avis.delete({ where: { id } })
      res.json({ ok: true, deleted: id })
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'erreur serveur',
      })
    }
  })

  const adminUser = process.env.ADMIN_USERNAME ?? 'admin'
  const adminPass = process.env.ADMIN_PASSWORD ?? 'admin'

  app.post('/api/auth/login', async (req, res) => {
    const { username, password, recaptchaToken } = req.body ?? {}
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ ok: false, error: 'requis' })
    }
    const ip =
      req.ip ||
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined)

    const captcha = await verifyRecaptchaV3(
      typeof recaptchaToken === 'string' ? recaptchaToken : '',
      ip,
    )
    if (!captcha.ok) {
      const status =
        captcha.error === 'recaptcha_secret_manquant' ? 503 : 403
      const userFacing =
        captcha.error === 'recaptcha_secret_manquant'
          ? 'Connexion temporairement indisponible (configuration serveur).'
          : captcha.error === 'recaptcha_score_trop_bas'
            ? 'Tentative refusée (sécurité). Réessayez plus tard.'
            : 'Vérification de sécurité impossible. Rechargez la page et réessayez.'
      return res.status(status).json({ ok: false, error: userFacing })
    }

    if (username !== adminUser || password !== adminPass) {
      return res.status(401).json({
        ok: false,
        error: 'Identifiant ou mot de passe incorrect.',
      })
    }

    res.json({ ok: true })
  })

  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: 'not_found' })
  })

  return app
}
