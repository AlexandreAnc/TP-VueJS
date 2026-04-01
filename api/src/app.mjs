import cors from 'cors'
import express from 'express'
import { parseAvisId, validateAvisPayload } from './avisValidation.mjs'

/**
 * @param {() => import('pg').Pool} getPool
 */
export function createApp(getPool) {
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
      const p = getPool()
      await p.query('SELECT 1 AS one')
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
      const p = getPool()
      const { rows } = await p.query(
        'SELECT current_database() AS db, current_user AS user',
      )
      res.json({ ok: true, postgres: rows[0] })
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
      const p = getPool()
      const { rows } = await p.query(
        `SELECT id, author_name AS name, rating, comment, recommends AS "wouldRecommend", created_at AS "createdAt"
         FROM avis
         WHERE whitelisted = TRUE
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit],
      )
      res.json({ ok: true, items: rows })
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
      const p = getPool()
      const { rows } = await p.query(
        `SELECT id, author_name AS name, rating, comment, recommends AS "wouldRecommend",
                whitelisted, created_at AS "createdAt"
         FROM avis
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit],
      )
      res.json({ ok: true, items: rows })
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
      const p = getPool()
      const { rows } = await p.query(
        `INSERT INTO avis (author_name, rating, comment, recommends, whitelisted)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id, author_name AS name, rating, comment, recommends AS "wouldRecommend", whitelisted, created_at AS "createdAt"`,
        [v.name, v.rating, v.comment, v.wouldRecommend],
      )
      res.status(201).json({ ok: true, item: rows[0] })
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
      const p = getPool()
      const { rowCount, rows } = await p.query(
        `UPDATE avis SET whitelisted = $1 WHERE id = $2
         RETURNING id, author_name AS name, rating, comment, recommends AS "wouldRecommend", whitelisted, created_at AS "createdAt"`,
        [w, id],
      )
      if (!rowCount) {
        return res.status(404).json({ ok: false, error: 'avis introuvable' })
      }
      res.json({ ok: true, item: rows[0] })
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
      const p = getPool()
      const { rowCount } = await p.query('DELETE FROM avis WHERE id = $1', [id])
      if (!rowCount) {
        return res.status(404).json({ ok: false, error: 'avis introuvable' })
      }
      res.json({ ok: true, deleted: id })
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'erreur serveur',
      })
    }
  })

  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: 'not_found' })
  })

  return app
}
