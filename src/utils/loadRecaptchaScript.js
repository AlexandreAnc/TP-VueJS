/** @type {Promise<void> | null} */
let loadPromise = null

/**
 * Charge une fois le script Google reCAPTCHA v3 et attend `grecaptcha.ready`.
 * @param {string} siteKey
 * @returns {Promise<void>}
 */
export function loadRecaptchaScript(siteKey) {
  if (!siteKey) {
    return Promise.reject(new Error('recaptcha_site_key_manquant'))
  }
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('recaptcha_pas_de_navigateur'))
  }

  if (window.grecaptcha?.ready) {
    return new Promise((resolve) => {
      window.grecaptcha.ready(() => resolve())
    })
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
      s.async = true
      s.defer = true
      s.onload = () => {
        if (window.grecaptcha?.ready) {
          window.grecaptcha.ready(() => resolve())
        } else {
          loadPromise = null
          reject(new Error('recaptcha_non_disponible'))
        }
      }
      s.onerror = () => {
        loadPromise = null
        reject(new Error('recaptcha_script_erreur'))
      }
      document.head.appendChild(s)
    })
  }
  return loadPromise
}

/**
 * Retire le script reCAPTCHA, le badge et l’API globale (à quitter la page login ou après connexion réussie).
 */
export function unloadRecaptchaScript() {
  loadPromise = null
  if (typeof document === 'undefined') {
    return
  }

  document
    .querySelectorAll(
      'script[src*="google.com/recaptcha/api.js"], script[src*="www.gstatic.com/recaptcha"]',
    )
    .forEach((el) => el.remove())

  document.querySelectorAll('.grecaptcha-badge').forEach((el) => el.remove())

  try {
    delete window.grecaptcha
  } catch {
    window.grecaptcha = undefined
  }
}
