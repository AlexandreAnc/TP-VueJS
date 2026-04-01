<script setup>
import { useAuth } from '../composables/useAuth.js'

const { isLoggedIn } = useAuth()
</script>

<template>
  <section class="page-card back-office">
    <h1>Back Office</h1>
    <p class="lead">
      Espace reserve aux administrateurs connectes. Vous pouvez y ajouter plus tard tableaux de bord,
      moderation des avis, etc.
    </p>

    <v-alert
      v-if="isLoggedIn"
      type="info"
      variant="tonal"
      density="comfortable"
      border="start"
      class="mb-4"
    >
      Session administrateur active (compte demo <strong>admin</strong>).
    </v-alert>

    <v-card variant="outlined" class="placeholder-card">
      <v-card-title>Tableau de bord</v-card-title>
      <v-card-text>
        Contenu a definir : statistiques, liste des avis, parametres du site...
      </v-card-text>
    </v-card>
  </section>
</template>

<style scoped>
.lead {
  margin-bottom: 1.25rem;
  color: var(--color-700);
}

.placeholder-card {
  border-color: var(--color-200) !important;
}
</style>
