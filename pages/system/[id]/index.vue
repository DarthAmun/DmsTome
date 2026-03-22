<template>
  <div class="sys-folio">
    <div class="page-header sys-header">
      <div class="page-chapter-num">System</div>
      <h1 class="page-title">{{ system?.name }}</h1>
      <div class="page-rule" />
    </div>
    <div class="sys-actions">
      <p v-if="system?.description" class="tome-intro">
        <em>{{ system.description }}</em>
      </p>
      <div class="sys-action-row">
        <NuxtLink :to="`/system/${systemId}/builder`" class="seal-btn">
          <OhVueIcon name="md-settings" scale="0.85" /> Edit Schema
        </NuxtLink>
        <button class="parch-btn" @click="exportSystem">
          <OhVueIcon name="md-cloud" scale="0.85" /> Export
        </button>
      </div>
    </div>

    <div class="page-content sys-content" data-page="·">
      <div class="index-list">
        <NuxtLink
          v-for="et in system?.entityTypes ?? []" :key="et.id"
          :to="`/system/${systemId}/${et.id}`"
          class="entry">
          <div class="entry-icon">
            <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="0.9"
              :style="{ color: et.color }" />
          </div>
          <span class="entry-name">{{ et.plural }}</span>
          <span class="entry-dots" />
          <span class="entry-tag" :style="{ color: et.color, borderColor: et.color }">
            {{ recordCounts[et.id] ?? 0 }} records
          </span>
          <span class="entry-date">{{ et.fields.length }} fields</span>
        </NuxtLink>
        <div v-if="!system?.entityTypes?.length" class="tome-empty-inline">
          <em>No entity types yet. Open the builder to define them.</em>
        </div>
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
.sys-folio { height: 100%; display: flex; flex-direction: column; overflow: hidden; background: var(--parch); }
.sys-header { padding-bottom: 0; flex-shrink: 0; }
.sys-actions { padding: 16px 36px 0; flex-shrink: 0; }
.tome-intro { font-family: var(--font-body); font-size: 15px; color: var(--ink-faded); margin-bottom: 12px; line-height: 1.6; }
.sys-action-row { display: flex; gap: 8px; margin-bottom: 8px; padding-bottom: 16px; border-bottom: 1px solid var(--parch-line); }
.sys-content { background-image: none !important; }
.tome-empty-inline { padding: 24px 0; font-family: var(--font-body); font-size: 15px; color: var(--ink-ghost); text-align: center; }
</style>
