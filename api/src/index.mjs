import cors from 'cors'
import express from 'express'
import pg from 'pg'

const { Pool } = pg
const PORT = Number(process.env.PORT) || 3000
const DATABASE_URL = process.env.DATABASE_URL

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

let pool = null

function getPool() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL manquant')
  }
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    })
  }
  return pool
}

async function ensureSchema() {
  const p = getPool()
  await p.query(`
    CREATE TABLE IF NOT EXISTS api_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await p.query(`
    INSERT INTO api_meta (key, value)
    VALUES ('last_deploy_check', $1)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
  `, [new Date().toISOString()])

  await p.query(`
    CREATE TABLE IF NOT EXISTS avis (
      id SERIAL PRIMARY KEY,
      author_name TEXT NOT NULL,
      rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      recommends BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

function validateAvisPayload(body) {
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

/** Liste des avis (plus récents en premier). */
app.get('/api/avis', async (req, res) => {
  try {
    const raw = Number(req.query.limit)
    const limit = Number.isFinite(raw) ? Math.min(100, Math.max(1, Math.floor(raw))) : 30
    const p = getPool()
    const { rows } = await p.query(
      `SELECT id, author_name AS name, rating, comment, recommends AS "wouldRecommend", created_at AS "createdAt"
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

/** Création d’un avis (formulaire public). */
app.post('/api/avis', async (req, res) => {
  const v = validateAvisPayload(req.body)
  if (!v.ok) {
    return res.status(400).json({ ok: false, errors: v.errors })
  }
  try {
    const p = getPool()
    const { rows } = await p.query(
      `INSERT INTO avis (author_name, rating, comment, recommends)
       VALUES ($1, $2, $3, $4)
       RETURNING id, author_name AS name, rating, comment, recommends AS "wouldRecommend", created_at AS "createdAt"`,
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

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'not_found' })
})

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL requis (ex. postgresql://user:pass@postgres:5432/db)')
    process.exit(1)
  }
  await ensureSchema()
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API en écoute sur le port ${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
