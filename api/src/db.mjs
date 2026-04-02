import prismaPackage from '@prisma/client'

const { PrismaClient } = prismaPackage

let prisma = null

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL manquant')
  }
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

export async function ensureSchema() {
  const p = getPrisma()

  // Keep startup idempotent in dev/prod without forcing migrations in runtime.
  await p.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS api_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await p.$executeRawUnsafe(`
    INSERT INTO api_meta (key, value)
    VALUES ('last_deploy_check', '${new Date().toISOString()}')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
  `)

  await p.$executeRawUnsafe(`
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

  await p.$executeRawUnsafe(`
    ALTER TABLE avis ADD COLUMN IF NOT EXISTS whitelisted BOOLEAN NOT NULL DEFAULT FALSE;
  `)
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}
