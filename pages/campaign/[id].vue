<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { useNotesStore } from '~/stores/notes'
const route = useRoute()
const notesStore = useNotesStore()

// Pre-load entities for this campaign so sidebar counts work
onMounted(async () => {
  const id = Number(route.params.id)
  if (id) await notesStore.loadAll(id)
})
</script>
