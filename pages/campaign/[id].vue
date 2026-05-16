<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { useEntities } from '~/composables/useEntities'
const route = useRoute()
const notesStore = useEntities()

// Pre-load entities for this campaign so sidebar counts work
onMounted(async () => {
  const id = Number(route.params.id)
  if (id) await notesStore.loadAll(id)
})
</script>
