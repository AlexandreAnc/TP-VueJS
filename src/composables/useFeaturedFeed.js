import { ref } from 'vue'
import { apiUrl } from '../utils/apiBase.js'

const FEATURED_IDS_KEY = 'tp_vuejs_featured_ids'
const BOOTSTRAP_KEY = 'tp_vuejs_featured_bootstrapped'
const NOTIF_ENABLED_KEY = 'tp_vuejs_notif_enabled'

export const featured = ref([])
export const featuredLoading = ref(false)
export const featuredError = ref('')

let pollTimer = null
/** Évite deux chargements concurrents (ex. poll + page Avis au premier rendu). */
let loadQueue = Promise.resolve()

function readSeenIds() {
  try {
    const raw = localStorage.getItem(FEATURED_IDS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map((v) => Number(v)).filter(Number.isFinite) : []
  } catch {
    return []
  }
}

function writeSeenIds(items) {
  try {
    const ids = items.map((it) => Number(it.id)).filter(Number.isFinite)
    localStorage.setItem(FEATURED_IDS_KEY, JSON.stringify(ids))
  } catch {
    // no-op
  }
}

function notificationsAvailable() {
  return typeof window !== 'undefined' && typeof Notification !== 'undefined'
}

function notifEnabledByUser() {
  return (
    notificationsAvailable() &&
    Notification.permission === 'granted' &&
    localStorage.getItem(NOTIF_ENABLED_KEY) === '1'
  )
}

/** Utilisé aussi pour le bouton « Tester notification » sur la page Avis. */
export async function setAppBadge(count = 1) {
  if (typeof navigator === 'undefined' || typeof navigator.setAppBadge !== 'function') return
  try {
    await navigator.setAppBadge(Math.max(1, count))
  } catch {
    // no-op
  }
}

export async function clearAppBadge() {
  if (typeof navigator === 'undefined' || typeof navigator.clearAppBadge !== 'function') return
  try {
    await navigator.clearAppBadge()
  } catch {
    // no-op
  }
}

function freshIds(items) {
  const seen = new Set(readSeenIds())
  return items.filter((it) => Number.isFinite(Number(it.id)) && !seen.has(Number(it.id)))
}

function notifyNewFeatured(items) {
  if (!notifEnabledByUser()) return
  const fresh = freshIds(items)
  if (!fresh.length) return

  const newest = fresh[0]
  const body =
    fresh.length === 1
      ? `${newest.name} a un nouvel avis mis à la une.`
      : `${fresh.length} nouveaux avis sont mis à la une.`

  new Notification('Nouveaux avis publiés', {
    body,
    tag: 'tp-vuejs-featured-avis',
  })
}

async function updateBadgeForNewItems(items) {
  const fresh = freshIds(items)
  if (fresh.length) {
    await setAppBadge(fresh.length)
  }
}

/**
 * Charge les avis publics. Ne marque comme « vus » que via acknowledgeFeaturedSeen().
 * @param {{ skipBadgeUpdate?: boolean }} [options] — si true (ex. avant marquer comme lu), ne met pas à jour la pastille ni les notifs.
 */
export async function loadFeatured(options = {}) {
  const job = loadQueue.then(async () => {
    const { skipBadgeUpdate = false } = options
    featuredLoading.value = true
    featuredError.value = ''
    try {
      const res = await fetch(apiUrl('/api/avis/public?limit=24'))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        featuredError.value = data.error || 'Impossible de charger les avis mis en avant.'
        featured.value = []
        return
      }
      const items = Array.isArray(data.items) ? data.items : []

      if (!localStorage.getItem(BOOTSTRAP_KEY)) {
        writeSeenIds(items)
        localStorage.setItem(BOOTSTRAP_KEY, '1')
        featured.value = items
        return
      }

      if (!skipBadgeUpdate) {
        notifyNewFeatured(items)
        await updateBadgeForNewItems(items)
      }
      featured.value = items
    } catch {
      featuredError.value = 'Impossible de charger les avis mis en avant.'
      featured.value = []
    } finally {
      featuredLoading.value = false
    }
  })
  loadQueue = job.catch(() => {})
  return job
}

/** À appeler quand l’utilisateur ouvre la page Avis : tout est considéré comme lu, pastille retirée. */
export async function acknowledgeFeaturedSeen() {
  await loadFeatured({ skipBadgeUpdate: true })
  writeSeenIds(featured.value)
  await clearAppBadge()
}

export function startFeaturedPolling() {
  if (pollTimer) return
  loadFeatured()
  pollTimer = window.setInterval(() => {
    loadFeatured()
  }, 45000)
}

export function stopFeaturedPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}
