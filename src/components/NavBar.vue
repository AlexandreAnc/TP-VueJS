<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useAppTheme } from '../composables/useAppTheme.js'

const route = useRoute()
const router = useRouter()
const { isLoggedIn, logout } = useAuth()
const { isDark, toggleTheme } = useAppTheme()

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/projets', label: 'Fonctionnalités' },
  { to: '/avis', label: 'Avis' },
]

const adminLink = computed(() => ({
  to: '/back-office',
  label: 'Back Office',
}))

function linkActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path === path || route.path.startsWith(`${path}/`)
}

function handleLogout() {
  const leaveBackOffice =
    route.name === 'back-office' || route.path.startsWith('/back-office')
  logout()
  if (leaveBackOffice) {
    router.push('/')
  }
}
</script>

<template>
  <v-sheet
    class="navbar-sheet"
    data-testid="main-nav"
    border
    rounded="lg"
    elevation="0"
    color="surface"
  >
    <v-container fluid class="navbar-inner pa-3 pa-sm-4">
      <div
        class="d-flex flex-column flex-md-row align-md-center justify-md-space-between ga-3 w-100"
      >
        <span class="text-h6 text-sm-h5 font-weight-bold text-primary flex-shrink-0">
          TP VueJS
        </span>
        <div class="d-flex flex-wrap align-center ga-2 justify-md-end">
          <v-btn
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            size="small"
            rounded="pill"
            class="text-none"
            :variant="linkActive(link.to) ? 'flat' : 'tonal'"
            :color="linkActive(link.to) ? 'primary' : undefined"
          >
            {{ link.label }}
          </v-btn>
          <v-btn
            v-if="isLoggedIn"
            :to="adminLink.to"
            size="small"
            rounded="pill"
            class="text-none"
            variant="outlined"
            :color="linkActive(adminLink.to) ? 'primary' : undefined"
          >
            {{ adminLink.label }}
          </v-btn>
          <v-btn
            v-if="!isLoggedIn"
            to="/login"
            size="small"
            rounded="pill"
            class="text-none"
            variant="flat"
            color="primary"
          >
            Connexion
          </v-btn>
          <v-btn
            v-else
            type="button"
            size="small"
            rounded="pill"
            class="text-none btn-logout"
            variant="text"
            color="primary"
            data-testid="btn-logout"
            @click="handleLogout"
          >
            Déconnexion
          </v-btn>
          <v-btn
            type="button"
            icon
            variant="tonal"
            size="small"
            rounded="lg"
            class="theme-toggle"
            data-testid="theme-toggle"
            :aria-label="isDark ? 'Passer en mode jour' : 'Passer en mode nuit'"
            :title="isDark ? 'Mode jour' : 'Mode nuit'"
            @click="toggleTheme"
          >
            <v-icon :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'" size="20" />
          </v-btn>
        </div>
      </div>
    </v-container>
  </v-sheet>
</template>

<style scoped>
.navbar-sheet {
  position: sticky;
  top: clamp(0.25rem, 2vw, 0.75rem);
  z-index: 1004;
}
</style>
