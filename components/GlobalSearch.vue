<template>
  <Teleport to="body">
    <!-- Pill trigger -->
    <button class="gs-pill-trigger" @click="open = true">
      <span class="gs-pill-icon">⌕</span>
      <span>Search</span>
      <span class="gs-pill-shortcut">{{ isMac ? '⌘K' : 'Ctrl+K' }}</span>
    </button>

    <!-- Modal -->
    <Transition name="gs-fade">
      <div v-if="open" class="pv-dialog-mask" @click.self="close">
        <div class="pv-dialog gs-dialog">
          <!-- Search input -->
          <div class="gs-input-row">
            <OhVueIcon name="fa-search" scale="0.85" class="gs-input-icon" />
            <input
              ref="inputRef"
              v-model="query"
              class="gs-input"
              placeholder="Search campaigns, entities, records…"
              autocomplete="off"
              @keydown="onKeydown"
            />
            <kbd class="gs-esc-hint" @click="close">Esc</kbd>
          </div>

          <!-- Results -->
          <div v-if="query.trim()" class="gs-results" ref="resultsRef">
            <template v-if="loading">
              <div class="gs-empty">Searching…</div>
            </template>
            <template v-else-if="totalCount === 0">
              <div class="gs-empty">No results for "{{ query }}"</div>
            </template>
            <template v-else>
              <!-- Campaigns -->
              <div v-if="results.campaigns.length" class="gs-group">
                <div class="gs-group-label">Campaigns</div>
                <div
                  v-for="(item, i) in results.campaigns"
                  :key="`c-${item.id}`"
                  class="gs-result"
                  :class="{ 'gs-result--active': flatIndex(0, i) === cursor }"
                  @click="navigate(item)"
                  @mouseenter="cursor = flatIndex(0, i)"
                >
                  <span class="gs-result-icon" style="color: var(--blood)">
                    <OhVueIcon name="gi-broadsword" scale="0.8" />
                  </span>
                  <span class="gs-result-name">{{ item.name }}</span>
                  <span class="gs-result-sub">Campaign</span>
                  <div class="gs-result-actions" @click.stop>
                    <button class="gs-bm-btn" :class="{ 'gs-bm-btn--active': isBookmarked(getRoute(item)) }" :title="isBookmarked(getRoute(item)) ? 'Remove bookmark' : 'Bookmark'" @click="toggleResultBookmark(item)">
                      <OhVueIcon :name="isBookmarked(getRoute(item)) ? 'md-bookmarkadded' : 'md-bookmarkborder'" scale="0.75" />
                    </button>
                    <button class="gs-popout" title="Open in new window" @click="popout(item)">
                      <OhVueIcon name="md-openinnew" scale="0.75" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Entities -->
              <div v-if="results.entities.length" class="gs-group">
                <div class="gs-group-label">Entities</div>
                <div
                  v-for="(item, i) in results.entities"
                  :key="`e-${item.id}`"
                  class="gs-result gs-entity-result"
                  :class="{ 'gs-result--active': flatIndex(1, i) === cursor }"
                  @mouseenter="cursor = flatIndex(1, i)"
                >
                  <component
                    v-if="item.entity && ENTRY_COMPONENTS[item.type as EntityType]"
                    :is="ENTRY_COMPONENTS[item.type as EntityType]"
                    :entry="item.entity"
                    :deletable="false"
                    @open="navigate(item)"
                  />
                  <template v-else>
                    <span class="gs-result-icon" :style="{ color: entityColor(item.type) }">
                      <OhVueIcon :name="entityIcon(item.type)" scale="0.8" />
                    </span>
                    <span class="gs-result-name">{{ item.name }}</span>
                    <span class="gs-result-sub">{{ entityLabel(item.type) }}</span>
                  </template>
                  <div class="gs-result-actions" @click.stop>
                    <button class="gs-bm-btn" :class="{ 'gs-bm-btn--active': isBookmarked(getRoute(item)) }" :title="isBookmarked(getRoute(item)) ? 'Remove bookmark' : 'Bookmark'" @click="toggleResultBookmark(item)">
                      <OhVueIcon :name="isBookmarked(getRoute(item)) ? 'md-bookmarkadded' : 'md-bookmarkborder'" scale="0.75" />
                    </button>
                    <button class="gs-popout" title="Open in new window" @click="popout(item)">
                      <OhVueIcon name="md-openinnew" scale="0.75" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Records -->
              <div v-if="results.records.length" class="gs-group">
                <div class="gs-group-label">Records</div>
                <div
                  v-for="(item, i) in results.records"
                  :key="`r-${item.id}`"
                  class="gs-result"
                  :class="{ 'gs-result--active': flatIndex(2, i) === cursor }"
                  @click="navigate(item)"
                  @mouseenter="cursor = flatIndex(2, i)"
                >
                  <span class="gs-result-icon" :style="{ color: recordColor(item) }">
                    <OhVueIcon :name="recordIcon(item)" scale="0.8" />
                  </span>
                  <span class="gs-result-name">{{ item.name }}</span>
                  <span class="gs-result-sub">{{ item._subtitle }}</span>
                  <div class="gs-result-actions" @click.stop>
                    <button class="gs-bm-btn" :class="{ 'gs-bm-btn--active': isBookmarked(getRoute(item)) }" :title="isBookmarked(getRoute(item)) ? 'Remove bookmark' : 'Bookmark'" @click="toggleResultBookmark(item)">
                      <OhVueIcon :name="isBookmarked(getRoute(item)) ? 'md-bookmarkadded' : 'md-bookmarkborder'" scale="0.75" />
                    </button>
                    <button class="gs-popout" title="Open in new window" @click="popout(item)">
                      <OhVueIcon name="md-openinnew" scale="0.75" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Encounters -->
              <div v-if="results.encounters.length" class="gs-group">
                <div class="gs-group-label">Encounters</div>
                <div
                  v-for="(item, i) in results.encounters"
                  :key="`enc-${item.id}`"
                  class="gs-result"
                  :class="{ 'gs-result--active': flatIndex(3, i) === cursor }"
                  @click="navigate(item)"
                  @mouseenter="cursor = flatIndex(3, i)"
                >
                  <span class="gs-result-icon" style="color: #4ab8e8">
                    <OhVueIcon name="gi-broadsword" scale="0.8" />
                  </span>
                  <span class="gs-result-name">{{ item.name }}</span>
                  <span class="gs-result-sub">Encounter</span>
                  <div class="gs-result-actions" @click.stop>
                    <button class="gs-bm-btn" :class="{ 'gs-bm-btn--active': isBookmarked(getRoute(item)) }" :title="isBookmarked(getRoute(item)) ? 'Remove bookmark' : 'Bookmark'" @click="toggleResultBookmark(item)">
                      <OhVueIcon :name="isBookmarked(getRoute(item)) ? 'md-bookmarkadded' : 'md-bookmarkborder'" scale="0.75" />
                    </button>
                    <button class="gs-popout" title="Open in new window" @click="popout(item)">
                      <OhVueIcon name="md-openinnew" scale="0.75" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Empty state before typing -->
          <div v-else class="gs-hint">
            Type to search across your entire tome
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { dbApi } from '~/composables/useDb'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import type { EntityType } from '~/types/entities'
import { useNotesStore } from '~/stores/notes'
import type { Entity } from '~/stores/notes'
import { useSystemsStore } from '~/stores/systems'
import { useBookmarks } from '~/composables/useBookmarks'
import NpcEntry      from '~/components/notes/NpcEntry.vue'
import LocationEntry from '~/components/notes/LocationEntry.vue'
import FactionEntry  from '~/components/notes/FactionEntry.vue'
import QuestEntry    from '~/components/notes/QuestEntry.vue'
import EventEntry    from '~/components/notes/EventEntry.vue'
import SessionEntry  from '~/components/notes/SessionEntry.vue'
import NoteEntry     from '~/components/notes/NoteEntry.vue'

const ENTRY_COMPONENTS: Record<EntityType, any> = {
  npc: NpcEntry, location: LocationEntry, faction: FactionEntry,
  quest: QuestEntry, event: EventEntry, session: SessionEntry, note: NoteEntry,
}

const router = useRouter()
const notesStore = useNotesStore()
const systemsStore = useSystemsStore()
const { isBookmarked, bookmarkEntity, bookmarkRecord, bookmarkPage, removeBookmark, bookmarks } = useBookmarks()

const { open } = useGlobalSearch()
const query = ref('')
const loading = ref(false)
const cursor = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const resultsRef = ref<HTMLElement | null>(null)

const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)

interface SearchResult {
  kind: 'campaign' | 'entity' | 'record' | 'encounter'
  id: number
  name: string
  type?: string
  campaignId?: number
  systemId?: number
  entityTypeId?: string
  _subtitle?: string
  entity?: Entity
}

const results = ref<{ campaigns: SearchResult[]; entities: SearchResult[]; records: SearchResult[]; encounters: SearchResult[] }>({
  campaigns: [],
  entities: [],
  records: [],
  encounters: [],
})

const totalCount = computed(() =>
  results.value.campaigns.length + results.value.entities.length + results.value.records.length + results.value.encounters.length
)

// Flat cursor index across all groups
function flatIndex(group: 0 | 1 | 2 | 3, i: number): number {
  const offsets = [
    0,
    results.value.campaigns.length,
    results.value.campaigns.length + results.value.entities.length,
    results.value.campaigns.length + results.value.entities.length + results.value.records.length,
  ]
  return offsets[group] + i
}

const flatResults = computed((): SearchResult[] => [
  ...results.value.campaigns,
  ...results.value.entities,
  ...results.value.records,
  ...results.value.encounters,
])

// Entity type helpers
function entityIcon(type: string): string {
  return ENTITY_TYPE_CONFIG[type as keyof typeof ENTITY_TYPE_CONFIG]?.defaultIcon ?? 'gi-scroll-unfurled'
}
function entityColor(type: string): string {
  return ENTITY_TYPE_CONFIG[type as keyof typeof ENTITY_TYPE_CONFIG]?.color ?? 'var(--ink-ghost)'
}
function entityLabel(type: string): string {
  return ENTITY_TYPE_CONFIG[type as keyof typeof ENTITY_TYPE_CONFIG]?.label ?? type
}

// Record type helpers — look up entity type from loaded systems
function recordIcon(item: SearchResult): string {
  const sys = systemsStore.getSystem(item.systemId!)
  const et = sys?.entityTypes?.find((t: any) => t.id === item.entityTypeId)
  return et?.icon ?? 'gi-scroll-unfurled'
}
function recordColor(item: SearchResult): string {
  const sys = systemsStore.getSystem(item.systemId!)
  const et = sys?.entityTypes?.find((t: any) => t.id === item.entityTypeId)
  return et?.color ?? 'var(--ink-ghost)'
}

// Debounced search
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(query, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!val.trim()) { results.value = { campaigns: [], entities: [], records: [], encounters: [] }; return }
  loading.value = true
  searchTimer = setTimeout(() => runSearch(val.trim()), 150)
})

async function runSearch(q: string) {
  const lq = q.toLowerCase()

  // Campaigns
  const allCampaigns = await dbApi.campaigns.list()
  const campaigns: SearchResult[] = allCampaigns
    .filter((c: any) => c.name.toLowerCase().includes(lq))
    .slice(0, 5)
    .map((c: any) => ({ kind: 'campaign', id: c.id, name: c.name }))

  // Entities — always search the DB so results are available from any route
  const entityDbRows = await dbApi.entities.search(lq, 5)
  const entities: SearchResult[] = entityDbRows.map((r: any) => ({
    kind: 'entity',
    id: r.id,
    name: r.name,
    type: r.type,
    campaignId: r.campaign_id,
    entity: notesStore.entities.find(en => en.id === r.id) ?? {
      id: r.id,
      campaignId: r.campaign_id,
      type: r.type,
      name: r.name,
      content: r.content,
      attributes: JSON.parse(r.attributes ?? '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    },
  }))

  // Records — search across all systems
  const allRecords = await dbApi.records.search(lq, 5)
  const records: SearchResult[] = await Promise.all(
    allRecords.map(async (r) => {
      const sys = systemsStore.getSystem(r.systemId)
      const et = sys?.entityTypes?.find((t: any) => t.id === r.entityTypeId)
      return {
        kind: 'record' as const,
        id: r.id!,
        name: r.name,
        systemId: r.systemId,
        entityTypeId: r.entityTypeId,
        _subtitle: et ? `${sys!.name} · ${et.plural ?? et.label}` : `System ${r.systemId}`,
      }
    })
  )

  // Encounters
  const encounterRows = await dbApi.encounters.search(lq, 5)
  const encounters: SearchResult[] = encounterRows.map((e: any) => ({
    kind: 'encounter' as const,
    id: e.id!,
    name: e.name,
    campaignId: e.campaign_id,
    _subtitle: `Campaign ${e.campaign_id}`,
  }))

  results.value = { campaigns, entities, records, encounters }
  cursor.value = 0
  loading.value = false
}


const TYPE_PLURAL_ROUTE: Record<string, string> = {
  npc: 'npcs', location: 'locations',
  faction: 'factions', quest: 'quests', event: 'events',
  session: 'sessions', note: 'notes',
}

function getRoute(item: SearchResult): string {
  if (item.kind === 'campaign') return `/campaign/${item.id}`
  if (item.kind === 'entity') {
    const segment = TYPE_PLURAL_ROUTE[item.type ?? ''] ?? (item.type + 's')
    return `/campaign/${item.campaignId}/${segment}/${item.id}`
  }
  if (item.kind === 'record') return `/system/${item.systemId}/${item.entityTypeId}?record=${encodeURIComponent(item.name)}`
  if (item.kind === 'encounter') return `/encounter/${item.id}`
  return '/'
}

function navigate(item: SearchResult) {
  router.push(getRoute(item))
  close()
}

function popout(item: SearchResult) {
  const r = getRoute(item)
  const base = location.origin + location.pathname.replace(/\/+$/, '')
  window.open(`${base}/#${r}`, '_blank', 'width=1024,height=768,menubar=no,toolbar=no,location=no')
}

function toggleResultBookmark(item: SearchResult) {
  const r = getRoute(item)
  if (isBookmarked(r)) {
    const bm = bookmarks.value.find(b => b.route === r)
    if (bm) removeBookmark(bm.id)
  } else if (item.kind === 'entity' && item.entity) {
    bookmarkEntity({ id: item.id, name: item.name, type: item.type ?? 'note', campaignId: item.campaignId ?? 0 })
  } else if (item.kind === 'record') {
    bookmarkRecord({ id: item.id, name: item.name, systemId: item.systemId ?? 0, entityTypeId: item.entityTypeId ?? '', icon: recordIcon(item), color: recordColor(item) })
  } else if (item.kind === 'campaign') {
    bookmarkPage(`/campaign/${item.id}`, item.name, 'gi-broadsword', 'var(--blood)')
  } else if (item.kind === 'encounter') {
    bookmarkPage(`/encounter/${item.id}`, item.name, 'gi-broadsword', '#4ab8e8')
  }
}

function onKeydown(e: KeyboardEvent) {
  const total = totalCount.value
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    cursor.value = (cursor.value + 1) % total
    scrollResultIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    cursor.value = (cursor.value - 1 + total) % total
    scrollResultIntoView()
  } else if (e.key === 'Enter') {
    const item = flatResults.value[cursor.value]
    if (item) navigate(item)
  } else if (e.key === 'Escape') {
    close()
  }
}

function scrollResultIntoView() {
  nextTick(() => {
    const active = resultsRef.value?.querySelector('.gs-result--active') as HTMLElement | null
    active?.scrollIntoView({ block: 'nearest' })
  })
}

function close() {
  open.value = false
  query.value = ''
  results.value = { campaigns: [], entities: [], records: [], encounters: [] }
  cursor.value = 0
}

// Focus input when opening
watch(open, (val) => {
  if (val) nextTick(() => inputRef.value?.focus())
})

// Global keyboard shortcut
if (import.meta.client) {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      if (open.value) close()
      else open.value = true
    }
  })
}
</script>

<style scoped>
/* ── Pill trigger (fixed bottom-right, above dice roller) ── */
.gs-pill-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 199;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px 8px 12px;
  border-radius: 99px;
  background: var(--surface-solid);
  border: 1px solid var(--border);
  box-shadow: var(--sh-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  transition: all 0.18s;
  user-select: none;
}
.gs-pill-trigger:hover {
  border-color: var(--border-hi);
  color: var(--text);
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}
.gs-pill-icon { font-size: 15px; line-height: 1; }
.gs-pill-shortcut {
  font-size: 10px;
  color: var(--text3);
  font-family: var(--fm);
  margin-left: 2px;
}

/* Dialog sizing override */
.gs-dialog {
  width: 560px;
  max-width: 94vw;
  padding: 0;
}

/* Input row */
.gs-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--parch-line);
}
.gs-input-icon {
  color: var(--ink-ghost);
  flex-shrink: 0;
}
.gs-input {
  flex: 1;
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--ink);
  background: transparent;
  border: none;
  outline: none;
}
.gs-input::placeholder { color: var(--ink-ghost); }
.gs-esc-hint {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--ink-ghost);
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  padding: 2px 5px;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
}
.gs-esc-hint:hover { color: var(--ink); border-color: var(--ink-ghost); }

/* Results pane */
.gs-results {
  max-height: 380px;
  overflow-y: auto;
  padding: 6px 0 8px;
}

.gs-group {
  margin-bottom: 4px;
}
.gs-group-label {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  padding: 6px 16px 3px;
}

.gs-result {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  position: relative;
}
.gs-result:hover,
.gs-result--active {
  background: rgba(184, 134, 11, 0.08);
}
.gs-result--active {
  border-left: 2px solid var(--gold);
  padding-left: 14px;
}

.gs-result-icon {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.gs-result-name {
  flex: 1;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gs-result--active .gs-result-name { color: var(--ink); font-weight: 600; }
.gs-result-sub {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  flex-shrink: 0;
}

/* Result action buttons (bookmark + popout) */
.gs-result-actions {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: none;
  align-items: center;
  gap: 4px;
}
.gs-result:hover .gs-result-actions { display: flex; }

.gs-bm-btn,
.gs-popout {
  background: none;
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  color: var(--ink-ghost);
  cursor: pointer;
  padding: 3px 5px;
  line-height: 1;
  display: flex;
  align-items: center;
  transition: color 0.15s, border-color 0.15s;
}
.gs-bm-btn:hover,
.gs-popout:hover { color: var(--gold); border-color: var(--gold); }

.gs-bm-btn--active {
  color: var(--gold);
  display: flex !important;
}

/* Keep bookmarked button visible even without hover */
.gs-result .gs-bm-btn--active { display: flex; }
.gs-result:not(:hover) .gs-result-actions:has(.gs-bm-btn--active) { display: flex; }
.gs-result:not(:hover) .gs-result-actions:has(.gs-bm-btn--active) .gs-popout { display: none; }

/* Shift subtitle left on hover to avoid overlap */
.gs-result:hover .gs-result-sub { margin-right: 72px; }

/* Entity results — strip the global .entry padding/border/hover arrow */
.gs-entity-result :deep(.entry) {
  padding: 0;
  border-bottom: none;
}
.gs-entity-result :deep(.entry:hover) { padding-left: 0; }
.gs-entity-result :deep(.entry:hover::before) { display: none; }

/* Hint / empty states */
.gs-hint,
.gs-empty {
  padding: 20px 16px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-ghost);
  font-style: italic;
  text-align: center;
}

/* Transition */
.gs-fade-enter-active,
.gs-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.gs-fade-enter-from,
.gs-fade-leave-to { opacity: 0; transform: scale(0.97); }
</style>
