<template>
  <Teleport to="body">
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
                <button
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
                </button>
              </div>

              <!-- Entities -->
              <div v-if="results.entities.length" class="gs-group">
                <div class="gs-group-label">Entities</div>
                <button
                  v-for="(item, i) in results.entities"
                  :key="`e-${item.id}`"
                  class="gs-result"
                  :class="{ 'gs-result--active': flatIndex(1, i) === cursor }"
                  @click="navigate(item)"
                  @mouseenter="cursor = flatIndex(1, i)"
                >
                  <span class="gs-result-icon" :style="{ color: entityColor(item.type) }">
                    <OhVueIcon :name="entityIcon(item.type)" scale="0.8" />
                  </span>
                  <span class="gs-result-name">{{ item.name }}</span>
                  <span class="gs-result-sub">{{ entityLabel(item.type) }}</span>
                </button>
              </div>

              <!-- Records -->
              <div v-if="results.records.length" class="gs-group">
                <div class="gs-group-label">Records</div>
                <button
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
                </button>
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
import { useNotesStore } from '~/stores/notes'
import { useSystemsStore } from '~/stores/systems'

const router = useRouter()
const route = useRoute()
const notesStore = useNotesStore()
const systemsStore = useSystemsStore()

const { open } = useGlobalSearch()
const query = ref('')
const loading = ref(false)
const cursor = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const resultsRef = ref<HTMLElement | null>(null)

const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)

interface SearchResult {
  kind: 'campaign' | 'entity' | 'record'
  id: number
  name: string
  type?: string
  campaignId?: number
  systemId?: number
  entityTypeId?: string
  _subtitle?: string
}

const results = ref<{ campaigns: SearchResult[]; entities: SearchResult[]; records: SearchResult[] }>({
  campaigns: [],
  entities: [],
  records: [],
})

const totalCount = computed(() =>
  results.value.campaigns.length + results.value.entities.length + results.value.records.length
)

// Flat cursor index across all groups
function flatIndex(group: 0 | 1 | 2, i: number): number {
  const offsets = [
    0,
    results.value.campaigns.length,
    results.value.campaigns.length + results.value.entities.length,
  ]
  return offsets[group] + i
}

const flatResults = computed((): SearchResult[] => [
  ...results.value.campaigns,
  ...results.value.entities,
  ...results.value.records,
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
  if (!val.trim()) { results.value = { campaigns: [], entities: [], records: [] }; return }
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

  // Entities — use loaded store if available, else fall back to DB (normalized to camelCase)
  let entityRows: Array<{ id: number; name: string; type: string; campaignId: number }> = []
  const activeCampaignId = extractCampaignId()
  if (activeCampaignId && notesStore.entities.length) {
    entityRows = notesStore.entities.map(e => ({ id: e.id, name: e.name, type: e.type, campaignId: e.campaignId }))
  } else if (activeCampaignId) {
    const rows = await dbApi.entities.list(activeCampaignId)
    entityRows = rows.map((r: any) => ({ id: r.id, name: r.name, type: r.type, campaignId: r.campaign_id }))
  }
  const entities: SearchResult[] = entityRows
    .filter(e => e.name.toLowerCase().includes(lq) || e.type.toLowerCase().includes(lq))
    .slice(0, 5)
    .map(e => ({
      kind: 'entity',
      id: e.id,
      name: e.name,
      type: e.type,
      campaignId: e.campaignId,
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

  results.value = { campaigns, entities, records }
  cursor.value = 0
  loading.value = false
}

function extractCampaignId(): number | null {
  const match = route.path.match(/\/campaign\/(\d+)/)
  if (match) return Number(match[1])
  return null
}

function navigate(item: SearchResult) {
  if (item.kind === 'campaign') {
    router.push(`/campaign/${item.id}`)
  } else if (item.kind === 'entity') {
    const TYPE_PLURAL_ROUTE: Record<string, string> = {
      npc: 'npcs', location: 'locations', item: 'items',
      faction: 'factions', quest: 'quests', event: 'events',
      session: 'sessions', note: 'notes',
    }
    const segment = TYPE_PLURAL_ROUTE[item.type ?? ''] ?? (item.type + 's')
    router.push(`/campaign/${item.campaignId}/${segment}/${item.id}`)
  } else if (item.kind === 'record') {
    router.push(`/system/${item.systemId}/${item.entityTypeId}?record=${encodeURIComponent(item.name)}`)
  }
  close()
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
  results.value = { campaigns: [], entities: [], records: [] }
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
