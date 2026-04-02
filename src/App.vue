<script setup>
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import AppFooter from './components/AppFooter.vue'

onMounted(async () => {
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
    <v-main class="page-shell">
      <RouterView />
    </v-main>
    <AppFooter />
  </v-app>
</template>

<style scoped>
.page-shell {
  margin-top: 1rem;
}
</style>
