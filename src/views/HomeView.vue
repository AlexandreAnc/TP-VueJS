<template>
  <v-container fluid class="pa-0">
    <v-sheet class="page-card" border rounded="xl" elevation="0">
      <div class="pa-4 pa-md-6">
        <h1 class="text-h4 text-sm-h3 font-weight-bold text-primary mb-2">
          Accueil
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6" style="max-width: 48rem">
          Ce site a été réalisé dans le cadre d’un <strong>travail pratique (TP) en cours</strong> : l’objectif est
          de montrer une application web construite avec les technologies vues en classe, avec un parcours utilisateur
          cohérent et quelques fonctionnalités avancées côté navigateur et serveur.
        </p>

        <h2 class="text-h6 font-weight-semibold mb-3">Ce que contient le projet</h2>
        <v-list class="bg-transparent pa-0 mb-6" density="comfortable">
          <v-list-item class="px-0">
            <template #prepend>
              <v-icon color="primary" icon="mdi-vuejs" size="28" />
            </template>
            <v-list-item-title class="font-weight-medium">Vue.js</v-list-item-title>
            <v-list-item-subtitle class="text-wrap mt-1">
              L’interface entière (pages, navigation, formulaires, état client) est développée avec
              <strong>Vue.js</strong> — c’est le cœur du TP et le fil conducteur du dépôt.
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item class="px-0">
            <template #prepend>
              <v-icon color="primary" icon="mdi-database-outline" size="28" />
            </template>
            <v-list-item-title class="font-weight-medium">API &amp; avis</v-list-item-title>
            <v-list-item-subtitle class="text-wrap mt-1">
              Une <strong>petite API</strong> (Node / Express) est reliée à une base <strong>PostgreSQL</strong> pour
              l’enregistrement et la modération des <strong>avis</strong> publics, avec un back-office protégé.
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item class="px-0">
            <template #prepend>
              <v-icon color="primary" icon="mdi-palette-outline" size="28" />
            </template>
            <v-list-item-title class="font-weight-medium">Vuetify</v-list-item-title>
            <v-list-item-subtitle class="text-wrap mt-1">
              La couche UI s’appuie sur <strong>Vuetify</strong> (composants Material Design, thème clair / sombre,
              mise en page responsive).
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="mb-6" />

        <div class="d-flex flex-column flex-sm-row align-sm-center ga-4 flex-wrap">
          <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 36rem">
            Le code source, l’API et les fichiers de déploiement sont versionnés sur GitHub.
          </p>
          <v-btn
            href="https://github.com/AlexandreAnc/TP-VueJS"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            variant="flat"
            prepend-icon="mdi-github"
            class="text-none flex-shrink-0"
          >
            Voir le dépôt GitHub
          </v-btn>
        </div>
      </div>
    </v-sheet>
  </v-container>
</template>
