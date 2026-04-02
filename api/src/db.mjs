import pg from 'pg'

const { Pool } = pg

let pool = null

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL manquant')
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    })
  }
  return pool
}

export async function ensureSchema() {
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
      whitelisted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await p.query(`
    ALTER TABLE avis ADD COLUMN IF NOT EXISTS whitelisted BOOLEAN NOT NULL DEFAULT FALSE;
  `)

}
