<script setup>
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import AppFooter from './components/AppFooter.vue'
import { startFeaturedPolling } from './composables/useFeaturedFeed.js'

onMounted(async () => {
  startFeaturedPolling()
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (Notification.permission !== 'default') return
  try {
    await Notification.requestPermission()
  } catch {
    // Certains navigateurs peuvent refuser sans geste utilisateur explicite.
  }
})
</script>

<template>
  <v-app>
    <NavBar />
    <v-main class="page-shell flex-grow-1">
      <RouterView />
    </v-main>
    <AppFooter />
  </v-app>
</template>

<style scoped>
.page-shell {
  margin-top: clamp(0.5rem, 2vw, 1rem);
  padding-bottom: clamp(0.25rem, 1.5vw, 0.75rem);
}
</style>
