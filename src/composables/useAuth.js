import { ref } from 'vue'
import { apiUrl } from '../utils/apiBase.js'

const TOKEN_KEY = 'tp_vuejs_admin_token'

function readToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
}

const isLoggedIn = ref(!!readToken())

/** En-têtes à envoyer sur les routes admin de l’API (liste complète, patch, delete). */
export function authHeaders() {
  const t = readToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export function useAuth() {
  /**
   * Connexion simple (sans reCAPTCHA) — utile en dev si l’API a RECAPTCHA_SKIP_VERIFY=1.
   * @returns {Promise<boolean>}
   */
  async function login(username, password) {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        recaptchaToken: 'x',
      }),
    })
    let data = {}
    try {
      data = await res.json()
    } catch {
      // ignore
    }
    if (!res.ok || typeof data.token !== 'string' || !data.token) {
      return false
    }
    localStorage.setItem(TOKEN_KEY, data.token)
    isLoggedIn.value = true
    return true
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
    if (typeof data.token !== 'string' || !data.token) {
      return {
        ok: false,
        error: 'Réponse serveur inattendue.',
      }
    }
    localStorage.setItem(TOKEN_KEY, data.token)
    isLoggedIn.value = true
    return { ok: true }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    isLoggedIn.value = false
  }

  return { isLoggedIn, login, loginWithRecaptcha, logout, authHeaders }
}
