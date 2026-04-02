import { ref } from 'vue'
import { apiUrl } from '../utils/apiBase.js'

const AUTH_KEY = 'tp_vuejs_auth'

/** Identifiants de démo (tests / usages hors formulaire protégé reCAPTCHA). */
const DEMO_USER = 'admin'
const DEMO_PASSWORD = 'admin'

const isLoggedIn = ref(typeof localStorage !== 'undefined' && localStorage.getItem(AUTH_KEY) === '1')

export function useAuth() {
  function login(username, password) {
    if (username === DEMO_USER && password === DEMO_PASSWORD) {
      localStorage.setItem(AUTH_KEY, '1')
      isLoggedIn.value = true
      return true
    }
    return false
  }

  /**
   * Connexion via l’API (reCAPTCHA v3 vérifié côté serveur).
   * @param {string} username
   * @param {string} password
   * @param {string} recaptchaToken
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  async function loginWithRecaptcha(username, password, recaptchaToken) {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, recaptchaToken }),
    })
    let data = {}
    try {
      data = await res.json()
    } catch {
      // ignore
    }
    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof data.error === 'string'
            ? data.error
            : 'Connexion impossible. Réessayez.',
      }
    }
    localStorage.setItem(AUTH_KEY, '1')
    isLoggedIn.value = true
    return { ok: true }
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    isLoggedIn.value = false
  }

  return { isLoggedIn, login, loginWithRecaptcha, logout }
}
