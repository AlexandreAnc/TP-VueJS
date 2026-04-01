<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const route = useRoute()
const { login, isLoggedIn } = useAuth()

onMounted(() => {
  if (isLoggedIn.value) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect || '/')
  }
})

const username = ref('')
const password = ref('')
const error = ref('')

function onSubmit() {
  error.value = ''
  if (login(username.value.trim(), password.value)) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect || '/')
    return
  }
  error.value = 'Identifiant ou mot de passe incorrect.'
}
</script>

<template>
  <section class="page-card login-card">
    <h1>Connexion</h1>
    <p class="intro">Connectez-vous avec le compte de démonstration.</p>

    <form class="form" @submit.prevent="onSubmit">
      <label class="field">
        <span>Identifiant</span>
        <input
          v-model="username"
          type="text"
          name="username"
          autocomplete="username"
          required
        />
      </label>
      <label class="field">
        <span>Mot de passe</span>
        <input
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          required
        />
      </label>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button type="submit" class="submit">Se connecter</button>
    </form>

    <p v-if="isLoggedIn" class="hint">Vous êtes déjà connecté.</p>
  </section>
</template>

<style scoped>
.login-card {
  max-width: 420px;
  margin: 0 auto;
}

.intro {
  margin-bottom: 1.25rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field span {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-800);
}

.field input {
  border: 1px solid var(--color-200);
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  font: inherit;
  color: var(--color-900);
  background: #fff;
}

.field input:focus {
  outline: 2px solid var(--color-400);
  outline-offset: 1px;
}

.error {
  margin: 0;
  color: var(--color-800);
  font-size: 0.9rem;
  background: var(--color-100);
  border: 1px solid var(--color-300);
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
}

.submit {
  margin-top: 0.25rem;
  align-self: flex-start;
  cursor: pointer;
  border: 1px solid var(--color-600);
  background: var(--color-600);
  color: #fff;
  font: inherit;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.5rem 1.25rem;
  transition: background 120ms ease, border-color 120ms ease;
}

.submit:hover {
  background: var(--color-700);
  border-color: var(--color-700);
}

.hint {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--color-600);
}
</style>
