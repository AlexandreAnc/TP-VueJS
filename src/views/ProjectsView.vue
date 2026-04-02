<script setup>
import { computed, ref } from 'vue'

const loading = ref(false)
const errorMessage = ref('')
const address = ref('')
const latitude = ref(null)
const longitude = ref(null)

const isSecure = computed(() => {
  return typeof window !== 'undefined' && window.isSecureContext === true
})

const geolocationSupported = computed(() => {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
})

const canLocate = computed(() => isSecure.value && geolocationSupported.value)

const mapEmbedUrl = computed(() => {
  if (latitude.value == null || longitude.value == null) return ''
  return `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${latitude.value},${longitude.value}`
})

const mapOpenUrl = computed(() => {
  if (latitude.value == null || longitude.value == null) return ''
  return `https://www.openstreetmap.org/?mlat=${latitude.value}&mlon=${longitude.value}#map=16/${latitude.value}/${longitude.value}`
})

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
</script>

<template>
  <section class="page-card">
    <h1>Votre Géolocalisation</h1>
    <p>Cliquez pour récupérer votre position et l’afficher sur OpenStreetMap.</p>

    <div class="actions">
      <v-btn color="primary" :loading="loading" @click="getCurrentPosition">
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
          class="osm-map"
          :src="mapEmbedUrl"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Carte OpenStreetMap"
        />
        <a :href="mapOpenUrl" target="_blank" rel="noopener noreferrer">
          Ouvrir dans OpenStreetMap
        </a>
      </v-card-text>
    </v-card>
  </section>
</template>

<style scoped>
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

.osm-map {
  width: 100%;
  min-height: 320px;
  border: 1px solid var(--color-200);
  border-radius: 12px;
  margin: 0.75rem 0;
}
</style>
