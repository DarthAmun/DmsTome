<template>
  <div class="book-shell">
    <div class="tome-page system-tome-page">
      <NuxtPage />
    </div>
    <nav class="spine-tabs">
      <SpineSeal />
      <NuxtLink to="/" class="spine-tab">
        <OhVueIcon name="md-arrowback" scale="0.85" />
        Tome
      </NuxtLink>
      <NuxtLink :to="`/system/${systemId}`" class="spine-tab"
        :class="{ active: route.path === `/system/${systemId}` }">
        <OhVueIcon name="gi-book-aura" scale="0.85" />
        Overview
      </NuxtLink>
      <NuxtLink :to="`/system/${systemId}/builder`" class="spine-tab"
        :class="{ active: route.path.includes('/builder') }">
        <OhVueIcon name="md-settings" scale="0.85" />
        Builder
      </NuxtLink>
      <button v-for="et in entityTypes" :key="et.id" class="spine-tab"
        :class="{ active: route.params.typeId === et.id }"
        :title="et.plural"
        @click="$router.push(`/system/${systemId}/${et.id}`)">
        <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="0.85" />
        {{ et.name }}
      </button>
    </nav>
  </div>
</template>
<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'

const route = useRoute()
const systemsStore = useSystemsStore()
const systemId = Number(route.params.id)

const system = computed(() => systemsStore.getSystem(systemId))
const entityTypes = computed(() => system.value?.entityTypes ?? [])
const sectionLabel = computed(() => {
  if (route.path.includes('/builder')) return '/ Builder'
  const typeId = route.params.typeId as string
  if (typeId) return '/ ' + (entityTypes.value.find(t => t.id === typeId)?.plural ?? typeId)
  return ''
})

function isActiveType(id: string) {
  return route.params.typeId === id
}

onMounted(async () => {
  if (!systemsStore.systems.length) await systemsStore.loadAll()
})
</script>

<style scoped>
.book-shell { display: flex; height: 100vh; background: var(--leather); }
.system-tome-page {
  flex: 1; display: flex; flex-direction: column;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  margin: 20px 60px 20px 20px;
  border-radius: 2px;
  box-shadow: var(--page-shadow);
  overflow: visible; position: relative; z-index: 1;
}
</style>
