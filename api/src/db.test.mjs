import { describe, expect, it, vi } from 'vitest'

const executeRaw = vi.fn().mockResolvedValue(1)
const disconnect = vi.fn().mockResolvedValue(undefined)

vi.mock('@prisma/client', () => ({
  default: {
    PrismaClient: vi.fn(function PrismaClient() {
      this.$executeRawUnsafe = executeRaw
      this.$disconnect = disconnect
    }),
  },
}))

process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/test'

const { ensureSchema, getPrisma, disconnectPrisma } = await import('./db.mjs')

describe('db.mjs', () => {
  it('ensureSchema exécute les requêtes DDL et getPrisma expose le client', async () => {
    executeRaw.mockClear()
    await ensureSchema()
    const joined = executeRaw.mock.calls.map((c) => c[0]).join('\n')
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS api_meta')
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS avis')
    expect(joined).toContain('ALTER TABLE avis ADD COLUMN IF NOT EXISTS whitelisted')

    const p = getPrisma()
    expect(typeof p.$executeRawUnsafe).toBe('function')

    await disconnectPrisma()
    expect(disconnect).toHaveBeenCalled()
  })
})
