import { describe, expect, it, vi } from 'vitest'

const query = vi.fn().mockResolvedValue({ rows: [] })

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(function Pool() {
      this.query = query
    }),
  },
}))

process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/test'

const { ensureSchema, getPool } = await import('./db.mjs')

describe('db.mjs', () => {
  it('ensureSchema exécute les requêtes DDL et getPool utilise query', async () => {
    query.mockClear()
    await ensureSchema()
    const joined = query.mock.calls.map((c) => c[0]).join('\n')
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS api_meta')
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS avis')
    expect(joined).toContain('ALTER TABLE avis ADD COLUMN IF NOT EXISTS whitelisted')

    const p = getPool()
    query.mockClear()
    await p.query('SELECT 1')
    expect(query).toHaveBeenCalledWith('SELECT 1')
  })
})
