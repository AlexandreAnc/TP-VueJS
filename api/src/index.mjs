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
}

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
