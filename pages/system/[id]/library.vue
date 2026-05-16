<template>
  <div class="sysview screen-in">

    <!-- Header -->
    <div class="sysview-header">
      <div class="sysview-name">{{ system?.name ?? '—' }}</div>
      <div class="sysview-sub">{{ system?.description || 'No description.' }}</div>
      <div class="sysview-badges">
        <span class="badge badge-ghost">v{{ system?.version ?? '1' }}</span>
        <span class="badge badge-accent">{{ entityTypes.length }} entity types</span>
        <span class="badge badge-ghost">{{ totalRecords }} records</span>
      </div>
    </div>

    <!-- Actions row -->
    <div class="sysview-actions">
      <div class="co-section-label">Entity Types</div>
      <div style="display:flex; gap:8px; margin-left:auto">
        <NuxtLink :to="`/system/${systemId}/builder`" class="btn btn-ghost btn-sm">Open Builder</NuxtLink>
        <button class="btn btn-ghost btn-sm" @click="exportSystem">↓ Export Schema</button>
      </div>
    </div>

    <!-- Entity type grid -->
    <div class="sysview-types">
      <div
        v-for="et in entityTypes"
        :key="et.id"
        class="systype-card"
        @click="router.push(`/system/${systemId}/${et.id}`)"
      >
        <div class="systype-dot" :style="{ background: et.color }" />
        <div class="systype-name">{{ et.plural }}</div>
        <div class="systype-count">{{ recordCounts[et.id] ?? 0 }} records</div>
        <div class="systype-actions" @click.stop>
          <button class="btn btn-ghost btn-sm" style="font-size:11px; padding:3px 8px"
            @click.stop="router.push(`/system/${systemId}/${et.id}`)">Browse</button>
          <button class="btn btn-ghost btn-sm" style="font-size:11px; padding:3px 8px"
            @click.stop="router.push(`/system/${systemId}/builder?type=${et.id}`)">Edit Type</button>
        </div>
      </div>

      <!-- New type card -->
      <NuxtLink :to="`/system/${systemId}/builder`" class="systype-card systype-card--add">
        <span class="systype-add-icon">+</span>
        <span class="systype-add-label">New Type</span>
      </NuxtLink>

      <div v-if="!entityTypes.length && false" />
    </div>

    <!-- Empty state -->
    <div v-if="!entityTypes.length" class="sysview-empty">
      <div class="sysview-empty-icon">◎</div>
      <div class="sysview-empty-title">No entity types yet</div>
      <div class="sysview-empty-sub">Open the builder to define your first entity type.</div>
      <NuxtLink :to="`/system/${systemId}/builder`" class="btn btn-accent btn-sm" style="margin-top:8px">Open Builder</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useSystems } from '~/composables/useSystems'
import { getDb } from '~/composables/useDb'

const route = useRoute()
const router = useRouter()
const systemsStore = useSystems()
const systemId = Number(route.params.id)
const recordCounts = ref<Record<string, number>>({})

const system = computed(() => systemsStore.getSystem(systemId))
const entityTypes = computed(() => system.value?.entityTypes ?? [])
const totalRecords = computed(() => Object.values(recordCounts.value).reduce((s, n) => s + n, 0))

onMounted(async () => {
  if (!systemsStore.systems.length) await systemsStore.loadAll()
  const rows = await getDb().records.where('systemId').equals(systemId).toArray()
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.entityTypeId] = (counts[r.entityTypeId] ?? 0) + 1
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
.sysview {
  flex: 1;
  overflow-y: auto;
  padding: 32px 32px 60px;
  background: var(--bg);
}

.sysview-header { margin-bottom: 24px; }
.sysview-name {
  font-family: var(--fh);
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
}
.sysview-sub { font-size: 14px; color: var(--text3); margin-bottom: 10px; }
.sysview-badges { display: flex; gap: 6px; flex-wrap: wrap; }

.sysview-actions {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.co-section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text3);
}

.sysview-types {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.systype-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r2);
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
}
.systype-card:hover { border-color: var(--border-hi); box-shadow: var(--sh); }

.systype-dot { width: 8px; height: 8px; border-radius: 3px; margin-bottom: 10px; flex-shrink: 0; }
.systype-name { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.systype-count { font-size: 12px; color: var(--text3); margin-bottom: 10px; flex: 1; }
.systype-actions { display: flex; gap: 4px; }

.systype-card--add {
  border-style: dashed;
  background: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text3);
  text-decoration: none;
  flex-direction: row;
  min-height: 80px;
}
.systype-card--add:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }
.systype-add-icon { font-size: 20px; line-height: 1; }
.systype-add-label { font-size: 13px; font-weight: 500; }

.sysview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text3);
}
.sysview-empty-icon { font-size: 48px; opacity: 0.15; margin-bottom: 12px; }
.sysview-empty-title { font-family: var(--fh); font-size: 16px; color: var(--text); margin-bottom: 6px; }
.sysview-empty-sub { font-size: 13px; color: var(--text3); }
</style>
