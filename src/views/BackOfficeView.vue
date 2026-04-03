<script setup>
import { onMounted, ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { apiUrl } from '../utils/apiBase.js'

const { isLoggedIn, authHeaders } = useAuth()

const items = ref([])
const loading = ref(false)
const loadError = ref('')
const pendingId = ref(null)
const pendingAction = ref('')

const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Note', key: 'rating', sortable: true, width: '88px' },
  { title: 'Commentaire', key: 'commentPreview', sortable: false },
  { title: 'Reco', key: 'recoLabel', sortable: true, width: '80px' },
  { title: 'Publication', key: 'whitelistLabel', sortable: true, width: '120px' },
  { title: 'Date', key: 'dateLabel', sortable: true, width: '140px' },
  { title: 'Actions', key: 'actions', sortable: false, width: '220px', align: 'end' },
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
      whitelistLabel: row.whitelisted ? 'À la une' : 'En attente',
    }
  })
}

async function loadAvis() {
  loadError.value = ''
  loading.value = true
  try {
    const res = await fetch(apiUrl('/api/avis?limit=100'), {
      headers: { ...authHeaders() },
    })
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

async function toggleWhitelist(item) {
  loadError.value = ''
  pendingId.value = item.id
  pendingAction.value = 'patch'
  try {
    const res = await fetch(apiUrl(`/api/avis/${item.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ whitelisted: !item.whitelisted }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      loadError.value = data.error || `Erreur ${res.status}`
      return
    }
    await loadAvis()
  } catch {
    loadError.value = 'Action impossible. Vérifiez l’API.'
  } finally {
    pendingId.value = null
    pendingAction.value = ''
  }
}

async function deleteOne(item) {
  if (!confirm(`Supprimer définitivement l’avis de « ${item.name} » ?`)) return
  loadError.value = ''
  pendingId.value = item.id
  pendingAction.value = 'delete'
  try {
    const res = await fetch(apiUrl(`/api/avis/${item.id}`), {
      method: 'DELETE',
      headers: { ...authHeaders() },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      loadError.value = data.error || `Erreur ${res.status}`
      return
    }
    await loadAvis()
  } catch {
    loadError.value = 'Suppression impossible. Vérifiez l’API.'
  } finally {
    pendingId.value = null
    pendingAction.value = ''
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
      Gérez les avis : mettez-les « à la une » pour les afficher sur la page publique Avis, ou supprimez-les.
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
          item-value="id"
          :headers="headers"
          :items="items"
          :loading="loading"
          :items-per-page="15"
          class="avis-table"
          density="comfortable"
          hover
        >
          <!-- Vuetify : slot nommé item.<clé> — le point déclenche un faux positif eslint -->
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template v-slot:item.actions="{ item }">
            <div class="d-flex flex-wrap justify-end gap-1">
              <v-btn
                size="small"
                variant="tonal"
                :color="item.whitelisted ? 'warning' : 'success'"
                :loading="pendingId === item.id && pendingAction === 'patch'"
                :disabled="pendingId != null && pendingId !== item.id"
                @click="toggleWhitelist(item)"
              >
                {{ item.whitelisted ? 'Retirer' : 'À la une' }}
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                color="error"
                :loading="pendingId === item.id && pendingAction === 'delete'"
                :disabled="pendingId != null && pendingId !== item.id"
                @click="deleteOne(item)"
              >
                Supprimer
              </v-btn>
            </div>
          </template>
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
