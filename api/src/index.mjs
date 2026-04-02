import { createApp } from './app.mjs'
import { ensureSchema, getPrisma } from './db.mjs'

const PORT = Number(process.env.PORT) || 3000

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL requis (ex. postgresql://user:pass@postgres:5432/db)')
    process.exit(1)
  }
  await ensureSchema()
  const app = createApp(getPrisma)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API en écoute sur le port ${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
