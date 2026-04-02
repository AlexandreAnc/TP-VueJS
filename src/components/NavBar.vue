<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

const route = useRoute()
const router = useRouter()
const { isLoggedIn, logout } = useAuth()

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/projets', label: 'Fonctionnalités' },
  { to: '/avis', label: 'Avis' },
  { to: '/contact', label: 'Contact' },
]

function handleLogout() {
  logout()
}
</script>

<template>
  <header class="navbar">
    <div class="brand">TP VueJS</div>
    <nav class="menu" aria-label="Navigation principale">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="menu-link"
      >
        {{ link.label }}
      </RouterLink>
      <RouterLink
        v-if="isLoggedIn"
        to="/back-office"
        class="menu-link menu-link-admin"
      >
        Back Office
      </RouterLink>
      <RouterLink v-if="!isLoggedIn" to="/login" class="menu-link menu-link-auth">
        Connexion
      </RouterLink>
      <button
        v-else
        type="button"
        class="menu-link menu-link-auth btn-logout"
        @click="handleLogout"
      >
        Déconnexion
      </button>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 1rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--color-50);
  border: 1px solid var(--color-200);
  border-radius: 14px;
  padding: 0.75rem 1rem;
}

.brand {
  font-weight: 700;
  color: var(--color-800);
}

.menu {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.menu-link {
  text-decoration: none;
  color: var(--color-700);
  background: white;
  border: 1px solid var(--color-200);
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  transition: all 120ms ease;
}

.menu-link:hover {
  color: var(--color-900);
  border-color: var(--color-400);
  background: var(--color-100);
}

.menu-link.router-link-exact-active {
  background: var(--color-600);
  border-color: var(--color-600);
  color: white;
}

.menu-link-admin {
  border-style: dashed;
}

.menu-link-auth {
  margin-left: 0.25rem;
}

.btn-logout {
  font: inherit;
  cursor: pointer;
}
</style>
