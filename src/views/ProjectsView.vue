<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { clearAppBadge, setAppBadge } from '../composables/useFeaturedFeed.js'

const CONTACTS_STORAGE_KEY = 'tp_vuejs_contacts'
const FEATURED_NOTIF_ENABLED_KEY = 'tp_vuejs_notif_enabled'

// ——— Géolocalisation
const loading = ref(false)
const errorMessage = ref('')
const address = ref('')
const latitude = ref(null)
const longitude = ref(null)
const shareStatus = ref('')
const contactDeletedSnackbar = ref(false)

/** Demi-étendue de la bbox (°) : vue carte serrée sur le point (~quartier). */
const MAP_BBOX_HALF = 0.003

// ——— Contacts (localStorage)
const contacts = ref([])
const contactPickerLoading = ref(false)
const pickerStatus = ref('')
const formError = ref('')
const editingId = ref(null)
const contactForm = reactive({
  name: '',
  email: '',
  tel: '',
})

// ——— Notifications (même logique que les avis mis en avant)
const notificationEnabled = ref(false)
const notificationStatus = ref('')

const isSecure = computed(() => {
  return typeof window !== 'undefined' && window.isSecureContext === true
})

const geolocationSupported = computed(() => {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
})

const canLocate = computed(() => isSecure.value && geolocationSupported.value)

const mapEmbedUrl = computed(() => {
  if (latitude.value == null || longitude.value == null) return ''
  const lat = latitude.value
  const lon = longitude.value
  const d = MAP_BBOX_HALF
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`
})

const mapOpenUrl = computed(() => {
  if (latitude.value == null || longitude.value == null) return ''
  const z = 18
  return `https://www.openstreetmap.org/?mlat=${latitude.value}&mlon=${longitude.value}#map=${z}/${latitude.value}/${longitude.value}`
})

const mapIframeKey = computed(() =>
  latitude.value != null && longitude.value != null
    ? `osm-${latitude.value},${longitude.value}`
    : 'osm-empty',
)

const supportsContactPicker = computed(() => {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && navigator.contacts != null
})

const canImportContacts = computed(() => supportsContactPicker.value && isSecure.value)

const canWebShare = computed(() => {
  return isSecure.value && typeof navigator !== 'undefined' && typeof navigator.share === 'function'
})

function loadContacts() {
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    contacts.value = Array.isArray(parsed) ? parsed : []
  } catch {
    contacts.value = []
  }
}

function saveContacts() {
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts.value))
}

function resetContactForm() {
  contactForm.name = ''
  contactForm.email = ''
  contactForm.tel = ''
  formError.value = ''
  editingId.value = null
}

function createContactFromPicker(item) {
  const name = Array.isArray(item.name) ? item.name[0] || '' : ''
  const email = Array.isArray(item.email) ? item.email[0] || '' : ''
  const tel = Array.isArray(item.tel) ? item.tel[0] || '' : ''
  return {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    tel: String(tel).trim(),
  }
}

async function importContactsFromPicker() {
  pickerStatus.value = ''
  if (!canImportContacts.value) {
    pickerStatus.value = !isSecure.value
      ? 'Contact Picker : contexte sécurisé (HTTPS) requis.'
      : 'Contact Picker API non disponible sur ce navigateur.'
    return
  }
  contactPickerLoading.value = true
  try {
    const supportedProperties = await navigator.contacts.getProperties()
    const properties = ['name', 'email', 'tel'].filter((p) => supportedProperties.includes(p))
    if (!properties.length) {
      pickerStatus.value = 'Aucune propriété compatible (name / email / tel).'
      return
    }
    const selected = await navigator.contacts.select(properties, { multiple: true })
    if (!selected.length) {
      pickerStatus.value = 'Aucun contact sélectionné.'
      return
    }
    const imported = selected.map(createContactFromPicker).filter((c) => c.name || c.email || c.tel)
    if (!imported.length) {
      pickerStatus.value = 'Les contacts choisis ne contiennent pas de données exploitables.'
      return
    }
    contacts.value = [...imported, ...contacts.value]
    saveContacts()
    pickerStatus.value = `${imported.length} contact(s) importé(s), enregistré(s) dans localStorage.`
  } catch {
    pickerStatus.value = 'Import annulé ou impossible.'
  } finally {
    contactPickerLoading.value = false
  }
}

function startEditContact(c) {
  editingId.value = c.id
  contactForm.name = c.name || ''
  contactForm.email = c.email || ''
  contactForm.tel = c.tel || ''
  formError.value = ''
}

function removeContact(id) {
  contacts.value = contacts.value.filter((c) => c.id !== id)
  saveContacts()
  if (editingId.value === id) resetContactForm()
}

function submitContactForm() {
  formError.value = ''
  const next = {
    name: contactForm.name.trim(),
    email: contactForm.email.trim(),
    tel: contactForm.tel.trim(),
  }
  if (!next.name && !next.email && !next.tel) {
    formError.value = 'Renseignez au moins un champ.'
    return
  }
  if (editingId.value) {
    contacts.value = contacts.value.map((c) =>
      c.id === editingId.value ? { ...c, ...next } : c,
    )
  } else {
    contacts.value.unshift({ id: crypto.randomUUID(), ...next })
  }
  saveContacts()
  resetContactForm()
}

function notificationsAvailable() {
  return typeof window !== 'undefined' && typeof Notification !== 'undefined'
}

async function sendNotificationTest() {
  if (!notificationsAvailable() || Notification.permission !== 'granted') return
  const icon =
    typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : undefined
  // Nouveau tag à chaque essai = la notif réapparaît bien ; pastille rafraîchie après un clear.
  await clearAppBadge()
  await setAppBadge(1)
  try {
    new Notification('Essai — TP VueJS', {
      body: 'Notification système. Avec l’app installée (PWA), une pastille peut aussi s’afficher sur l’icône dans la barre des tâches.',
      tag: `tp-vuejs-test-${Date.now()}`,
      icon,
      badge: icon,
      renotify: true,
    })
  } catch {
    // Certains contextes (iframe, politique du navigateur) bloquent Notification.
  }
}

async function enableNotifications() {
  if (!notificationsAvailable()) {
    notificationStatus.value = 'Les notifications ne sont pas supportées sur ce navigateur.'
    return
  }
  const p = await Notification.requestPermission()
  if (p === 'granted') {
    notificationEnabled.value = true
    notificationStatus.value = 'Notifications activées.'
    localStorage.setItem(FEATURED_NOTIF_ENABLED_KEY, '1')
    await sendNotificationTest()
    return
  }
  notificationEnabled.value = false
  notificationStatus.value = 'Notifications refusées.'
  localStorage.setItem(FEATURED_NOTIF_ENABLED_KEY, '0')
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      address.value = ''
      return
    }
    address.value = data.display_name || ''
  } catch {
    address.value = ''
  }
}

function getCurrentPosition() {
  errorMessage.value = ''
  address.value = ''
  if (!canLocate.value) {
    errorMessage.value = !isSecure.value
      ? 'La géolocalisation nécessite un contexte sécurisé (HTTPS).'
      : 'La géolocalisation n’est pas supportée par ce navigateur.'
    return
  }

  loading.value = true
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      latitude.value = Number(position.coords.latitude.toFixed(6))
      longitude.value = Number(position.coords.longitude.toFixed(6))
      await reverseGeocode(latitude.value, longitude.value)
      loading.value = false
    },
    (err) => {
      if (err.code === 1) {
        errorMessage.value = 'Permission refusée pour la géolocalisation.'
      } else if (err.code === 2) {
        errorMessage.value = 'Position indisponible.'
      } else if (err.code === 3) {
        errorMessage.value = 'Délai dépassé lors de la géolocalisation.'
      } else {
        errorMessage.value = 'Impossible de récupérer votre position.'
      }
      loading.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    },
  )
}

function buildShareDataForPosition() {
  if (latitude.value == null || longitude.value == null) return null
  const title = 'Ma position'
  const text = [
    address.value ? `Lieu : ${address.value}` : null,
    `Coordonnées : ${latitude.value}, ${longitude.value}`,
  ]
    .filter(Boolean)
    .join('\n')
  return {
    title,
    text,
    url: mapOpenUrl.value,
  }
}

async function sharePosition() {
  shareStatus.value = ''
  const data = buildShareDataForPosition()
  if (!data || !canWebShare.value) {
    shareStatus.value = !isSecure.value
      ? 'Web Share : disponible en contexte sécurisé (HTTPS).'
      : 'Partage non disponible sur ce navigateur.'
    return
  }
  try {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) {
      shareStatus.value = 'Ce contenu ne peut pas être partagé depuis ce navigateur.'
      return
    }
    await navigator.share(data)
    shareStatus.value = 'Partage envoyé.'
  } catch (e) {
    if (e && e.name === 'AbortError') {
      shareStatus.value = 'Partage annulé.'
    } else {
      shareStatus.value = 'Partage impossible.'
    }
  }
}

async function shareContactsSummary() {
  shareStatus.value = ''
  if (!contacts.value.length) {
    shareStatus.value = 'Aucun contact à partager.'
    return
  }
  if (!canWebShare.value) {
    shareStatus.value = !isSecure.value
      ? 'Web Share : disponible en contexte sécurisé (HTTPS).'
      : 'Partage non disponible sur ce navigateur.'
    return
  }
  const lines = contacts.value.map(
    (c) => [c.name || '—', c.email || '—', c.tel || '—'].filter((x) => x !== '—').join(' · ') || 'Contact vide',
  )
  const data = {
    title: 'Mes contacts (aperçu)',
    text: lines.join('\n'),
  }
  try {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) {
      shareStatus.value = 'Impossible de partager cette liste depuis ce navigateur.'
      return
    }
    await navigator.share(data)
    shareStatus.value = 'Liste partagée.'
  } catch (e) {
    if (e && e.name === 'AbortError') {
      shareStatus.value = 'Partage annulé.'
    } else {
      shareStatus.value = 'Partage impossible.'
    }
  }
}

onMounted(() => {
  loadContacts()
  notificationEnabled.value =
    notificationsAvailable() &&
    Notification.permission === 'granted' &&
    localStorage.getItem(FEATURED_NOTIF_ENABLED_KEY) === '1'
})
</script>

<template>
  <section class="page-card">
    <h1>Fonctionnalités</h1>
    <p class="intro">
      Position sur OpenStreetMap (HTTPS recommandé), liste de contacts importée ou saisie manuellement —
      <strong>tout est enregistré localement dans votre navigateur (localStorage)</strong>, rien n’est envoyé au
      serveur pour les contacts.
    </p>
    <p class="text-caption text-medium-emphasis">
      APIs expérimentales / limitées : géolocalisation, Contact Picker, notifications et Web Share nécessitent en
      général un <strong>contexte sécurisé (HTTPS)</strong> et un navigateur compatible.
    </p>

    <h2 class="section-title">Carte &amp; position</h2>
    <div class="actions">
      <v-btn color="primary" :loading="loading" data-testid="btn-locate" @click="getCurrentPosition">
        Localiser ma position
      </v-btn>
      <span v-if="!canLocate" class="hint">
        {{ !isSecure ? 'Fonction disponible uniquement en HTTPS.' : 'Géolocalisation non supportée.' }}
      </span>
    </div>

    <v-alert v-if="errorMessage" type="warning" variant="tonal" class="mt-4">
      {{ errorMessage }}
    </v-alert>

    <v-card v-if="latitude !== null && longitude !== null" class="mt-4" variant="outlined">
      <v-card-title>Position actuelle</v-card-title>
      <v-card-text>
        <p><strong>Latitude :</strong> {{ latitude }}</p>
        <p><strong>Longitude :</strong> {{ longitude }}</p>
        <p v-if="address"><strong>Adresse approximative :</strong> {{ address }}</p>
        <iframe
          :key="mapIframeKey"
          class="osm-map"
          :src="mapEmbedUrl"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Carte OpenStreetMap"
        />
        <div class="row-gap">
          <a :href="mapOpenUrl" target="_blank" rel="noopener noreferrer">
            Ouvrir dans OpenStreetMap
          </a>
          <v-btn
            v-if="canWebShare"
            size="small"
            variant="tonal"
            color="primary"
            data-testid="btn-share-position"
            @click="sharePosition"
          >
            Partager la position (Web Share API)
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <h2 class="section-title mt-8">Notifications (avis mis en avant)</h2>
    <p class="text-body-2 text-medium-emphasis">
      Active les notifications pour les nouveaux avis publics. Essai rapide avec le bouton « Tester ».
    </p>
    <div class="actions">
      <v-btn
        v-if="!notificationEnabled"
        size="small"
        variant="tonal"
        color="primary"
        @click="enableNotifications"
      >
        Activer les notifications
      </v-btn>
      <template v-else>
        <v-chip size="small" color="success" variant="tonal">
          Notifications actives
        </v-chip>
        <v-btn size="small" variant="outlined" color="primary" @click="sendNotificationTest">
          Tester notification
        </v-btn>
      </template>
    </div>
    <p v-if="notificationStatus" class="hint">{{ notificationStatus }}</p>

    <h2 class="section-title mt-8">Contacts (localStorage)</h2>
    <p class="text-body-2 text-medium-emphasis">
      Import via Contact Picker (Chrome Android notamment) ou ajout manuel. Données uniquement dans
      <strong>localStorage</strong> sur cet appareil.
    </p>
    <div class="actions">
      <v-btn
        color="primary"
        variant="tonal"
        :loading="contactPickerLoading"
        :disabled="!canImportContacts"
        @click="importContactsFromPicker"
      >
        Importer des contacts
      </v-btn>
      <v-btn
        v-if="canWebShare && contacts.length"
        size="small"
        variant="outlined"
        data-testid="btn-share-contacts"
        @click="shareContactsSummary"
      >
        Partager la liste (Web Share API)
      </v-btn>
      <span v-if="!canImportContacts" class="hint">
        {{
          !isSecure
            ? 'Contact Picker : HTTPS requis.'
            : 'Contact Picker non disponible sur ce navigateur.'
        }}
      </span>
      <span v-else-if="pickerStatus" class="hint">{{ pickerStatus }}</span>
    </div>

    <v-card class="mt-4" variant="outlined">
      <v-card-title>{{ editingId ? 'Modifier un contact' : 'Ajouter un contact' }}</v-card-title>
      <v-card-text class="form-grid">
        <v-text-field v-model="contactForm.name" label="Nom" variant="outlined" density="comfortable" hide-details="auto" />
        <v-text-field
          v-model="contactForm.email"
          label="Email"
          type="email"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <v-text-field v-model="contactForm.tel" label="Téléphone" variant="outlined" density="comfortable" hide-details="auto" />
        <v-alert v-if="formError" type="warning" variant="tonal" density="compact">{{ formError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="submitContactForm">
          {{ editingId ? 'Enregistrer' : 'Ajouter' }}
        </v-btn>
        <v-btn v-if="editingId" variant="text" @click="resetContactForm">Annuler</v-btn>
      </v-card-actions>
    </v-card>

    <div class="mt-6">
      <h3 class="subsection-title">Liste enregistrée</h3>
      <p v-if="!contacts.length" class="hint">Aucun contact pour le moment.</p>
      <v-list v-else lines="two" border rounded="lg">
        <v-list-item v-for="c in contacts" :key="c.id">
          <v-list-item-title>{{ c.name || 'Sans nom' }}</v-list-item-title>
          <v-list-item-subtitle>{{ c.email || '—' }} · {{ c.tel || '—' }}</v-list-item-subtitle>
          <template #append>
            <v-btn size="small" variant="text" @click="startEditContact(c)">Modifier</v-btn>
            <v-btn size="small" color="error" variant="text" @click="removeContact(c.id)">Supprimer</v-btn>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <p v-if="shareStatus" class="hint mt-4">{{ shareStatus }}</p>

    <v-snackbar
      v-model="contactDeletedSnackbar"
      :timeout="2600"
      color="primary"
      variant="flat"
      location="bottom"
      rounded="pill"
      transition="scroll-y-reverse-transition"
    >
      <span class="snackbar-text">Contact supprimé</span>
    </v-snackbar>
  </section>
</template>

<style scoped>
.intro {
  margin-bottom: 0.75rem;
  color: var(--color-800);
  line-height: 1.5;
}

.section-title {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-800);
}

.subsection-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-800);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.hint {
  color: var(--color-700);
  font-size: 0.9rem;
}

.row-gap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.form-grid {
  display: grid;
  gap: 0.75rem;
}

.osm-map {
  width: 100%;
  min-height: 360px;
  border: 1px solid var(--color-200);
  border-radius: 12px;
  margin: 0.75rem 0;
}

.snackbar-text {
  font-weight: 500;
}
</style>
