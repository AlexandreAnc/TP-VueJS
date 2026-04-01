<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiUrl } from '../utils/apiBase.js'

const step = ref(1)
const submitted = ref(false)
const submitting = ref(false)
const submitError = ref('')

const featured = ref([])
const featuredLoading = ref(true)
const featuredError = ref('')

function formatDateShort(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

async function loadFeatured() {
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
    featured.value = Array.isArray(data.items) ? data.items : []
  } catch {
    featuredError.value = 'Impossible de charger les avis mis en avant.'
    featured.value = []
  } finally {
    featuredLoading.value = false
  }
}

onMounted(() => {
  loadFeatured()
})

const form = reactive({
  name: '',
  rating: null,
  comment: '',
  wouldRecommend: null,
})

const steps = [
  { n: 1, title: 'Votre profil' },
  { n: 2, title: 'Votre avis' },
  { n: 3, title: 'Récapitulatif' },
]

const ratingItems = [
  { title: '1 — Très insatisfait', value: 1 },
  { title: '2 — Insatisfait', value: 2 },
  { title: '3 — Moyen', value: 3 },
  { title: '4 — Satisfait', value: 4 },
  { title: '5 — Très satisfait', value: 5 },
]

const step1Valid = computed(() => {
  return form.name.trim().length >= 2 && form.rating != null
})

const step2Valid = computed(() => {
  return form.comment.trim().length >= 10 && form.wouldRecommend !== null
})

function next() {
  if (step.value === 1 && !step1Valid.value) return
  if (step.value === 2 && !step2Valid.value) return
  if (step.value < 3) step.value += 1
}

function prev() {
  if (step.value > 1) step.value -= 1
}

function goTo(s) {
  if (s < 1 || s > 3) return
  if (s < step.value) {
    step.value = s
    return
  }
  if (s === 2 && !step1Valid.value) return
  if (s === 3 && (!step1Valid.value || !step2Valid.value)) return
  step.value = s
}

async function submitAvis() {
  submitError.value = ''
  submitting.value = true
  try {
    const res = await fetch(apiUrl('/api/avis'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        rating: form.rating,
        comment: form.comment.trim(),
        wouldRecommend: form.wouldRecommend,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        Array.isArray(data.errors) && data.errors.length
          ? data.errors.join(' · ')
          : data.error || `Erreur ${res.status}`
      submitError.value = msg
      return
    }
    submitted.value = true
  } catch {
    submitError.value = 'Impossible de joindre le serveur. Vérifiez que l’API tourne (ex. pnpm dev:api).'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page-card avis-page">
    <h1>Avis</h1>
    <p class="lead">
      Découvrez les retours publiés par l’équipe, puis partagez le vôtre en trois étapes.
    </p>

    <div class="featured-section">
      <h2 class="featured-heading">Avis mis en avant</h2>
      <v-progress-linear v-if="featuredLoading" indeterminate color="primary" class="mb-4" />
      <v-alert
        v-else-if="featuredError"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ featuredError }}
      </v-alert>
      <p
        v-else-if="!featured.length"
        class="featured-empty text-body-2 text-medium-emphasis"
      >
        Aucun avis public pour l’instant. Les messages apparaissent ici une fois validés par un
        administrateur (Back Office).
      </p>
      <div v-else class="featured-grid">
        <v-card
          v-for="a in featured"
          :key="a.id"
          variant="outlined"
          class="featured-card"
          rounded="lg"
        >
          <v-card-item>
            <v-card-title class="featured-card-title text-wrap">
              {{ a.name }}
            </v-card-title>
            <v-card-subtitle>{{ formatDateShort(a.createdAt) }}</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <div class="featured-rating-row">
              <v-rating
                :model-value="a.rating"
                readonly
                density="compact"
                color="amber-darken-2"
                size="small"
                half-increments
              />
              <span class="text-caption text-medium-emphasis">{{ a.rating }}/5</span>
            </div>
            <p class="featured-comment">{{ a.comment }}</p>
            <p class="featured-reco text-caption text-medium-emphasis">
              Recommandation : {{ a.wouldRecommend ? 'oui' : 'non' }}
            </p>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <h2 class="form-section-title">Laisser un avis</h2>
    <p class="lead form-lead">
      Vous pouvez revenir en arrière pour modifier avant validation.
    </p>

    <v-alert
      v-if="submitted"
      type="success"
      variant="tonal"
      class="mb-4"
      border="start"
      prominent
    >
      Merci pour votre retour. Votre avis a bien été enregistré.
    </v-alert>

    <v-alert
      v-if="submitError && !submitted"
      type="error"
      variant="tonal"
      class="mb-4"
      border="start"
      closable
      @click:close="submitError = ''"
    >
      {{ submitError }}
    </v-alert>

    <template v-else>
      <div class="step-dots" role="tablist" aria-label="Étapes du formulaire">
        <button
          v-for="s in steps"
          :key="s.n"
          type="button"
          class="step-dot"
          :class="{ active: step === s.n, done: step > s.n }"
          :aria-current="step === s.n ? 'step' : undefined"
          @click="goTo(s.n)"
        >
          <span class="step-num">{{ s.n }}</span>
          <span class="step-label">{{ s.title }}</span>
        </button>
      </div>

      <v-form class="avis-form" @submit.prevent>
        <!-- Étape 1 -->
        <div v-show="step === 1" class="step-panel">
          <h2 class="step-title">Étape 1 — Identité et note</h2>
          <v-text-field
            v-model="form.name"
            label="Pseudo ou prénom"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :rules="[(v) => (v && String(v).trim().length >= 2) || 'Au moins 2 caractères']"
          />
          <v-select
            v-model="form.rating"
            :items="ratingItems"
            item-title="title"
            item-value="value"
            label="Note globale"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            clearable
          />
        </div>

        <!-- Étape 2 -->
        <div v-show="step === 2" class="step-panel">
          <h2 class="step-title">Étape 2 — Détail de votre avis</h2>
          <v-textarea
            v-model="form.comment"
            label="Votre commentaire"
            variant="outlined"
            rows="5"
            counter="500"
            maxlength="500"
            hint="Minimum 10 caractères"
            persistent-hint
          />
          <div class="recommend-block">
            <p id="recommend-label" class="field-label">Recommanderiez-vous ce service ?</p>
            <div
              class="recommend-choices"
              role="group"
              aria-labelledby="recommend-label"
            >
              <button
                type="button"
                class="choice-btn"
                :class="{ 'is-selected': form.wouldRecommend === true }"
                :aria-pressed="form.wouldRecommend === true"
                @click="form.wouldRecommend = true"
              >
                Oui
              </button>
              <button
                type="button"
                class="choice-btn"
                :class="{ 'is-selected': form.wouldRecommend === false }"
                :aria-pressed="form.wouldRecommend === false"
                @click="form.wouldRecommend = false"
              >
                Non
              </button>
            </div>
          </div>
        </div>

        <!-- Étape 3 -->
        <div v-show="step === 3" class="step-panel">
          <h2 class="step-title">Étape 3 — Vérification</h2>
          <v-list class="recap-list" density="comfortable" rounded="lg" border>
            <v-list-item title="Nom" :subtitle="form.name || '—'" />
            <v-list-item title="Note" :subtitle="form.rating ? `${form.rating} / 5` : '—'" />
            <v-list-item title="Commentaire">
              <template #subtitle>
                <span class="recap-comment">{{ form.comment || '—' }}</span>
              </template>
            </v-list-item>
            <v-list-item
              title="Recommandation"
              :subtitle="form.wouldRecommend === null ? '—' : form.wouldRecommend ? 'Oui' : 'Non'"
            />
          </v-list>
          <p class="hint">
            Vous pouvez utiliser « Précédent » pour modifier une étape avant de valider.
          </p>
        </div>

        <div class="actions">
          <v-btn v-if="step > 1" variant="text" @click="prev">Précédent</v-btn>
          <v-spacer />
          <v-btn v-if="step < 3" color="primary" :disabled="(step === 1 && !step1Valid) || (step === 2 && !step2Valid)" @click="next">
            Suivant
          </v-btn>
          <v-btn
            v-else
            color="primary"
            :loading="submitting"
            :disabled="submitting"
            @click="submitAvis"
          >
            Valider l’avis
          </v-btn>
        </div>
      </v-form>
    </template>
  </section>
</template>

<style scoped>
.lead {
  margin-bottom: 1.25rem;
  color: var(--color-700);
}

.step-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.step-dot {
  flex: 1;
  min-width: 7rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.6rem 0.5rem;
  border: 1px solid var(--color-200);
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font: inherit;
  color: var(--color-800);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.step-dot:hover {
  border-color: var(--color-400);
  background: var(--color-50);
}

.step-dot.active {
  border-color: var(--color-600);
  background: var(--color-100);
}

.step-dot.done .step-num {
  background: var(--color-600);
  color: #fff;
}

.step-num {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--color-200);
  color: var(--color-800);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.step-label {
  font-size: 0.75rem;
  text-align: center;
  color: var(--color-700);
}

.step-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-800);
}

.step-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.field-label {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-800);
}

.recommend-block {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.recommend-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.choice-btn {
  min-width: 5.5rem;
  padding: 0.65rem 1.25rem;
  border: 2px solid var(--color-200);
  border-radius: 12px;
  background: #fff;
  color: var(--color-800);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.choice-btn:hover {
  border-color: var(--color-400);
  background: var(--color-50);
}

.choice-btn:focus-visible {
  outline: 2px solid var(--color-600);
  outline-offset: 2px;
}

.choice-btn.is-selected {
  border-color: var(--color-600);
  background: var(--color-600);
  color: #fff;
  box-shadow: 0 2px 8px rgb(97 91 127 / 25%);
}

.recap-comment {
  white-space: pre-wrap;
  word-break: break-word;
}

.hint {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: var(--color-700);
}

.actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-200);
}

.featured-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-200);
}

.featured-heading {
  margin: 0 0 1rem;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-800);
}

.featured-empty {
  margin: 0;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: 1rem;
}

.featured-card {
  border-color: var(--color-200) !important;
  height: 100%;
}

.featured-card-title {
  font-size: 1rem;
  line-height: 1.35;
  padding-bottom: 0.25rem;
}

.featured-rating-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.featured-comment {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--color-800);
}

.featured-reco {
  margin: 0.75rem 0 0;
}

.form-section-title {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-800);
}

.form-lead {
  margin-bottom: 1.25rem;
}
</style>
