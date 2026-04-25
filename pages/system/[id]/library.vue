<template>
  <div class="library-folio">
    <div class="open-book">

      <!-- LEFT PAGE -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <div class="page-header">
            <div class="page-chapter-num">{{ system?.name }}</div>
            <h1 class="page-title">Library</h1>
            <div class="page-rule" />
          </div>
          <div class="leaf-inner">
            <div v-if="!entityTypes.length" class="leaf-empty">
              <OhVueIcon name="gi-scroll-unfurled" scale="2.5" style="opacity:0.07;margin-bottom:10px" />
              <em>No entity types yet.<br>Open the builder to define them.</em>
            </div>
            <div v-else class="et-grid">
              <div v-for="et in entityTypes" :key="et.id"
                class="et-card"
                :style="{ '--et-color': et.color }"
                @click="router.push(`/system/${systemId}/${et.id}`)">
                <OhVueIcon :name="safeIcon(et.icon)" :scale="2" :style="{ color: et.color }" />
                <span class="et-card-name">{{ et.plural }}</span>
                <span class="et-card-count">{{ recordCounts[et.id] ?? 0 }} records</span>
              </div>
            </div>
          </div>
          <div class="leaf-footer">
            <NuxtLink :to="`/system/${systemId}/builder`" class="leaf-new" style="text-decoration:none;flex:1;width:auto">
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
            <div class="sys-name">{{ system?.name }}</div>
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
            <button class="sys-export-btn" @click="exportSystem">
              <OhVueIcon name="md-cloud" scale="0.9" />
              Export Schema
              <span class="sys-export-arrow">↓</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
import { getDb } from '~/composables/useDb'
import { GI_ICON_NAMES } from '~/plugins/oh-vue-icons.client'

const VALID_ICONS = new Set(GI_ICON_NAMES)
function safeIcon(name: string | undefined): string {
  if (!name) return 'gi-scroll-unfurled'
  return VALID_ICONS.has(name) ? name : 'gi-scroll-unfurled'
}

const route = useRoute()
const router = useRouter()
const systemsStore = useSystemsStore()
const systemId = Number(route.params.id)
const recordCounts = ref<Record<string, number>>({})

const system = computed(() => systemsStore.getSystem(systemId))
const entityTypes = computed(() => system.value?.entityTypes ?? [])

const totalFields = computed(() =>
  entityTypes.value.reduce((sum, et) => sum + et.fields.length, 0)
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
.library-folio {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
}

.leaf-inner {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
}

.leaf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: var(--ink-ghost);
  font-family: var(--font-body);
  font-size: 14px;
  font-style: italic;
  gap: 0;
  text-align: center;
  line-height: 1.7;
}

/* Entity type grid */
.et-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 4px 2px;
}

.et-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px 16px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  cursor: pointer;
  transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
}

.et-card:hover {
  border-color: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 60%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.et-card-name {
  font-family: 'Cinzel', var(--font-deco);
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
  text-align: center;
  line-height: 1.3;
}

.et-card-count {
  font-family: var(--font-head);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--ink-ghost);
  text-align: center;
}

/* Footer */
.leaf-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 14px;
  border-top: 1px dashed var(--parch-line);
}

/* Right page */
.sys-name {
  font-family: 'Cinzel Decorative', var(--font-deco);
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 12px;
  line-height: 1.3;
}

.sys-desc {
  font-family: 'IM Fell English', var(--font-body);
  font-size: 15px;
  color: var(--ink-faded);
  line-height: 1.7;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px dashed var(--parch-line);
}
.sys-desc--empty { color: var(--ink-ghost); }

.sys-stats {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
}
.sys-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 0;
  border-right: 1px dashed var(--parch-line);
}
.sys-stat:last-child { border-right: none; }
.sys-stat-num {
  font-family: var(--font-deco);
  font-size: 28px;
  font-weight: 700;
  color: var(--blood);
  opacity: 0.5;
  line-height: 1;
}
.sys-stat-label {
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-ghost);
}

.sys-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--parch-line) 20%, var(--parch-line) 80%, transparent);
  margin-bottom: 20px;
}

.sys-export-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px dashed var(--parch-line);
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--ink-faded);
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  text-align: left;
  width: 100%;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
}
.sys-export-btn:hover {
  color: var(--ink);
  padding-left: 8px;
}
.sys-export-btn:hover::before {
  content: '›';
  position: absolute;
  left: -4px;
  color: var(--blood);
  font-size: 18px;
}
.sys-export-arrow {
  margin-left: auto;
  color: var(--ink-ghost);
  transition: color 0.18s, transform 0.18s;
}
.sys-export-btn:hover .sys-export-arrow {
  color: var(--blood);
  transform: translateY(3px);
}
</style>
