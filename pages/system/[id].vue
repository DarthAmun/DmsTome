<template>
  <div class="shell">
    <nav class="icon-rail">
      <div class="icon-rail-logo"><OhVueIcon name="gi-anvil-impact" /></div>
      <NuxtLink to="/" class="rail-icon-btn" title="Dashboard">
        <OhVueIcon name="md-arrowback" scale="0.95" />
      </NuxtLink>
      <div class="rail-divider" />
      <NuxtLink :to="`/system/${systemId}`" class="rail-icon-btn" title="Overview"
        :class="{ active: route.path === `/system/${systemId}` }">
        <OhVueIcon name="gi-book-aura" scale="0.95" />
      </NuxtLink>
      <NuxtLink :to="`/system/${systemId}/builder`" class="rail-icon-btn" title="Builder"
        :class="{ active: route.path.includes('/builder') }">
        <OhVueIcon name="md-settings" scale="0.95" />
      </NuxtLink>
      <div class="rail-divider" />
      <button v-for="et in entityTypes" :key="et.id"
        class="rail-icon-btn" :title="et.plural"
        :style="isActiveType(et.id) ? { color: et.color, background: et.color + '22' } : {}"
        @click="$router.push(`/system/${systemId}/${et.id}`)">
        <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="0.95" />
      </button>
    </nav>
    <div class="shell-body">
      <header class="top-bar">
        <span class="top-bar-title">{{ system?.name ?? 'System' }}</span>
        <span class="top-bar-section">{{ sectionLabel }}</span>
      </header>
      <div class="content-area">
        <NuxtPage />
      </div>
    </div>
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
.shell { display: flex; height: 100vh; overflow: hidden; }
.shell-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.rail-divider { width: 24px; height: 1px; background: var(--border); margin: 4px 0; }
.top-bar-section { font-size: 14px; color: var(--secondary); font-family: 'DM Sans', sans-serif; }
.content-area { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
</style>
