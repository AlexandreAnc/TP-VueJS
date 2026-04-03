<template>
  <v-sheet
    class="app-footer mt-4"
    border
    rounded="lg"
    elevation="0"
    color="surface"
  >
    <v-container fluid class="pa-3 pa-sm-4">
      <v-row align="center" justify="space-between">
        <v-col cols="12" sm="auto" class="text-center text-sm-start">
          <span class="text-body-1 font-weight-semibold text-primary">TP VueJS</span>
        </v-col>
        <v-col cols="12" sm="auto" class="text-center text-sm-end">
          <span class="text-caption text-medium-emphasis">
            Réalisé par
            <a
              href="https://alexanc.fr"
              target="_blank"
              rel="noopener noreferrer"
              class="text-decoration-none text-primary"
            >
              Alexandre Ancelle
            </a>
          </span>
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<style scoped>
.app-footer a:hover {
  text-decoration: underline !important;
}
</style>
