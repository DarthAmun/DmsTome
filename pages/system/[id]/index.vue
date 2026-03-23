<template>
  <div class="sys-folio">
    <div class="open-book">

      <!-- LEFT PAGE -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <div class="page-header">
            <div class="page-chapter-num">System</div>
            <h1 class="page-title">{{ system?.name }}</h1>
            <div class="page-rule" />
          </div>
          <div class="leaf-inner">
            <div class="leaf-header">
              <span class="leaf-type" style="color:var(--arcane-l)">Entity Types</span>
              <span class="leaf-count">{{ system?.entityTypes?.length ?? 0 }} defined</span>
            </div>
            <NuxtLink
              v-for="et in system?.entityTypes ?? []" :key="et.id"
              :to="`/system/${systemId}/${et.id}`"
              class="entry">
              <div class="entry-icon">
                <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="0.9" :style="{ color: et.color }" />
              </div>
              <span class="entry-name">{{ et.plural }}</span>
              <span class="entry-dots" />
              <span class="entry-tag" :style="{ color: et.color, borderColor: et.color }">
                {{ recordCounts[et.id] ?? 0 }} records
              </span>
              <span class="entry-date">{{ et.fields.length }} fields</span>
            </NuxtLink>
            <div v-if="!system?.entityTypes?.length" class="leaf-empty">
              <OhVueIcon name="gi-scroll-unfurled" scale="2.5" style="opacity:0.07;margin-bottom:10px" />
              <em>No entity types yet.<br>Open the builder to define them.</em>
            </div>
          </div>
          <div class="leaf-footer">
            <NuxtLink :to="`/system/${systemId}/builder`" class="leaf-new" style="text-decoration:none">
              <span class="leaf-new-line-l"></span>
              <span class="leaf-new-label">✦ Open Builder ✦</span>
              <span class="leaf-new-line-r"></span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="book-binding"></div>

      <!-- RIGHT PAGE -->
      <div class="book-stack book-stack--right">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--right">
          <div class="leaf-inner">
            <div class="leaf-header leaf-header--right">
              <span class="leaf-folio">{{ system?.shortId ?? '' }}</span>
              <span class="leaf-version">v{{ system?.version }}</span>
            </div>
            <p v-if="system?.description" class="sys-desc"><em>{{ system.description }}</em></p>
            <p v-else class="sys-desc sys-desc--empty"><em>No description yet.</em></p>
            <div class="sys-stats">
              <div class="sys-stat">
                <span class="sys-stat-num">{{ system?.entityTypes?.length ?? 0 }}</span>
                <span class="sys-stat-label">Entity Types</span>
              </div>
              <div class="sys-stat">
                <span class="sys-stat-num">{{ totalFields }}</span>
                <span class="sys-stat-label">Total Fields</span>
              </div>
              <div class="sys-stat">
                <span class="sys-stat-num">{{ totalRecords }}</span>
                <span class="sys-stat-label">Records</span>
              </div>
            </div>
            <div class="sys-divider"></div>
            <div class="sys-actions-col">
              <NuxtLink :to="`/system/${systemId}/builder`" class="sys-action-link">
                <OhVueIcon name="md-settings" scale="0.9" />
                Edit Schema
                <span class="sys-action-arrow">→</span>
              </NuxtLink>
              <button class="sys-action-link" @click="exportSystem">
                <OhVueIcon name="md-cloud" scale="0.9" />
                Export Schema
                <span class="sys-action-arrow">↓</span>
              </button>
            </div>
          </div>
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
const totalFields = computed(() =>
  (system.value?.entityTypes ?? []).reduce((sum, et) => sum + et.fields.length, 0)
)
const totalRecords = computed(() =>
  Object.values(recordCounts.value).reduce((sum, n) => sum + n, 0)
)

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
.sys-folio { height: 100%; display: flex; flex-direction: column; overflow: visible; background: var(--parch); }

/* Open book */









.leaf-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--parch-line); }
.leaf-header--right { justify-content: space-between; }
.leaf-type    { font-family: var(--font-head); font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; }
.leaf-count   { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); }
.leaf-folio   { font-family: var(--font-mono); font-size: 10px; color: var(--ink-ghost); }
.leaf-version { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); }

.leaf-empty { display: flex; flex-direction: column; align-items: center; padding: 32px 0; color: var(--ink-ghost); font-family: var(--font-body); font-size: 14px; font-style: italic; gap: 0; text-align: center; line-height: 1.7; }


/* Entry icon */
.entry-icon { width: 26px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* Right page content */
.sys-desc {
  font-family: var(--font-body); font-size: 16px; color: var(--ink-faded);
  line-height: 1.7; margin-bottom: 28px; padding-bottom: 20px;
  border-bottom: 1px dashed var(--parch-line);
}
.sys-desc--empty { color: var(--ink-ghost); }

/* Stats row — like a publisher's colophon */
.sys-stats {
  display: flex; gap: 0; margin-bottom: 24px;
}
.sys-stat {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 14px 0;
  border-right: 1px dashed var(--parch-line);
}
.sys-stat:last-child { border-right: none; }
.sys-stat-num {
  font-family: var(--font-deco); font-size: 28px; font-weight: 700;
  color: var(--blood); opacity: 0.5; line-height: 1;
}
.sys-stat-label {
  font-family: var(--font-head); font-size: 8px; font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-ghost);
}

.sys-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--parch-line) 20%, var(--parch-line) 80%, transparent);
  margin-bottom: 20px;
}

/* Action links — like chapter references */
.sys-actions-col { display: flex; flex-direction: column; gap: 0; }
.sys-action-link {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 0; border-bottom: 1px dashed var(--parch-line);
  font-family: var(--font-body); font-size: 16px; color: var(--ink-faded);
  text-decoration: none; cursor: pointer;
  background: none; border-top: none; border-left: none; border-right: none;
  text-align: left; width: 100%;
  transition: all 0.18s; position: relative;
}
.sys-action-link:hover { color: var(--ink); padding-left: 8px; }
.sys-action-link:hover::before { content: '›'; position: absolute; left: -4px; color: var(--blood); font-size: 18px; }
.sys-action-arrow { margin-left: auto; color: var(--ink-ghost); transition: color 0.18s, transform 0.18s; }
.sys-action-link:hover .sys-action-arrow { color: var(--blood); transform: translateX(4px); }
</style>
