<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
const systemsStore = useSystemsStore()
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  if (!systemsStore.systems.length) await systemsStore.loadAll()
  if (route.path === `/system/${route.params.id}`) {
    router.replace(`/system/${route.params.id}/library`)
  }
})
</script>
