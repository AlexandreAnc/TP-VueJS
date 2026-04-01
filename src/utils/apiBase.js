/**
 * URL de base de l’API (prod : définir VITE_API_URL au build, ex. https://api.tp-vuejs.aanc.fr).
 * En dev vide : chemins relatifs /api/... proxifiés par Vite vers l’API locale.
 */
export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}
