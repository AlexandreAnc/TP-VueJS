<script setup>
import { computed, reactive, ref } from 'vue'

const step = ref(1)
const submitted = ref(false)

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

function submitLocal() {
  /** Aucun envoi réseau : démo uniquement. */
  submitted.value = true
}
</script>

<template>
  <section class="page-card avis-page">
    <h1>Avis</h1>
    <p class="lead">
      Partagez votre expérience en trois étapes. Vous pouvez revenir en arrière pour modifier
      avant validation.
    </p>

    <v-alert
      v-if="submitted"
      type="success"
      variant="tonal"
      class="mb-4"
      border="start"
      prominent
    >
      Merci pour votre retour. Aucune donnée n’a été envoyée (mode démo sans API).
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
          <v-btn v-else color="primary" @click="submitLocal">Valider l’avis</v-btn>
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
</style>
