<template>
  <div class="shell">
    <nav class="icon-rail">
      <div class="icon-rail-logo">
        <OhVueIcon name="gi-anvil-impact" />
      </div>
      <NuxtLink to="/" class="rail-icon-btn" title="Back">
        <OhVueIcon name="md-arrowback" scale="0.95" />
      </NuxtLink>
      <div class="rail-divider" />
      <button v-for="tab in typeTabs" :key="tab.type" class="rail-icon-btn"
        :class="{ active: activeType === tab.type }"
        :title="tab.plural"
        :style="activeType === tab.type ? { color: tab.color, background: tab.color + '22' } : {}"
        @click="selectType(tab.type)">
        <OhVueIcon :name="tab.defaultIcon" scale="1" />
      </button>
      <div class="rail-spacer" />
      <button class="rail-fab" title="New" @click="createNew">+</button>
    </nav>

    <div class="shell-body">
      <header class="top-bar">
        <span class="top-bar-title">{{ campaignName }}</span>
        <span class="top-bar-section">/ {{ activeTypeConfig?.plural }}</span>
        <div class="top-bar-spacer" />
        <div class="search-wrap">
          <OhVueIcon name="fa-search" scale="0.8" style="color:var(--muted)" />
          <input v-model="search" class="search-input" :placeholder="`Search ${activeTypeConfig?.plural}…`" />
        </div>
        <Select v-model="sortBy" :options="sortOptions" option-label="label" option-value="value" style="width:140px" />
        <Button :severity="showGraph ? undefined : 'secondary'" @click="toggleGraph">
          <template #icon><OhVueIcon name="gi-all-seeing-eye" scale="0.85" /></template>
          {{ showGraph ? 'Cards' : 'Graph' }}
        </Button>
      </header>

      <!-- Detail view -->
      <template v-if="selectedId">
        <div class="detail-bar">
          <button class="pill-btn" @click="goBack">
            <OhVueIcon name="md-arrowback" scale="0.8" /> All {{ activeTypeConfig?.plural }}
          </button>
        </div>
        <div class="detail-body">
          <NoteEditor :entity-id="selectedId" :campaign-id="campaignId"
            @navigate="navigateByTypeAndName" @deleted="goBack" />
        </div>
      </template>

      <!-- Graph view -->
      <div v-else-if="showGraph" class="main-canvas" style="padding:0;overflow:hidden;height:100%">
        <NotesGraph :campaign-id="campaignId" @navigate="navigateByTypeAndName" />
      </div>

      <!-- Cards view -->
      <div v-else class="main-canvas">
        <div class="cards-header">
          <h1 class="section-eyebrow" :style="{ color: activeTypeConfig?.color }">
            {{ activeTypeConfig?.plural }}
            <span style="color:var(--muted);font-size:16px;font-weight:500;letter-spacing:0">
              ({{ sortedEntities.length }})
            </span>
          </h1>
        </div>
        <div v-if="sortedEntities.length > 0" class="cards-grid">
          <EntityCard v-for="e in sortedEntities" :key="e.id" :entity="e"
            @click="selectEntity(e.id)" @edit="selectEntity(e.id)"
            @duplicate="store.duplicateEntity(e.id)" @delete="confirmDelete(e)" />
        </div>
        <div v-else class="empty-state">
          <OhVueIcon :name="activeTypeConfig?.defaultIcon ?? 'gi-scroll-unfurled'" scale="3"
            style="opacity:0.12;margin-bottom:16px" />
          <p style="color:var(--secondary);font-size:14px;margin-bottom:20px">
            {{ search ? `No results for "${search}"` : `No ${activeTypeConfig?.plural} yet` }}
          </p>
          <Button @click="createNew">
            <template #icon><OhVueIcon name="md-add" scale="0.85" /></template>
            New {{ activeTypeConfig?.label }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotesStore } from '~/stores/notes'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import type { EntityType } from '~/types/entities'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const campaignId = Number(route.params.id)
const campaignName = ref('Campaign')
const search = ref('')
const sortBy = ref('updated')
const showGraph = ref(false)

const typeTabs = Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => ({ type: type as EntityType, ...cfg }))
const sortOptions = [
  { label: 'Last edited', value: 'updated' },
  { label: 'Created', value: 'created' },
  { label: 'Name', value: 'name' },
]

// All state is driven from the URL query string — this makes the browser back button work
const activeType = computed(() => (route.query.type as EntityType) || 'note')
const selectedId = computed(() => route.query.id ? Number(route.query.id) : null)
const activeTypeConfig = computed(() => ENTITY_TYPE_CONFIG[activeType.value])

const sortedEntities = computed(() => {
  const list = (store.byType[activeType.value] ?? [])
    .filter(e => !search.value || e.name.toLowerCase().includes(search.value.toLowerCase()))
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

onMounted(async () => {
  await store.loadAll(campaignId)
  if (window.dmforge) {
    const camps = await window.dmforge.campaigns.list()
    campaignName.value = camps.find((c: any) => c.id === campaignId)?.name ?? 'Campaign'
  }
})

// Navigation — all push to router so back button works
function selectType(type: EntityType) {
  router.push({ query: { type } })
}

function selectEntity(id: number) {
  router.push({ query: { type: activeType.value, id: String(id) } })
}

function toggleGraph() {
  showGraph.value = !showGraph.value
  if (showGraph.value) router.push({ query: { type: activeType.value, view: 'graph' } })
  else router.push({ query: { type: activeType.value } })
}

function goBack() {
  if (selectedId.value) {
    router.push({ query: { type: activeType.value } })
  } else {
    router.back()
  }
}

function navigateByTypeAndName(type: string, name: string) {
  const e = store.findByTypeAndName(type, name)
  if (e) {
    router.push({ query: { type: e.type, id: String(e.id) } })
    showGraph.value = false
  } else if (confirm(`"${name}" doesn't exist yet. Create it?`)) {
    store.createEntity(campaignId, type as EntityType, name).then(en => {
      router.push({ query: { type: en.type, id: String(en.id) } })
    })
  }
}

async function createNew() {
  const e = await store.createEntity(campaignId, activeType.value, `New ${activeTypeConfig.value?.label}`)
  selectEntity(e.id)
}

async function confirmDelete(entity: any) {
  if (confirm(`Delete "${entity.name}"?`)) {
    await store.deleteEntity(entity.id)
    router.push({ query: { type: activeType.value } })
  }
}
</script>

<style scoped>
.shell { display: flex; height: 100vh; overflow: hidden; }
.shell-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.rail-divider { width: 24px; height: 1px; background: var(--border); margin: 4px 0; }
.top-bar-section { font-size: 14px; color: var(--secondary); font-family: 'DM Sans', sans-serif; }
.top-bar-spacer { flex: 1; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: var(--raised); border-radius: var(--r-pill); padding: 7px 14px; }
.search-input { background: none; border: none; outline: none; font-size: 13px; color: var(--text); font-family: 'DM Sans', sans-serif; width: 160px; }
.search-input::placeholder { color: var(--muted); }
.detail-bar { padding: 10px 20px; background: var(--card); border-bottom: 1px solid var(--border); flex-shrink: 0; }
.detail-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.cards-header { margin-bottom: 20px; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; min-height: 400px; }
</style>
