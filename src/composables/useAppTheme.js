import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { THEME_STORAGE_KEY } from '../config/themeStorage.js'

export function useAppTheme() {
  const theme = useTheme()

  const isDark = computed(() => theme.global.name.value === 'dark')

  function applyDomClass(dark) {
    if (typeof document === 'undefined') {
      return
    }
    document.documentElement.classList.toggle('theme-dark', dark)
  }

  function setTheme(dark) {
    theme.global.name.value = dark ? 'dark' : 'light'
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light')
    } catch {
      // ignore
    }
    applyDomClass(dark)
  }

  function toggleTheme() {
    setTheme(!isDark.value)
  }

  return { isDark, setTheme, toggleTheme, applyDomClass }
}
