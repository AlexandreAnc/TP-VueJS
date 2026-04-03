import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdminToken } from './adminToken.mjs'
import { createApp } from './app.mjs'

function adminAuthHeader() {
  return { Authorization: `Bearer ${createAdminToken()}` }
}

function makePrisma() {
  return {
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ one: 1 }]),
    avis: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
}

describe('createApp', () => {
  it('GET /health retourne ok', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.service).toBe('tp-vuejs-api')
  })

  it('GET /api/health retourne ok', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('GET / appelle la base et expose uptime', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.service).toBe('tp-vuejs-api')
    expect(typeof res.body.uptimeSeconds).toBe('number')
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled()
  })

  it('GET / échoue gracieusement si la base rejette', async () => {
    const prisma = makePrisma()
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('down'))
    const app = createApp(() => prisma)
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(false)
    expect(res.body.db.ok).toBe(false)
  })

  it('GET /api/db retourne postgres en succès', async () => {
    const prisma = makePrisma()
    prisma.$queryRawUnsafe.mockResolvedValue([{ db: 'testdb', user: 'u' }])
    const app = createApp(() => prisma)
    const res = await request(app).get('/api/db')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.postgres.db).toBe('testdb')
  })

  it('GET /api/db retourne 503 si erreur', async () => {
    const prisma = makePrisma()
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('refused'))
    const app = createApp(() => prisma)
    const res = await request(app).get('/api/db')
    expect(res.status).toBe(503)
    expect(res.body.ok).toBe(false)
  })

  it('GET /api/avis/public respecte la limite par défaut', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).get('/api/avis/public')
    expect(res.status).toBe(200)
    expect(res.body.items).toEqual([])
    expect(prisma.avis.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    )
  })

  it('GET /api/avis/public borne limit', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    await request(app).get('/api/avis/public?limit=999')
    expect(prisma.avis.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    )
  })

  it('GET /api/avis 401 sans jeton admin', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).get('/api/avis')
    expect(res.status).toBe(401)
    expect(prisma.avis.findMany).not.toHaveBeenCalled()
  })

  it('GET /api/avis liste avec whitelisted', async () => {
    const row = {
      id: 1,
      authorName: 'A',
      rating: 5,
      comment: 'abcdefghij',
      recommends: true,
      whitelisted: false,
      createdAt: '2020-01-01T00:00:00.000Z',
    }
    const prisma = makePrisma()
    prisma.avis.findMany.mockResolvedValue([row])
    const app = createApp(() => prisma)
    const res = await request(app).get('/api/avis').set(adminAuthHeader())
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].whitelisted).toBe(false)
  })

  it('GET /api/avis retourne 500 si query échoue', async () => {
    const prisma = makePrisma()
    prisma.avis.findMany.mockRejectedValue(new Error('boom'))
    const app = createApp(() => prisma)
    const res = await request(app).get('/api/avis').set(adminAuthHeader())
    expect(res.status).toBe(500)
    expect(res.body.ok).toBe(false)
  })

  it('GET /api/avis/public retourne 500 si query échoue', async () => {
    const prisma = makePrisma()
    prisma.avis.findMany.mockRejectedValue(new Error('boom'))
    const app = createApp(() => prisma)
    const res = await request(app).get('/api/avis/public')
    expect(res.status).toBe(500)
  })

  it('PATCH /api/avis/:id 401 sans jeton', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app)
      .patch('/api/avis/1')
      .send({ whitelisted: false })
    expect(res.status).toBe(401)
    expect(prisma.avis.findUnique).not.toHaveBeenCalled()
  })

  it('PATCH /api/avis/:id 500 si update échoue', async () => {
    const prisma = makePrisma()
    prisma.avis.findUnique.mockResolvedValue({ id: 1 })
    prisma.avis.update.mockRejectedValue(new Error('db'))
    const app = createApp(() => prisma)
    const res = await request(app)
      .patch('/api/avis/1')
      .set(adminAuthHeader())
      .send({ whitelisted: false })
    expect(res.status).toBe(500)
  })

  it('DELETE /api/avis/:id 401 sans jeton', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).delete('/api/avis/1')
    expect(res.status).toBe(401)
    expect(prisma.avis.findUnique).not.toHaveBeenCalled()
  })

  it('DELETE /api/avis/:id 500 si delete échoue', async () => {
    const prisma = makePrisma()
    prisma.avis.findUnique.mockResolvedValue({ id: 1 })
    prisma.avis.delete.mockRejectedValue(new Error('db'))
    const app = createApp(() => prisma)
    const res = await request(app).delete('/api/avis/1').set(adminAuthHeader())
    expect(res.status).toBe(500)
  })

  it('POST /api/avis 400 si validation échoue', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).post('/api/avis').send({ name: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.errors.length).toBeGreaterThan(0)
    expect(prisma.avis.create).not.toHaveBeenCalled()
  })

  it('POST /api/avis 201 et insère', async () => {
    const inserted = {
      id: 9,
      authorName: 'Marie',
      rating: 5,
      comment: 'abcdefghij',
      recommends: true,
      whitelisted: false,
      createdAt: '2020-01-01T00:00:00.000Z',
    }
    const prisma = makePrisma()
    prisma.avis.create.mockResolvedValue(inserted)
    const app = createApp(() => prisma)
    const res = await request(app)
      .post('/api/avis')
      .send({
        name: 'Marie',
        rating: 5,
        comment: 'abcdefghij',
        wouldRecommend: true,
      })
    expect(res.status).toBe(201)
    expect(res.body.item.id).toBe(9)
  })

  it('POST /api/avis 500 si insert échoue', async () => {
    const prisma = makePrisma()
    prisma.avis.create.mockRejectedValue(new Error('unique'))
    const app = createApp(() => prisma)
    const res = await request(app)
      .post('/api/avis')
      .send({
        name: 'Marie',
        rating: 5,
        comment: 'abcdefghij',
        wouldRecommend: true,
      })
    expect(res.status).toBe(500)
  })

  it('PATCH /api/avis/:id 400 si id invalide', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app)
      .patch('/api/avis/0')
      .set(adminAuthHeader())
      .send({ whitelisted: true })
    expect(res.status).toBe(400)
  })

  it('PATCH /api/avis/:id 400 si whitelisted manquant', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app)
      .patch('/api/avis/1')
      .set(adminAuthHeader())
      .send({})
    expect(res.status).toBe(400)
  })

  it('PATCH /api/avis/:id 200', async () => {
    const item = {
      id: 1,
      authorName: 'A',
      rating: 4,
      comment: 'abcdefghij',
      recommends: true,
      whitelisted: true,
      createdAt: '2020-01-01T00:00:00.000Z',
    }
    const prisma = makePrisma()
    prisma.avis.findUnique.mockResolvedValue({ id: 1 })
    prisma.avis.update.mockResolvedValue(item)
    const app = createApp(() => prisma)
    const res = await request(app)
      .patch('/api/avis/1')
      .set(adminAuthHeader())
      .send({ whitelisted: true })
    expect(res.status).toBe(200)
    expect(res.body.item.whitelisted).toBe(true)
  })

  it('PATCH /api/avis/:id 404 si aucune ligne', async () => {
    const prisma = makePrisma()
    prisma.avis.findUnique.mockResolvedValue(null)
    const app = createApp(() => prisma)
    const res = await request(app)
      .patch('/api/avis/99')
      .set(adminAuthHeader())
      .send({ whitelisted: true })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/avis/:id 400 si id invalide', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).delete('/api/avis/abc').set(adminAuthHeader())
    expect(res.status).toBe(400)
  })

  it('DELETE /api/avis/:id 200', async () => {
    const prisma = makePrisma()
    prisma.avis.findUnique.mockResolvedValue({ id: 3 })
    prisma.avis.delete.mockResolvedValue({ id: 3 })
    const app = createApp(() => prisma)
    const res = await request(app).delete('/api/avis/3').set(adminAuthHeader())
    expect(res.status).toBe(200)
    expect(res.body.deleted).toBe(3)
  })

  it('DELETE /api/avis/:id 404', async () => {
    const prisma = makePrisma()
    prisma.avis.findUnique.mockResolvedValue(null)
    const app = createApp(() => prisma)
    const res = await request(app).delete('/api/avis/3').set(adminAuthHeader())
    expect(res.status).toBe(404)
  })

  it('route inconnue 404', async () => {
    const prisma = makePrisma()
    const app = createApp(() => prisma)
    const res = await request(app).get('/nope')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('not_found')
  })
})

describe('POST /api/auth/login', () => {
  const saved = {
    skip: process.env.RECAPTCHA_SKIP_VERIFY,
    secret: process.env.RECAPTCHA_SECRET_KEY,
    user: process.env.ADMIN_USERNAME,
    pass: process.env.ADMIN_PASSWORD,
  }

  afterEach(() => {
    if (saved.skip === undefined) {
      delete process.env.RECAPTCHA_SKIP_VERIFY
    } else {
      process.env.RECAPTCHA_SKIP_VERIFY = saved.skip
    }
    if (saved.secret === undefined) {
      delete process.env.RECAPTCHA_SECRET_KEY
    } else {
      process.env.RECAPTCHA_SECRET_KEY = saved.secret
    }
    if (saved.user === undefined) {
      delete process.env.ADMIN_USERNAME
    } else {
      process.env.ADMIN_USERNAME = saved.user
    }
    if (saved.pass === undefined) {
      delete process.env.ADMIN_PASSWORD
    } else {
      process.env.ADMIN_PASSWORD = saved.pass
    }
  })

  it('400 si corps invalide', async () => {
    process.env.RECAPTCHA_SKIP_VERIFY = '1'
    const app = createApp(() => makePrisma())
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
  })

  it('401 si mauvais mot de passe', async () => {
    process.env.RECAPTCHA_SKIP_VERIFY = '1'
    const app = createApp(() => makePrisma())
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'non', recaptchaToken: 'x' })
    expect(res.status).toBe(401)
  })

  it('200 si admin / admin et jeton présent (skip reCAPTCHA)', async () => {
    process.env.RECAPTCHA_SKIP_VERIFY = '1'
    const app = createApp(() => makePrisma())
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin', recaptchaToken: 'x' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.token.length).toBeGreaterThan(10)
  })

  it('503 si clé secrète absente et pas de skip', async () => {
    delete process.env.RECAPTCHA_SKIP_VERIFY
    delete process.env.RECAPTCHA_SECRET_KEY
    const app = createApp(() => makePrisma())
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin', recaptchaToken: 'x' })
    expect(res.status).toBe(503)
  })
})
