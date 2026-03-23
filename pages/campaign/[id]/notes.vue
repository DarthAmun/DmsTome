<template>
  <div class="notes-folio">
    <!-- Type ribbon -->
    <div class="notes-type-ribbon">
      <button v-for="tab in typeTabs" :key="tab.type"
        class="ribbon-tab" :class="{ active: activeType === tab.type }"
        :style="activeType === tab.type ? { color: tab.color, borderBottomColor: tab.color } : {}"
        @click="selectType(tab.type)">
        <OhVueIcon :name="tab.defaultIcon" scale="0.8" />
        {{ tab.plural }}
      </button>
      <div style="flex:1" />
      <div class="notes-header-tools">
        <div class="ribbon-search">
          <OhVueIcon name="fa-search" scale="0.75" style="color:var(--ink-ghost)" />
          <input v-model="search" class="ribbon-search-input" placeholder="Search…" />
        </div>
        <button class="ribbon-tool" :class="{ active: showGraph }" @click="toggleGraph" title="Graph view">
          <OhVueIcon name="gi-all-seeing-eye" scale="0.85" />
        </button>
        <button class="ribbon-tool" @click="createNew" :title="`New ${activeTypeConfig?.label}`">
          <OhVueIcon name="md-add" scale="0.9" />
        </button>
      </div>
    </div>

    <!-- EDITOR — when a note is selected -->
    <div v-if="selectedId" class="notes-editor-full">
      <div class="editor-back-bar">
        <button class="back-crumb" @click="goBack">← All {{ activeTypeConfig?.plural }}</button>
      </div>
      <div class="editor-body-area">
        <NoteEditor :entity-id="selectedId" :campaign-id="campaignId"
          @navigate="navigateByTypeAndName" @deleted="goBack" />
      </div>
    </div>

    <!-- GRAPH -->
    <div v-else-if="showGraph" class="notes-graph-full">
      <NotesGraph :campaign-id="campaignId" @navigate="navigateByTypeAndName" />
    </div>

    <!-- OPEN BOOK INDEX -->
    <div v-else class="open-book">

      <!-- LEFT PAGE -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <div class="leaf-inner">
            <div class="leaf-header">
              <span class="leaf-type" :style="{ color: activeTypeConfig?.color }">
                {{ activeTypeConfig?.plural }}
              </span>
              <span class="leaf-count">{{ sortedEntities.length }} entries</span>
            </div>
            <div class="leaf-index" v-if="leftEntries.length">
              <div v-for="e in leftEntries" :key="e.id" class="entry" @click="selectEntity(e.id)">
                <div class="entry-icon">
                  <img v-if="entityImage(e)" :src="entityImage(e)" class="entry-thumb" />
                  <OhVueIcon v-else :name="activeTypeConfig?.defaultIcon ?? 'gi-scroll-unfurled'" scale="0.8"
                    :style="{ color: activeTypeConfig?.color }" />
                </div>
                <span class="entry-name">{{ e.name }}</span>
                <span v-for="tag in entitySummaryTags(e)" :key="tag" class="entry-tag"
                  :style="{ color: activeTypeConfig?.color, borderColor: activeTypeConfig?.color }">{{ tag }}</span>
                <span class="entry-dots" />
                <span class="entry-date">{{ formatEntryDate(e.updatedAt) }}</span>
                <div class="entry-actions" @click.stop>
                  <button class="entry-act entry-act--del" @click.stop="confirmDelete(e)">
                    <OhVueIcon name="md-delete" scale="0.7" />
                  </button>
                </div>
              </div>
            </div>
            <div v-if="!sortedEntities.length" class="leaf-empty">
              <OhVueIcon :name="activeTypeConfig?.defaultIcon ?? 'gi-scroll-unfurled'" scale="2"
                style="opacity:0.08;margin-bottom:10px" />
              <em>{{ search ? `No results` : `No ${activeTypeConfig?.plural} yet` }}</em>
            </div>
          </div>
          <div class="leaf-footer">
            <button class="leaf-new" @click="createNew">
              <span class="leaf-new-line-l"></span>
              <span class="leaf-new-label">✦ New {{ activeTypeConfig?.label }} ✦</span>
              <span class="leaf-new-line-r"></span>
            </button>
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
              <span class="leaf-folio">continued</span>
            </div>
            <div class="leaf-index">
              <div v-for="e in rightEntries" :key="e.id" class="entry" @click="selectEntity(e.id)">
                <div class="entry-icon">
                  <img v-if="entityImage(e)" :src="entityImage(e)" class="entry-thumb" />
                  <OhVueIcon v-else :name="activeTypeConfig?.defaultIcon ?? 'gi-scroll-unfurled'" scale="0.8"
                    :style="{ color: activeTypeConfig?.color }" />
                </div>
                <span class="entry-name">{{ e.name }}</span>
                <span v-for="tag in entitySummaryTags(e)" :key="tag" class="entry-tag"
                  :style="{ color: activeTypeConfig?.color, borderColor: activeTypeConfig?.color }">{{ tag }}</span>
                <span class="entry-dots" />
                <span class="entry-date">{{ formatEntryDate(e.updatedAt) }}</span>
                <div class="entry-actions" @click.stop>
                  <button class="entry-act entry-act--del" @click.stop="confirmDelete(e)">
                    <OhVueIcon name="md-delete" scale="0.7" />
                  </button>
                </div>
              </div>
              <div v-if="rightEntries.length === 0 && sortedEntities.length > 0" class="leaf-empty">
                <em style="opacity:0.4">— end of entries —</em>
              </div>
            </div>
          </div>
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

// Split into left and right pages for the open-book spread
const leftEntries = computed(() => {
  const all = sortedEntities.value
  return all.slice(0, Math.ceil(all.length / 2))
})
const rightEntries = computed(() => {
  const all = sortedEntities.value
  return all.slice(Math.ceil(all.length / 2))
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

function entitySummaryTags(e: any): string[] {
  const a = (e.attributes ?? {}) as any
  const tags: string[] = []
  switch (e.type) {
    case 'npc':
      if (a.race)   tags.push(a.race)
      if (a.role)   tags.push(a.role)
      if (a.status) tags.push(a.status)
      break
    case 'location':
      if (a.locationType) tags.push(a.locationType)
      if (a.status)       tags.push(a.status)
      break
    case 'item':
      if (a.rarity)   tags.push(a.rarity)
      if (a.itemType) tags.push(a.itemType)
      if (a.value)    tags.push(a.value)
      break
    case 'faction':
      if (a.factionType) tags.push(a.factionType)
      if (a.size)        tags.push(a.size)
      break
    case 'quest':
      if (a.status)     tags.push(a.status)
      if (a.questGiver) tags.push(a.questGiver)
      break
    case 'event':
      if (a.significance) tags.push(a.significance)
      if (a.location)     tags.push(a.location)
      if (a.date)         tags.push(a.date)
      break
    case 'session':
      if (a.mode)          tags.push(a.mode)
      if (a.sessionNumber) tags.push('#' + a.sessionNumber)
      if (a.date)          tags.push(a.date)
      break
  }
  return tags.slice(0, 3)
}

function entityImage(e: any): string | null {
  const a = e.attributes as any
  if (!a) return null
  return a.portraitSource || a.logoSource || a.imageSource || null
}
function formatEntryDate(dt: string) {
  if (!dt) return ''
  const diff = Date.now() - new Date(dt).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return days + 'd ago'
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
async function confirmDelete(entity: any) {
  if (confirm(`Delete "${entity.name}"?`)) {
    await store.deleteEntity(entity.id)
    router.push({ query: { type: activeType.value } })
  }
}
</script>



<style scoped>
.notes-folio {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--parch);
  overflow: visible;
}

/* Ribbon */
.notes-type-ribbon {
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--parch-dark);
  background: var(--parch);
  flex-shrink: 0;
  padding: 0 16px;
  overflow-x: auto;
}

.ribbon-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 9px 11px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}

.ribbon-tab:hover {
  color: var(--ink-faded);
}

.ribbon-tab.active {
  color: var(--ink);
}

.notes-header-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
}

.ribbon-search {
  display: flex;
  align-items: center;
  gap: 5px;
  border-bottom: 1px solid var(--ink-ghost);
  padding: 3px 0;
  margin-right: 6px;
}

.ribbon-search-input {
  background: none;
  border: none;
  outline: none;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--ink);
  width: 100px;
}

.ribbon-search-input::placeholder {
  color: var(--ink-ghost);
  font-style: italic;
}

.ribbon-tool {
  width: 28px;
  height: 28px;
  border-radius: 3px;
  background: none;
  border: 1px solid transparent;
  color: var(--ink-ghost);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.ribbon-tool:hover {
  border-color: var(--parch-dark);
  color: var(--ink-faded);
}

.ribbon-tool.active {
  background: var(--blood-pale);
  color: var(--blood);
  border-color: var(--blood);
}

/* Full editor when note open */
.notes-editor-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-back-bar {
  padding: 8px 24px;
  border-bottom: 1px dashed var(--parch-line);
  flex-shrink: 0;
  background: var(--parch);
}

.back-crumb {
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0;
}

.back-crumb:hover {
  color: var(--blood);
}

.editor-body-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notes-graph-full {
  flex: 1;
  overflow: hidden;
}

/* ── OPEN BOOK spread ── */
.leaf-inner {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
}

.leaf-footer {
  padding: 10px 28px 16px;
  border-top: 1px dashed var(--parch-line);
  background: var(--parch);
}

.leaf-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--parch-line);
}

.leaf-header--right {
  justify-content: flex-end;
}

.leaf-type {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.leaf-count {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
}

.leaf-folio {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
  font-style: italic;
}

.leaf-index {
  display: flex;
  flex-direction: column;
}

.leaf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  color: var(--ink-ghost);
  font-family: var(--font-body);
  font-size: 14px;
  font-style: italic;
}

/* Book binding */
/* Entry styles — overrides for parchment */
.entry-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--parch-dark);
  flex-shrink: 0;
}

.entry-icon {
  width: 24px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-actions {
  display: flex;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s;
}

.entry:hover .entry-actions {
  opacity: 1;
}

.entry-act {
  width: 18px;
  height: 18px;
  border-radius: 2px;
  background: rgba(28, 20, 16, 0.06);
  border: 1px solid transparent;
  color: var(--ink-ghost);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.entry-act--del:hover {
  background: var(--blood-pale);
  color: var(--blood);
}

</style>