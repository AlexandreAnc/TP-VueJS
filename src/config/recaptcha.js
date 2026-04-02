/* global __RECAPTCHA_SITE_KEY__ */

/** Clé site reCAPTCHA v3 (voir aussi `vite.config.js` : repli depuis `.env.development` au `vite build`). */
export const RECAPTCHA_SITE_KEY = (
  import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
  (typeof __RECAPTCHA_SITE_KEY__ !== 'undefined' ? __RECAPTCHA_SITE_KEY__ : '') ||
  ''
).trim()

const bypassStr = String(import.meta.env.VITE_RECAPTCHA_DEV_BYPASS ?? '')
  .trim()
  .toLowerCase()
const bypassOn = bypassStr === '1' || bypassStr === 'true'

/**
 * Développement uniquement (`import.meta.env.DEV`) : pas d’appel Google côté navigateur.
 * L’API locale doit avoir `RECAPTCHA_SKIP_VERIFY=1` (jamais utilisé en production).
 */
export const RECAPTCHA_DEV_BYPASS_CLIENT =
  import.meta.env.DEV === true && bypassOn
