import { ref } from 'vue'

const AUTH_KEY = 'tp_vuejs_auth'

/** Identifiants de démo (à remplacer par un vrai backend en production). */
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

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    isLoggedIn.value = false
  }

  return { isLoggedIn, login, logout }
}
