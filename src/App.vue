<script setup>
import NavBar from './components/NavBar.vue'
import AppFooter from './components/AppFooter.vue'
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
