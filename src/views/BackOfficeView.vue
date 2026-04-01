<script setup>
import { onMounted, ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { apiUrl } from '../utils/apiBase.js'

const { isLoggedIn } = useAuth()

const items = ref([])
const loading = ref(false)
const loadError = ref('')

const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Note', key: 'rating', sortable: true, width: '88px' },
  { title: 'Commentaire', key: 'commentPreview', sortable: false },
  { title: 'Reco', key: 'recoLabel', sortable: true, width: '80px' },
  { title: 'Date', key: 'dateLabel', sortable: true, width: '140px' },
]

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function enrichRows(rows) {
  return rows.map((row) => {
    const c = row.comment || ''
    return {
      ...row,
      recoLabel: row.wouldRecommend ? 'Oui' : 'Non',
      dateLabel: formatDate(row.createdAt),
      commentPreview: c.length > 140 ? `${c.slice(0, 140)}…` : c,
    }
  })
}

async function loadAvis() {
  loadError.value = ''
  loading.value = true
  try {
    const res = await fetch(apiUrl('/api/avis?limit=50'))
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      loadError.value = data.error || `Erreur ${res.status}`
      items.value = []
      return
    }
    items.value = enrichRows(Array.isArray(data.items) ? data.items : [])
  } catch {
    loadError.value = 'Impossible de charger les avis. Vérifiez que l’API tourne.'
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) loadAvis()
})
</script>

<template>
  <section class="page-card back-office">
    <h1>Back Office</h1>
    <p class="lead">
      Espace réservé aux administrateurs. Les avis récents proviennent de la base via l’API.
    </p>

    <v-alert
      v-if="isLoggedIn"
      type="info"
      variant="tonal"
      density="comfortable"
      border="start"
      class="mb-4"
    >
      Session administrateur active (compte démo <strong>admin</strong>).
    </v-alert>

    <v-card variant="outlined" class="avis-card">
      <v-card-title class="d-flex flex-wrap align-center gap-2">
        <span>Avis récents</span>
        <v-spacer />
        <v-btn
          variant="tonal"
          color="primary"
          size="small"
          :loading="loading"
          @click="loadAvis"
        >
          Actualiser
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="loadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ loadError }}
        </v-alert>

        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          :items-per-page="15"
          class="avis-table"
          density="comfortable"
          hover
        >
          <template #no-data>
            <p class="text-body-2 text-medium-emphasis pa-4 mb-0">
              Aucun avis pour l’instant. Soumettez-en un depuis la page Avis.
            </p>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </section>
</template>

<style scoped>
.lead {
  margin-bottom: 1.25rem;
  color: var(--color-700);
}

.avis-card {
  border-color: var(--color-200) !important;
}

.avis-table :deep(.v-data-table__td) {
  vertical-align: top;
}
</style>
