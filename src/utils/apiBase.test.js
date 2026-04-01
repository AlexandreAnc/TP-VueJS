import { afterEach, describe, expect, it, vi } from 'vitest'

describe('apiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('sans base, normalise un chemin relatif', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const { apiUrl } = await import('./apiBase.js')
    expect(apiUrl('api/avis')).toBe('/api/avis')
  })

  it('sans base, conserve un chemin absolu', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const { apiUrl } = await import('./apiBase.js')
    expect(apiUrl('/api/avis')).toBe('/api/avis')
  })

  it('retire le slash final de la base', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/')
    const { apiUrl } = await import('./apiBase.js')
    expect(apiUrl('/api/avis')).toBe('https://api.example.com/api/avis')
  })

  it('concatène la base et le chemin', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.tp-vuejs.aanc.fr')
    const { apiUrl } = await import('./apiBase.js')
    expect(apiUrl('/api/health')).toBe('https://api.tp-vuejs.aanc.fr/api/health')
  })
})
