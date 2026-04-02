/** Clé site reCAPTCHA v3 (obligatoire hors bypass dev, ex. build prod / `VITE_RECAPTCHA_SITE_KEY`). */
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? ''

/**
 * Développement uniquement (`import.meta.env.DEV`) : pas d’appel Google côté navigateur.
 * L’API locale doit avoir `RECAPTCHA_SKIP_VERIFY=1` (jamais utilisé en production).
 */
export const RECAPTCHA_DEV_BYPASS_CLIENT =
  import.meta.env.DEV === true &&
  import.meta.env.VITE_RECAPTCHA_DEV_BYPASS === '1'
