import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app.mjs'

describe('createApp', () => {
  it('GET /health retourne ok', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ one: 1 }] })
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.service).toBe('tp-vuejs-api')
  })

  it('GET /api/health retourne ok', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('GET / appelle la base et expose uptime', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ one: 1 }] })
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.service).toBe('tp-vuejs-api')
    expect(typeof res.body.uptimeSeconds).toBe('number')
    expect(query).toHaveBeenCalled()
  })

  it('GET / échoue gracieusement si la base rejette', async () => {
    const query = vi.fn().mockRejectedValue(new Error('down'))
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(false)
    expect(res.body.db.ok).toBe(false)
  })

  it('GET /api/db retourne postgres en succès', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ db: 'testdb', user: 'u' }],
    })
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/api/db')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.postgres.db).toBe('testdb')
  })

  it('GET /api/db retourne 503 si erreur', async () => {
    const query = vi.fn().mockRejectedValue(new Error('refused'))
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/api/db')
    expect(res.status).toBe(503)
    expect(res.body.ok).toBe(false)
  })

  it('GET /api/avis/public respecte la limite par défaut', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/api/avis/public')
    expect(res.status).toBe(200)
    expect(res.body.items).toEqual([])
    expect(query.mock.calls[0][1]).toEqual([20])
  })

  it('GET /api/avis/public borne limit', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const app = createApp(() => ({ query }))
    await request(app).get('/api/avis/public?limit=999')
    expect(query.mock.calls[0][1]).toEqual([50])
  })

  it('GET /api/avis liste avec whitelisted', async () => {
    const row = {
      id: 1,
      name: 'A',
      rating: 5,
      comment: 'abcdefghij',
      wouldRecommend: true,
      whitelisted: false,
      createdAt: '2020-01-01T00:00:00.000Z',
    }
    const query = vi.fn().mockResolvedValue({ rows: [row] })
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/api/avis')
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].whitelisted).toBe(false)
  })

  it('GET /api/avis retourne 500 si query échoue', async () => {
    const query = vi.fn().mockRejectedValue(new Error('boom'))
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/api/avis')
    expect(res.status).toBe(500)
    expect(res.body.ok).toBe(false)
  })

  it('GET /api/avis/public retourne 500 si query échoue', async () => {
    const query = vi.fn().mockRejectedValue(new Error('boom'))
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/api/avis/public')
    expect(res.status).toBe(500)
  })

  it('PATCH /api/avis/:id 500 si update échoue', async () => {
    const query = vi.fn().mockRejectedValue(new Error('db'))
    const app = createApp(() => ({ query }))
    const res = await request(app).patch('/api/avis/1').send({ whitelisted: false })
    expect(res.status).toBe(500)
  })

  it('DELETE /api/avis/:id 500 si delete échoue', async () => {
    const query = vi.fn().mockRejectedValue(new Error('db'))
    const app = createApp(() => ({ query }))
    const res = await request(app).delete('/api/avis/1')
    expect(res.status).toBe(500)
  })

  it('POST /api/avis 400 si validation échoue', async () => {
    const query = vi.fn()
    const app = createApp(() => ({ query }))
    const res = await request(app).post('/api/avis').send({ name: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.errors.length).toBeGreaterThan(0)
    expect(query).not.toHaveBeenCalled()
  })

  it('POST /api/avis 201 et insère', async () => {
    const inserted = {
      id: 9,
      name: 'Marie',
      rating: 5,
      comment: 'abcdefghij',
      wouldRecommend: true,
      whitelisted: false,
      createdAt: '2020-01-01T00:00:00.000Z',
    }
    const query = vi.fn().mockResolvedValue({ rows: [inserted] })
    const app = createApp(() => ({ query }))
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
    const query = vi.fn().mockRejectedValue(new Error('unique'))
    const app = createApp(() => ({ query }))
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
    const query = vi.fn()
    const app = createApp(() => ({ query }))
    const res = await request(app).patch('/api/avis/0').send({ whitelisted: true })
    expect(res.status).toBe(400)
  })

  it('PATCH /api/avis/:id 400 si whitelisted manquant', async () => {
    const query = vi.fn()
    const app = createApp(() => ({ query }))
    const res = await request(app).patch('/api/avis/1').send({})
    expect(res.status).toBe(400)
  })

  it('PATCH /api/avis/:id 200', async () => {
    const item = {
      id: 1,
      name: 'A',
      rating: 4,
      comment: 'abcdefghij',
      wouldRecommend: true,
      whitelisted: true,
      createdAt: '2020-01-01T00:00:00.000Z',
    }
    const query = vi.fn().mockResolvedValue({ rows: [item], rowCount: 1 })
    const app = createApp(() => ({ query }))
    const res = await request(app).patch('/api/avis/1').send({ whitelisted: true })
    expect(res.status).toBe(200)
    expect(res.body.item.whitelisted).toBe(true)
  })

  it('PATCH /api/avis/:id 404 si aucune ligne', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 })
    const app = createApp(() => ({ query }))
    const res = await request(app).patch('/api/avis/99').send({ whitelisted: true })
    expect(res.status).toBe(404)
  })

  it('DELETE /api/avis/:id 400 si id invalide', async () => {
    const query = vi.fn()
    const app = createApp(() => ({ query }))
    const res = await request(app).delete('/api/avis/abc')
    expect(res.status).toBe(400)
  })

  it('DELETE /api/avis/:id 200', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 1 })
    const app = createApp(() => ({ query }))
    const res = await request(app).delete('/api/avis/3')
    expect(res.status).toBe(200)
    expect(res.body.deleted).toBe(3)
  })

  it('DELETE /api/avis/:id 404', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 0 })
    const app = createApp(() => ({ query }))
    const res = await request(app).delete('/api/avis/3')
    expect(res.status).toBe(404)
  })

  it('route inconnue 404', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const app = createApp(() => ({ query }))
    const res = await request(app).get('/nope')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('not_found')
  })
})
