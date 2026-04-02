<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

const STORAGE_KEY = 'tp_vuejs_contacts'

const contacts = ref([])
const loading = ref(false)
const pickerStatus = ref('')
const formError = ref('')
const editingId = ref(null)

const form = reactive({
  name: '',
  email: '',
  tel: '',
})

const supportsContactPicker = computed(() => {
  return typeof navigator !== 'undefined' && 'contacts' in navigator
})

const isSecure = computed(() => {
  return typeof window !== 'undefined' && window.isSecureContext === true
})

const canImport = computed(() => supportsContactPicker.value && isSecure.value)
const importDisabledReason = computed(() => {
  if (!isSecure.value) return 'Import indisponible hors HTTPS.'
  if (!supportsContactPicker.value) return 'Contact Picker API non supportée sur ce navigateur.'
  return ''
})

function resetForm() {
  form.name = ''
  form.email = ''
  form.tel = ''
  formError.value = ''
  editingId.value = null
}

function loadSavedContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    contacts.value = Array.isArray(parsed) ? parsed : []
  } catch {
    contacts.value = []
  }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts.value))
}

function createContactFromPicker(item) {
  const name = Array.isArray(item.name) ? item.name[0] || '' : ''
  const email = Array.isArray(item.email) ? item.email[0] || '' : ''
  const tel = Array.isArray(item.tel) ? item.tel[0] || '' : ''
  return {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    tel: String(tel).trim(),
  }
}

async function importContacts() {
  pickerStatus.value = ''
  if (!canImport.value) {
    pickerStatus.value = importDisabledReason.value
    return
  }

  loading.value = true
  try {
    const supportedProperties = await navigator.contacts.getProperties()
    const properties = ['name', 'email', 'tel'].filter((prop) => supportedProperties.includes(prop))
    if (!properties.length) {
      pickerStatus.value = 'Aucune propriété compatible (name/email/tel).'
      return
    }

    const selected = await navigator.contacts.select(properties, { multiple: true })
    if (!selected.length) {
      pickerStatus.value = 'Aucun contact sélectionné.'
      return
    }

    const imported = selected.map(createContactFromPicker).filter((c) => c.name || c.email || c.tel)
    if (!imported.length) {
      pickerStatus.value = 'Les contacts sélectionnés ne contiennent pas de données exploitables.'
      return
    }

    contacts.value = [...imported, ...contacts.value]
    saveContacts()
    pickerStatus.value = `${imported.length} contact(s) importé(s).`
  } catch {
    pickerStatus.value = 'Import annulé ou impossible.'
  } finally {
    loading.value = false
  }
}

function startEdit(contact) {
  editingId.value = contact.id
  form.name = contact.name || ''
  form.email = contact.email || ''
  form.tel = contact.tel || ''
  formError.value = ''
}

function removeContact(id) {
  contacts.value = contacts.value.filter((c) => c.id !== id)
  saveContacts()
  if (editingId.value === id) {
    resetForm()
  }
}

function submitForm() {
  formError.value = ''
  const next = {
    name: form.name.trim(),
    email: form.email.trim(),
    tel: form.tel.trim(),
  }

  if (!next.name && !next.email && !next.tel) {
    formError.value = 'Renseignez au moins un champ.'
    return
  }

  if (editingId.value) {
    contacts.value = contacts.value.map((c) => (c.id === editingId.value ? { ...c, ...next } : c))
  } else {
    contacts.value.unshift({ id: crypto.randomUUID(), ...next })
  }
  saveContacts()
  resetForm()
}

onMounted(() => {
  loadSavedContacts()
})
</script>

<template>
  <section class="page-card">
    <h1>Vos Contacts</h1>
    <p>Importez vos contacts (Contact Picker API), puis modifiez/supprimez-les. Les données sont sauvegardées localement.</p>

    <div class="actions">
      <v-btn color="primary" :loading="loading" :disabled="!canImport" @click="importContacts">
        Importer depuis le téléphone
      </v-btn>
      <span v-if="importDisabledReason" class="hint">{{ importDisabledReason }}</span>
      <span v-else-if="pickerStatus" class="hint">{{ pickerStatus }}</span>
    </div>

    <v-card class="mt-4" variant="outlined">
      <v-card-title>{{ editingId ? 'Modifier le contact' : 'Ajouter un contact manuellement' }}</v-card-title>
      <v-card-text class="form-grid">
        <v-text-field v-model="form.name" label="Nom" variant="outlined" density="comfortable" hide-details="auto" />
        <v-text-field v-model="form.email" label="Email" type="email" variant="outlined" density="comfortable" hide-details="auto" />
        <v-text-field v-model="form.tel" label="Téléphone" variant="outlined" density="comfortable" hide-details="auto" />
        <v-alert v-if="formError" type="warning" variant="tonal" density="compact">{{ formError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="submitForm">{{ editingId ? 'Enregistrer' : 'Ajouter' }}</v-btn>
        <v-btn v-if="editingId" variant="text" @click="resetForm">Annuler</v-btn>
      </v-card-actions>
    </v-card>

    <div class="mt-6">
      <h2>Liste des contacts</h2>
      <p v-if="!contacts.length" class="hint">Aucun contact pour le moment.</p>
      <v-list v-else lines="two" border rounded="lg">
        <v-list-item v-for="c in contacts" :key="c.id">
          <v-list-item-title>{{ c.name || 'Sans nom' }}</v-list-item-title>
          <v-list-item-subtitle>{{ c.email || '—' }} · {{ c.tel || '—' }}</v-list-item-subtitle>
          <template #append>
            <v-btn size="small" variant="text" @click="startEdit(c)">Modifier</v-btn>
            <v-btn size="small" color="error" variant="text" @click="removeContact(c.id)">Supprimer</v-btn>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </section>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.hint {
  color: var(--color-700);
  font-size: 0.9rem;
}

.form-grid {
  display: grid;
  gap: 0.75rem;
}
</style>
