/** Clé localStorage pour le thème clair / sombre. */
export const THEME_STORAGE_KEY = 'tp_vuejs_theme'

/** @returns {'light' | 'dark'} */
export function readStoredTheme() {
  if (typeof localStorage === 'undefined') {
    return 'light'
  }
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'dark' || v === 'light') {
      return v
    }
  } catch {
    // ignore
  }
  return 'light'
}
