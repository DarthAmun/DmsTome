<template>
  <div class="book-shell">
    <div class="tome-page system-tome-page">
      <NuxtPage />
    </div>
    <SpineNav />
  </div>
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

<style scoped>
.book-shell { display: flex; height: 100vh; background: var(--leather); }
.system-tome-page {
  flex: 1; display: flex; flex-direction: column;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  margin: 20px 20px 20px 60px;
  border-radius: 2px;
  box-shadow: var(--page-shadow);
  overflow: visible; position: relative; z-index: 1;
}
</style>
