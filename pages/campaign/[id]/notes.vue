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

    <!-- GRAPH (full width) -->
    <div v-if="showGraph" class="notes-graph-full">
      <NotesGraph :campaign-id="campaignId" @navigate="navigateByTypeAndName" />
    </div>

    <!-- OPEN BOOK — always visible (editor opens on right page) -->
    <div v-else class="open-book">

      <!-- LEFT PAGE -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">

          <!-- EDITOR PANE — when an entry is selected -->
          <template v-if="selectedId">
            <div class="leaf-inner leaf-inner--editor">
              <NoteEditor :entity-id="selectedId" :campaign-id="campaignId" side="editor"
                @navigate="navigateByTypeAndName" @deleted="goBack" />
            </div>
            <div class="leaf-footer">
              <button class="back-crumb" @click="goBack">← {{ activeTypeConfig?.plural }}</button>
            </div>
          </template>

          <!-- LIST — left half of paginated index -->
          <template v-else>
          <div class="leaf-inner">
            <div class="leaf-header">
              <span class="leaf-type" :style="{ color: activeTypeConfig?.color }">
                {{ activeTypeConfig?.plural }}
              </span>
              <span class="leaf-count">{{ sortedEntities.length }} entries</span>
            </div>
            <div class="leaf-index" v-if="leftEntries.length">
              <div v-for="(e, i) in leftEntries" :key="e.id" class="entry"
                :class="{ 'entry--active': e.id === selectedId }"
                :style="{ '--et-color': isDeceased(e) ? 'var(--ink-ghost)' : activeTypeConfig?.color }"
                @click="selectEntity(e.id)">
                <span class="entry-num">{{ spreadPage * PAGE_HALF * 2 + i + 1 }}</span>
                <div class="entry-icon">
                  <div class="entry-badge">
                    <img v-if="entityImage(e)" :src="entityImage(e)" class="entry-thumb" />
                    <OhVueIcon v-else :name="entityIcon(e)" scale="0.75"
                      :style="{ color: isDeceased(e) ? 'var(--ink-ghost)' : activeTypeConfig?.color }" />
                  </div>
                </div>
                <div class="entry-body">
                  <div class="entry-top">
                    <span class="entry-name" :class="{ 'entry-name--deceased': isDeceased(e) }">{{ e.name }}</span>
                    <span class="entry-leader" />
                    <span class="entry-date">{{ formatEntryDate(e.updatedAt) }}</span>
                    <div class="entry-actions" @click.stop>
                      <button class="entry-act entry-act--del" @click.stop="confirmDelete(e)">
                        <OhVueIcon name="md-delete" scale="0.7" />
                      </button>
                    </div>
                  </div>
                  <div v-if="(summaries.get(e.id)?.primary.length ?? 0) > 0 || (summaries.get(e.id)?.secondary.length ?? 0) > 0"
                    class="entry-attrs">
                    <template v-for="(item, ci) in summaries.get(e.id)?.primary ?? []" :key="item.key">
                      <span v-if="ci > 0" class="ea-sep">✦</span>
                      <span v-if="item.kind === 'pill'" class="ea-pill"
                        :style="item.color ? { color: item.color, borderColor: item.color, background: `color-mix(in srgb, ${item.color} 10%, transparent)` } : {}">
                        <OhVueIcon v-if="item.icon" :name="item.icon" scale="0.7" />{{ item.value }}
                      </span>
                      <span v-else-if="item.kind === 'text'" class="ea-text">
                        <OhVueIcon v-if="item.icon" :name="item.icon" scale="0.7" />
                        <span v-if="item.label" class="ea-label">{{ item.label }}</span>{{ item.value }}
                      </span>
                      <span v-else-if="item.kind === 'bool'" class="ea-bool"
                        :class="{ 'ea-bool--danger': item.danger, 'ea-bool--muted': item.muted }">
                        <OhVueIcon v-if="item.icon" :name="item.icon" scale="0.75" />{{ item.value }}
                      </span>
                      <template v-else-if="item.kind === 'tags'">
                        <span v-for="t in item.tags" :key="t" class="ea-tag">{{ t }}</span>
                      </template>
                    </template>
                    <span v-if="(summaries.get(e.id)?.secondary.length ?? 0) > 0" class="ea-spacer" />
                    <template v-for="(item, si) in summaries.get(e.id)?.secondary ?? []" :key="'s' + item.key">
                      <span v-if="si > 0" class="ea-sep">✦</span>
                      <span v-if="item.kind === 'text'" class="ea-secondary-item">
                        <OhVueIcon v-if="item.icon" :name="item.icon" scale="0.7" />{{ item.value }}
                      </span>
                    </template>
                  </div>
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
            <button class="leaf-nav-btn" :disabled="!hasPrevSpread" @click="prevSpread">
              <OhVueIcon name="md-chevronleft" scale="0.9" />
            </button>
            <button class="leaf-new" @click="createNew">
              <span class="leaf-new-line-l"></span>
              <span class="leaf-new-label">✦ New {{ activeTypeConfig?.label }} ✦</span>
              <span class="leaf-new-line-r"></span>
            </button>
            <span class="leaf-folio-num">{{ spreadPage + 1 }}</span>
          </div>
          </template>
        </div>
      </div>

      <div class="book-binding"></div>

      <!-- RIGHT PAGE -->
      <div class="book-stack book-stack--right">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--right">

          <!-- PREVIEW PANE — when an entry is selected -->
          <template v-if="selectedId">
            <div class="leaf-inner leaf-inner--editor">
              <NoteEditor :entity-id="selectedId" :campaign-id="campaignId" side="preview"
                @navigate="navigateByTypeAndName" />
            </div>
          </template>

          <!-- LIST — right half of paginated index -->
          <template v-else>
            <div class="leaf-inner">
              <div class="leaf-header leaf-header--right">
                <span class="leaf-folio">{{ spreadPage + 1 }} / {{ totalSpreads }}</span>
              </div>
              <div class="leaf-index">
                <div v-for="(e, i) in rightEntries" :key="e.id" class="entry"
                  :style="{ '--et-color': isDeceased(e) ? 'var(--ink-ghost)' : activeTypeConfig?.color }"
                  @click="selectEntity(e.id)">
                  <span class="entry-num">{{ spreadPage * PAGE_HALF * 2 + PAGE_HALF + i + 1 }}</span>
                  <div class="entry-icon">
                    <div class="entry-badge">
                      <img v-if="entityImage(e)" :src="entityImage(e)" class="entry-thumb" />
                      <OhVueIcon v-else :name="entityIcon(e)" scale="0.75"
                        :style="{ color: isDeceased(e) ? 'var(--ink-ghost)' : activeTypeConfig?.color }" />
                    </div>
                  </div>
                  <div class="entry-body">
                    <div class="entry-top">
                      <span class="entry-name" :class="{ 'entry-name--deceased': isDeceased(e) }">{{ e.name }}</span>
                      <span class="entry-leader" />
                      <span class="entry-date">{{ formatEntryDate(e.updatedAt) }}</span>
                      <div class="entry-actions" @click.stop>
                        <button class="entry-act entry-act--del" @click.stop="confirmDelete(e)">
                          <OhVueIcon name="md-delete" scale="0.7" />
                        </button>
                      </div>
                    </div>
                    <div v-if="(summaries.get(e.id)?.primary.length ?? 0) > 0 || (summaries.get(e.id)?.secondary.length ?? 0) > 0"
                      class="entry-attrs">
                      <template v-for="(item, ci) in summaries.get(e.id)?.primary ?? []" :key="item.key">
                        <span v-if="ci > 0" class="ea-sep">✦</span>
                        <span v-if="item.kind === 'pill'" class="ea-pill"
                          :style="item.color ? { color: item.color, borderColor: item.color, background: `color-mix(in srgb, ${item.color} 10%, transparent)` } : {}">
                          <OhVueIcon v-if="item.icon" :name="item.icon" scale="0.7" />{{ item.value }}
                        </span>
                        <span v-else-if="item.kind === 'text'" class="ea-text">
                          <OhVueIcon v-if="item.icon" :name="item.icon" scale="0.7" />
                          <span v-if="item.label" class="ea-label">{{ item.label }}</span>{{ item.value }}
                        </span>
                        <span v-else-if="item.kind === 'bool'" class="ea-bool"
                          :class="{ 'ea-bool--danger': item.danger, 'ea-bool--muted': item.muted }">
                          <OhVueIcon v-if="item.icon" :name="item.icon" scale="0.75" />{{ item.value }}
                        </span>
                        <template v-else-if="item.kind === 'tags'">
                          <span v-for="t in item.tags" :key="t" class="ea-tag">{{ t }}</span>
                        </template>
                      </template>
                      <span v-if="(summaries.get(e.id)?.secondary.length ?? 0) > 0" class="ea-spacer" />
                      <template v-for="(item, si) in summaries.get(e.id)?.secondary ?? []" :key="'s' + item.key">
                        <span v-if="si > 0" class="ea-sep">✦</span>
                        <span v-if="item.kind === 'text'" class="ea-secondary-item">
                          <OhVueIcon v-if="item.icon" :name="item.icon" scale="0.7" />{{ item.value }}
                        </span>
                      </template>
                    </div>
                  </div>
                </div>
                <div v-if="rightEntries.length === 0 && sortedEntities.length > 0" class="leaf-inner--right">
                  <OhVueIcon :name="activeTypeConfig?.defaultIcon ?? 'gi-scroll-unfurled'" scale="4"
                    :style="{ opacity: 0.13, marginBottom: '24px', color: activeTypeConfig?.color }" />
                  <p class="right-hint"><em>All {{ activeTypeConfig?.plural }} are<br>listed on the facing page.</em></p>
                </div>
              </div>
            </div>
            <div class="leaf-footer leaf-footer--right">
              <span class="leaf-folio-num">{{ spreadPage + 2 }}</span>
              <button class="leaf-nav-btn" :disabled="!hasNextSpread" @click="nextSpread">
                <OhVueIcon name="md-chevronright" scale="0.9" />
              </button>
            </div>
          </template>

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

const search = ref('')
const sortBy = ref('updated')
const showGraph = ref(false)

const typeTabs = Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => ({ type: type as EntityType, ...cfg }))

// All state is driven from the URL query string — this makes the browser back button work
const activeType = computed(() => (route.query.type as EntityType) || 'session')
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

// Pagination — 8 entries per half-page, 16 per spread
const PAGE_HALF = 8
const spreadPage = ref(0)
const hasPrevSpread = computed(() => spreadPage.value > 0)
const hasNextSpread = computed(() => (spreadPage.value + 1) * PAGE_HALF * 2 < sortedEntities.value.length)
const totalSpreads = computed(() => Math.max(1, Math.ceil(sortedEntities.value.length / (PAGE_HALF * 2))))

const leftEntries = computed(() => {
  const start = spreadPage.value * PAGE_HALF * 2
  return sortedEntities.value.slice(start, start + PAGE_HALF)
})
const rightEntries = computed(() => {
  const start = spreadPage.value * PAGE_HALF * 2 + PAGE_HALF
  return sortedEntities.value.slice(start, start + PAGE_HALF)
})

function prevSpread() { if (hasPrevSpread.value) spreadPage.value-- }
function nextSpread() { if (hasNextSpread.value) spreadPage.value++ }

// Reset page when type or search changes
watch([activeType, search], () => { spreadPage.value = 0 })

onMounted(async () => {
  await store.loadAll(campaignId)
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

type AttrItem =
  | { kind: 'pill'; key: string; value: string; color?: string; icon?: string }
  | { kind: 'text'; key: string; value: string; label?: string; icon?: string }
  | { kind: 'bool'; key: string; value: string; icon?: string; danger?: boolean; muted?: boolean }
  | { kind: 'tags'; key: string; tags: string[] }

type EntrySummary = { primary: AttrItem[]; secondary: AttrItem[] }

// primary = classification chips (bottom row, left)
// secondary = context items (bottom row, right — separated by dotted leader)
function entitySummary(e: any): EntrySummary {
  const a = (e.attributes ?? {}) as any
  const primary: AttrItem[] = []
  const secondary: AttrItem[] = []

  const itemTypeIcon: Record<string, string> = {
    weapon: 'gi-broadsword', armor: 'gi-shield', consumable: 'gi-health-potion',
    treasure: 'gi-coins', misc: 'gi-open-treasure-chest',
  }

  switch (e.type) {
    case 'npc':
      if (a.race)  primary.push({ kind: 'pill', key: 'race',  value: a.race,  color: '#7cc44e', icon: 'gi-person' })
      if (a.role)  primary.push({ kind: 'pill', key: 'role',  value: a.role,  color: '#7cc44e', icon: 'gi-broadsword' })
      if (a.level) primary.push({ kind: 'text', key: 'level', value: a.level, label: 'Lv ' })
      if (a.title)  secondary.push({ kind: 'text', key: 'title',  value: a.title,  icon: 'gi-scroll-unfurled' })
      else if (a.status) secondary.push({ kind: 'text', key: 'status', value: a.status, icon: 'gi-sands-of-time' })
      break

    case 'location':
      if (a.locationType) primary.push({ kind: 'pill', key: 'type',   value: a.locationType, color: '#a87de8', icon: 'gi-castle' })
      if (a.status) {
        const col = a.status === 'discovered' ? '#5a8a3a' : a.status === 'destroyed' ? 'var(--blood)' : undefined
        primary.push({ kind: 'pill', key: 'status', value: a.status, color: col, icon: 'gi-all-seeing-eye' })
      }
      break

    case 'item':
      if (a.itemType) primary.push({ kind: 'pill', key: 'type',   value: a.itemType, icon: itemTypeIcon[a.itemType] })
      if (a.rarity) {
        const rc: Record<string, string> = { uncommon: '#5a8a3a', rare: '#6b9fe8', unique: '#c49a1a' }
        primary.push({ kind: 'pill', key: 'rarity', value: a.rarity, color: rc[a.rarity], icon: 'gi-sparkles' })
      }
      if (a.isMagic)  primary.push({ kind: 'bool', key: 'magic',  value: 'Magic',  icon: 'gi-magic-palm' })
      if (a.isCursed) primary.push({ kind: 'bool', key: 'cursed', value: 'Cursed', icon: 'fa-skull', danger: true })
      if (a.value) secondary.push({ kind: 'text', key: 'value', value: a.value, icon: 'gi-coins' })
      break

    case 'faction':
      if (a.factionType) primary.push({ kind: 'pill', key: 'type', value: a.factionType, color: '#e05555', icon: 'gi-american-shield' })
      if (a.size)        primary.push({ kind: 'pill', key: 'size', value: a.size })
      if (a.isSecret)    primary.push({ kind: 'bool', key: 'secret', value: 'Secret', icon: 'gi-all-seeing-eye', danger: true })
      break

    case 'quest':
      if (a.status) {
        const qc: Record<string, string> = { active: '#5a8a3a', completed: '#6b9fe8', failed: 'var(--blood)' }
        primary.push({ kind: 'pill', key: 'status', value: a.status, color: qc[a.status], icon: 'gi-holy-grail' })
      }
      if (a.questGiver) secondary.push({ kind: 'text', key: 'giver',  value: a.questGiver, icon: 'gi-person' })
      if (a.reward)     secondary.push({ kind: 'text', key: 'reward', value: a.reward,      icon: 'gi-coins' })
      break

    case 'event':
      if (a.significance) {
        const sc: Record<string, string> = { major: '#e8924a', critical: 'var(--blood)' }
        primary.push({ kind: 'pill', key: 'sig', value: a.significance, color: sc[a.significance], icon: 'gi-lightning-bolt' })
      }
      if (a.date)     secondary.push({ kind: 'text', key: 'date',     value: a.date,     icon: 'gi-sands-of-time' })
      if (a.location) secondary.push({ kind: 'text', key: 'location', value: a.location, icon: 'gi-castle' })
      break

    case 'session':
      if (a.mode) {
        const mc: Record<string, string> = { planning: '#6b9fe8', running: '#5a8a3a' }
        primary.push({ kind: 'pill', key: 'mode', value: a.mode, color: mc[a.mode], icon: 'gi-book-aura' })
      }
      if (a.sessionNumber) primary.push({ kind: 'text', key: 'num', value: '#' + a.sessionNumber, icon: 'gi-dice-six' })
      if (a.date) secondary.push({ kind: 'text', key: 'date', value: a.date, icon: 'gi-sands-of-time' })
      break

    case 'note': {
      const tags = a.tags as string[] | undefined
      if (tags?.length) primary.push({ kind: 'tags', key: 'tags', tags })
      break
    }
  }
  return { primary, secondary }
}

const summaries = computed<Map<number, EntrySummary>>(() => {
  const map = new Map<number, EntrySummary>()
  for (const e of sortedEntities.value) map.set(e.id, entitySummary(e))
  return map
})

function entityIcon(e: any): string {
  if (e.type === 'npc' && (e.attributes as any)?.isAlive === false) return 'gi-candle-skull'
  return (e.attributes as any)?.icon || activeTypeConfig.value?.defaultIcon || 'gi-scroll-unfurled'
}

function isDeceased(e: any): boolean {
  return e.type === 'npc' && (e.attributes as any)?.isAlive === false
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  overflow: visible;
}

/* Ribbon */
.notes-type-ribbon {
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--parch-dark);
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
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

/* Editor on right leaf */
.leaf-inner--editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
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
  padding: 8px 16px 14px;
  border-top: 1px dashed var(--parch-line);
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  display: flex;
  align-items: center;
  gap: 8px;
}
.leaf-footer--right {
  justify-content: flex-end;
}

/* leaf-new inside the new flex footer needs to flex-grow */
.leaf-footer .leaf-new { flex: 1; width: auto; }

.leaf-nav-btn {
  width: 26px; height: 26px;
  border-radius: 2px;
  background: none;
  border: 1px solid var(--parch-line);
  color: var(--ink-ghost);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.leaf-nav-btn:hover:not(:disabled) {
  border-color: var(--ink-faded);
  color: var(--ink);
}
.leaf-nav-btn:disabled {
  opacity: 0.25;
  cursor: default;
}

.leaf-folio-num {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
  letter-spacing: 0.12em;
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

/* ── Entry list ── */
.entry {
  align-items: flex-start;
  border-left: 2px solid transparent;
  transition: border-color 0.15s, background 0.15s, padding-left 0.15s;
}
.entry:hover {
  border-left-color: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 40%, transparent);
  background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 4%, transparent);
}

/* Entry number */
.entry-num {
  font-family: var(--font-mono); font-size: 9px;
  color: var(--ink-ghost); opacity: 0.4;
  width: 18px; flex-shrink: 0;
  text-align: right; padding-top: 2px; line-height: 1;
}

/* Icon badge */
.entry-icon { width: 32px; height: 26px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.entry-badge {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 13%, transparent);
  border: 1px solid color-mix(in srgb, var(--et-color, var(--ink-ghost)) 30%, transparent);
  overflow: hidden; flex-shrink: 0;
}
.entry-thumb { width: 100%; height: 100%; object-fit: cover; object-position: top center; }

/* Two-row entry body */
.entry-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.entry-top { display: flex; align-items: center; gap: 6px; }
.entry-name {
  font-family: var(--font-body); font-size: 13px;
  color: var(--ink); font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.entry-name--deceased { text-decoration: line-through; color: var(--ink-ghost) !important; }
.entry--active { border-left-color: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 60%, transparent) !important; background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 7%, transparent) !important; }

/* Dotted leader */
.entry-leader {
  flex: 1; min-width: 8px;
  border-bottom: 1px dotted var(--ink-ghost);
  opacity: 0.3; align-self: center; position: relative; top: 1px;
}

.entry-attrs { display: flex; flex-wrap: nowrap; align-items: center; gap: 5px; padding-bottom: 3px; overflow: hidden; }

/* Attribute: pill (enum / select values) — with optional icon */
.ea-pill {
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-head);
  font-size: 9px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 7px 2px 5px;
  border: 1px solid currentColor;
  border-radius: 2px;
  color: var(--ink-ghost);
  flex-shrink: 0;
  white-space: nowrap;
}

/* Attribute: text with optional icon + label */
.ea-text {
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--ink-faded);
  flex-shrink: 0;
  white-space: nowrap;
}
.ea-label {
  font-family: var(--font-head);
  font-size: 9px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--ink-ghost);
}

/* Attribute: bool chip (magic, cursed, secret) */
.ea-bool {
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-head);
  font-size: 9px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 2px 7px 2px 5px; border-radius: 2px;
  color: var(--gold);
  background: rgba(184,134,11,0.08);
  border: 1px solid rgba(184,134,11,0.3);
  flex-shrink: 0;
}
.ea-bool--danger { color: var(--blood); background: rgba(139,26,26,0.08); border-color: rgba(139,26,26,0.3); }
.ea-bool--muted  { color: var(--ink-ghost); background: rgba(28,20,16,0.05); border-color: rgba(28,20,16,0.15); }

/* Free tags (notes) */
.ea-tag {
  font-family: var(--font-ui); font-size: 10px;
  color: var(--ink-faded);
  background: rgba(28,20,16,0.04);
  border: 1px solid var(--parch-line);
  border-radius: 2px; padding: 1px 5px;
  flex-shrink: 0;
}

/* Dotted leader between primary and secondary */
.ea-spacer {
  flex: 1;
  min-width: 12px;
  border-bottom: 1px dotted var(--ink-ghost);
  align-self: center;
  opacity: 0.4;
  position: relative; top: 1px;
}

/* Secondary context items (right side) */
.ea-secondary-item {
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-ui); font-size: 11px;
  color: var(--ink-ghost);
  font-style: italic;
  flex-shrink: 0;
  white-space: nowrap;
}
.ea-sep {
  color: var(--gold); font-size: 7px; opacity: 0.6;
  flex-shrink: 0; align-self: center; user-select: none;
}

.entry-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
.entry:hover .entry-actions { opacity: 1; }
.entry-act { width: 18px; height: 18px; border-radius: 2px; background: rgba(28,20,16,0.06); border: 1px solid transparent; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.entry-act--del:hover { background: var(--blood-pale); color: var(--blood); }

</style>