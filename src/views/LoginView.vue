<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import {
  RECAPTCHA_DEV_BYPASS_CLIENT,
  RECAPTCHA_SITE_KEY,
} from '../config/recaptcha.js'
import {
  loadRecaptchaScript,
  unloadRecaptchaScript,
} from '../utils/loadRecaptchaScript.js'

const router = useRouter()
const route = useRoute()
const { loginWithRecaptcha, isLoggedIn } = useAuth()

onMounted(() => {
  if (isLoggedIn.value) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect || '/')
    return
  }
  if (!RECAPTCHA_DEV_BYPASS_CLIENT && RECAPTCHA_SITE_KEY) {
    loadRecaptchaScript(RECAPTCHA_SITE_KEY).catch(() => {
      /* affichage erreur au submit si besoin */
    })
  }
})

onUnmounted(() => {
  unloadRecaptchaScript()
})

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function onSubmit() {
  error.value = ''

  if (!RECAPTCHA_DEV_BYPASS_CLIENT && !RECAPTCHA_SITE_KEY) {
    error.value =
      'Clé reCAPTCHA manquante. Définissez VITE_RECAPTCHA_SITE_KEY pour vous connecter.'
    return
  }

  submitting.value = true
  try {
    let token
    if (RECAPTCHA_DEV_BYPASS_CLIENT) {
      token = 'dev-local-bypass'
    } else {
      await loadRecaptchaScript(RECAPTCHA_SITE_KEY)
      token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action: 'login',
      })
    }
    const result = await loginWithRecaptcha(
      username.value.trim(),
      password.value,
      token,
    )
    if (result.ok) {
      unloadRecaptchaScript()
      const redirect =
        typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      router.replace(redirect || '/')
      return
    }
    error.value = result.error ?? 'Identifiant ou mot de passe incorrect.'
  } catch {
    error.value =
      'Vérification de sécurité impossible. Vérifiez votre connexion et réessayez.'
  } finally {
    submitting.value = false
  }
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

      <button type="submit" class="submit" :disabled="submitting">
        {{ submitting ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>

    <p v-if="!RECAPTCHA_DEV_BYPASS_CLIENT" class="recaptcha-legal">
      Ce site est protégé par reCAPTCHA&nbsp;; la
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        >politique de confidentialité</a
      >
      et les
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        >conditions d’utilisation</a
      >
      de Google s’appliquent.
    </p>
    <p v-else class="recaptcha-legal dev-hint">
      Mode développement : pas d’appel Google (contourner avec
      <code>VITE_RECAPTCHA_DEV_BYPASS=1</code> + API
      <code>RECAPTCHA_SKIP_VERIFY=1</code>).
    </p>

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

.submit:hover:not(:disabled) {
  background: var(--color-700);
  border-color: var(--color-700);
}

.submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.recaptcha-legal {
  margin-top: 1rem;
  margin-bottom: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--color-600);
}

.recaptcha-legal a {
  color: var(--color-700);
}

.recaptcha-legal.dev-hint code {
  font-size: 0.7rem;
}

.hint {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--color-600);
}
</style>
