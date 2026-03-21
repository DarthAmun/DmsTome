<template>
  <div class="sys-page">
    <header class="sys-header">
      <NuxtLink to="/" class="sys-back">
        <OhVueIcon name="md-arrowback" scale="0.9" /> Dashboard
      </NuxtLink>
      <h1 class="sys-title">{{ system?.name }}</h1>
      <p v-if="system?.description" class="sys-desc">{{ system.description }}</p>
      <div class="sys-header-actions">
        <NuxtLink :to="`/system/${systemId}/builder`" class="btn-primary-pill">
          <OhVueIcon name="md-settings" scale="0.85" /> Edit Schema
        </NuxtLink>
        <button class="btn-ghost-pill" @click="exportSystem">
          <OhVueIcon name="md-cloud" scale="0.85" /> Export Schema
        </button>
      </div>
    </header>

    <div class="sys-types-grid">
      <NuxtLink
        v-for="et in system?.entityTypes ?? []" :key="et.id"
        :to="`/system/${systemId}/${et.id}`"
        class="et-card v6-card"
      >
        <div class="et-card-icon" :style="{ background: et.color + '18' }">
          <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="2"
            :style="{ color: et.color }" />
        </div>
        <div class="et-card-body">
          <div class="et-card-name">{{ et.plural }}</div>
          <div class="et-card-count">{{ recordCounts[et.id] ?? 0 }} records · {{ et.fields.length }} fields</div>
        </div>
        <div class="et-card-arrow">→</div>
      </NuxtLink>

      <div v-if="!system?.entityTypes?.length" class="et-empty">
        <p>No entity types defined yet.</p>
        <NuxtLink :to="`/system/${systemId}/builder`" class="btn-primary-pill">
          Open Builder
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
import { getDb } from '~/composables/useDb'

const route = useRoute()
const systemsStore = useSystemsStore()
const systemId = Number(route.params.id)
const recordCounts = ref<Record<string, number>>({})

const system = computed(() => systemsStore.getSystem(systemId))

onMounted(async () => {
  if (!systemsStore.systems.length) await systemsStore.loadAll()
  // Count records per entity type
  const rows = await getDb().records.where('systemId').equals(systemId).toArray()
  const counts: Record<string, number> = {}
  for (const r of rows) {
    counts[r.entityTypeId] = (counts[r.entityTypeId] ?? 0) + 1
  }
  recordCounts.value = counts
})

function exportSystem() {
  const json = systemsStore.exportSystem(systemId)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${system.value?.shortId ?? 'system'}-schema.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.sys-page { height: 100%; overflow-y: auto; padding: 32px 28px; background: var(--forge-base); }
.sys-header { margin-bottom: 32px; }
.sys-back { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--forge-muted); text-decoration: none; margin-bottom: 12px; transition: color 0.15s; }
.sys-back:hover { color: var(--forge-text); }
.sys-title { font-family: var(--font-display); font-size: 28px; font-weight: 900; text-transform: uppercase; color: var(--forge-text); margin-bottom: 6px; }
.sys-desc { font-size: 13px; color: var(--forge-secondary); margin-bottom: 16px; }
.sys-header-actions { display: flex; gap: 8px; }
.btn-primary-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; background: var(--forge-accent); color: #0d0d0d; font-size: 13px; font-weight: 700; text-decoration: none; transition: all 0.15s; border: none; cursor: pointer; }
.btn-primary-pill:hover { background: #f5cb4a; }
.btn-ghost-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; background: var(--forge-raised); border: 1px solid var(--forge-border); color: var(--forge-secondary); font-size: 13px; cursor: pointer; transition: all 0.15s; }
.btn-ghost-pill:hover { color: var(--forge-text); }
.sys-types-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.et-card { display: flex; flex-direction: column; overflow: hidden; text-decoration: none; transition: transform 0.15s; }
.et-card:hover { transform: translateY(-2px); }
.et-card-icon { height: 100px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.et-card-body { padding: 14px 16px; flex: 1; }
.et-card-name { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--forge-text); margin-bottom: 4px; }
.et-card-count { font-size: 11px; color: var(--forge-muted); }
.et-card-arrow { padding: 10px 16px; font-size: 18px; color: var(--forge-muted); text-align: right; }
.et-empty { grid-column: 1/-1; text-align: center; padding: 40px; color: var(--forge-muted); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
</style>
