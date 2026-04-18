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
        <!-- Session-specific: 3-way view toggle -->
        <template v-if="activeType === 'session'">
          <button class="ribbon-tool" :class="{ active: viewMode === 'list' }" @click="setView('list')" title="List view">
            <OhVueIcon name="md-menubook" scale="0.85" />
          </button>
          <button class="ribbon-tool" :class="{ active: viewMode === 'log' }" @click="setView('log')" title="Session log">
            <OhVueIcon name="gi-book-aura" scale="0.85" />
          </button>
          <button class="ribbon-tool" :class="{ active: viewMode === 'graph' }" @click="setView('graph')" title="Graph view">
            <OhVueIcon name="gi-all-seeing-eye" scale="0.85" />
          </button>
        </template>
        <!-- Event-specific: 3-way view toggle -->
        <template v-else-if="activeType === 'event'">
          <button class="ribbon-tool" :class="{ active: viewMode === 'list' }" @click="setView('list')" title="List view">
            <OhVueIcon name="md-menubook" scale="0.85" />
          </button>
          <button class="ribbon-tool" :class="{ active: viewMode === 'timeline' }" @click="setView('timeline')" title="Timeline">
            <OhVueIcon name="md-history" scale="0.85" />
          </button>
          <button class="ribbon-tool" :class="{ active: viewMode === 'graph' }" @click="setView('graph')" title="Graph view">
            <OhVueIcon name="gi-all-seeing-eye" scale="0.85" />
          </button>
        </template>
        <template v-else>
          <button class="ribbon-tool" :class="{ active: viewMode === 'graph' }" @click="toggleGraph" title="Graph view">
            <OhVueIcon name="gi-all-seeing-eye" scale="0.85" />
          </button>
        </template>
        <button class="ribbon-tool" @click="createNew" :title="`New ${activeTypeConfig?.label}`">
          <OhVueIcon name="md-add" scale="0.9" />
        </button>
      </div>
    </div>

    <!-- GRAPH (full width) -->
    <div v-if="viewMode === 'graph'" class="notes-graph-full">
      <NotesGraph :campaign-id="campaignId" @navigate="navigateByTypeAndName" />
    </div>

    <!-- SESSION LOG (full width, sessions only) -->
    <div v-else-if="viewMode === 'log' && activeType === 'session'" class="session-log">
      <div v-if="!logSessions.length" class="slog-empty-state">
        <OhVueIcon name="gi-book-aura" scale="3" style="opacity:0.08;margin-bottom:12px" />
        <em>{{ search ? 'No sessions match your search' : 'No sessions recorded yet' }}</em>
      </div>
      <div v-for="sess in logSessions" :key="sess.id" class="slog-chapter">
        <!-- Header -->
        <div class="slog-header" @click="toggleExpand(sess.id)">
          <span class="slog-num">
            {{ sess.attributes?.sessionNumber ? 'Session ' + sess.attributes.sessionNumber : '—' }}
          </span>
          <span class="slog-bullet">·</span>
          <span class="slog-title">{{ sess.name }}</span>
          <span class="slog-spacer" />
          <span v-if="sess.attributes?.date" class="slog-date">{{ formatSessionDate(sess.attributes.date) }}</span>
          <span v-if="sess.attributes?.mode" class="slog-status"
            :style="{ color: sessionStatusColor(sess.attributes.mode), borderColor: sessionStatusColor(sess.attributes.mode) + '66' }">
            ●&thinsp;{{ sess.attributes.mode }}
          </span>
        </div>
        <div class="slog-rule" />
        <!-- Body — collapsed by default, expanded when in expandedIds -->
        <div class="slog-body" :class="{ 'slog-body--expanded': expandedIds.has(sess.id) }">
          <div v-if="sess.attributes?.scriptContent"
            class="slog-content"
            v-html="renderSessionNotes(sess.attributes.scriptContent)" />
          <div v-else class="slog-no-notes">
            <em>No live notes recorded for this session.</em>
          </div>
          <div v-if="!expandedIds.has(sess.id) && sess.attributes?.scriptContent" class="slog-fade" />
        </div>
        <!-- Footer -->
        <div class="slog-footer">
          <button v-if="sess.attributes?.scriptContent" class="slog-expand-btn"
            @click.stop="toggleExpand(sess.id)">
            {{ expandedIds.has(sess.id) ? '▲ Collapse' : '▼ Expand' }}
          </button>
          <span class="slog-footer-spacer" />
          <button class="slog-readmore-btn" @click.stop="selectEntity(sess.id)">
            Read more →
          </button>
        </div>
      </div>
    </div>

    <!-- TIMELINE (full width, events only) -->
    <div v-else-if="viewMode === 'timeline' && activeType === 'event'"
      class="tl-outer" ref="timelineRef">
      <div v-if="!timelineEvents.length" class="tl-empty">
        <OhVueIcon name="gi-sands-of-time" scale="3" style="opacity:0.08;margin-bottom:12px" />
        <em>{{ search ? 'No events match your search' : 'No events recorded yet' }}</em>
      </div>
      <template v-else>
        <div class="tl-track">
          <div v-for="(ev, i) in timelineEvents" :key="ev.id"
            class="tl-event"
            :class="i % 2 === 0 ? 'tl-event--above' : 'tl-event--below'"
            @click="selectEntity(ev.id)">
            <div class="tl-stem" />
            <div class="tl-node" :style="{ background: sigNodeColor(ev.attributes?.significance) }" />
            <div class="tl-card">
              <div class="tl-card-date">{{ ev.attributes?.date || '— undated —' }}</div>
              <div class="tl-card-name">{{ ev.name }}</div>
              <div v-if="ev.attributes?.location" class="tl-card-loc">{{ ev.attributes.location }}</div>
              <span v-if="ev.attributes?.significance" class="tl-card-sig"
                :style="{ color: sigNodeColor(ev.attributes.significance), borderColor: sigNodeColor(ev.attributes.significance) + '66' }">
                {{ ev.attributes.significance }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="timelineOverflows" class="tl-scroll-hint">← scroll →</div>
      </template>
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

  <!-- Condition Reference Panel -->
  <ConditionPanel
    :condition-name="conditionPanelName"
    :system-id="campaignSystemId"
    :value="conditionPanelValue"
    :open="conditionPanelOpen"
    @close="conditionPanelOpen = false"
  />
</template>


<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { useNotesStore } from '~/stores/notes'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import type { EntityType } from '~/types/entities'
import { getDb } from '~/composables/useDb'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const campaignId = Number(route.params.id)

const search = ref('')
const sortBy = ref('updated')

// URL-driven state — declared first so downstream computeds can reference them safely
const activeType = computed(() => (route.query.type as EntityType) || 'session')
const selectedId = computed(() => route.query.id ? Number(route.query.id) : null)
const activeTypeConfig = computed(() => ENTITY_TYPE_CONFIG[activeType.value])

const typeTabs = Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => ({ type: type as EntityType, ...cfg }))

const viewMode = computed<'list' | 'log' | 'graph' | 'timeline'>(() => {
  const v = route.query.view as string | undefined
  if (v === 'graph') return 'graph'
  if (v === 'log' && activeType.value === 'session') return 'log'
  if (v === 'timeline' && activeType.value === 'event') return 'timeline'
  return 'list'
})
const showGraph = computed(() => viewMode.value === 'graph')

// Session log state — expanded ids (default: all collapsed)
const expandedIds = ref<Set<number>>(new Set())
function toggleExpand(id: number) {
  const s = new Set(expandedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expandedIds.value = s
}

const mdParser = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true })
function renderSessionNotes(content: string): string {
  return mdParser.render(content || '')
}

const logSessions = computed((): Array<{ id: number; name: string; attributes: any }> => {
  const list = (store.byType['session'] ?? [])
    .filter(e => !search.value || e.name.toLowerCase().includes(search.value.toLowerCase()))
  return [...list].sort((a, b) => {
    const na = parseInt((a.attributes as any)?.sessionNumber ?? '', 10)
    const nb = parseInt((b.attributes as any)?.sessionNumber ?? '', 10)
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb
    return a.id - b.id
  })
})

function sessionStatusColor(mode: string | undefined): string {
  return { planning: '#6b9fe8', running: '#5a8a3a', finished: '#b87de8' }[mode ?? ''] ?? 'var(--ink-ghost)'
}

function formatSessionDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-US', opts)
}

// ── Timeline (events) ─────────────────────────────────────────────
const timelineRef = ref<HTMLElement | null>(null)
const timelineOverflows = ref(false)

const timelineEvents = computed((): Array<{ id: number; name: string; attributes: any }> => {
  const list = (store.byType['event'] ?? [])
    .filter(e => !search.value || e.name.toLowerCase().includes(search.value.toLowerCase()))
  return [...list].sort((a, b) => {
    const da: string = (a.attributes as any)?.date ?? ''
    const db: string = (b.attributes as any)?.date ?? ''
    if (!da && !db) return a.id - b.id
    if (!da) return 1
    if (!db) return -1
    return da.localeCompare(db)
  })
})

function sigNodeColor(sig: string | undefined): string {
  return ({ critical: 'var(--blood)', major: 'var(--gold)', minor: 'var(--ink-ghost)' } as any)[sig ?? ''] ?? 'var(--ink-ghost)'
}

watch([viewMode, () => timelineEvents.value.length], () => {
  nextTick(() => {
    if (!timelineRef.value) return
    timelineOverflows.value = timelineRef.value.scrollWidth > timelineRef.value.clientWidth + 2
  })
})

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

// ── Condition reference panel ──────────────────────────────────────────────
const conditionPanelOpen = ref(false)
const conditionPanelName = ref('')
const conditionPanelValue = ref<number | null>(null)
const campaignSystemId = ref<number | null>(null)

function openConditionPanel(name: string, value: number | null = null) {
  conditionPanelName.value = name
  conditionPanelValue.value = value
  conditionPanelOpen.value = true
}

onMounted(async () => {
  await store.loadAll(campaignId)
  const camp = await getDb().campaigns.get(campaignId)
  campaignSystemId.value = camp?.system_id ?? null
})

// Navigation — all push to router so back button works
function selectType(type: EntityType) {
  router.push({ query: { type } })
}

function selectEntity(id: number) {
  router.push({ query: { type: activeType.value, id: String(id) } })
}

function setView(mode: 'list' | 'log' | 'graph' | 'timeline') {
  if (mode === 'list') router.push({ query: { type: activeType.value } })
  else router.push({ query: { type: activeType.value, view: mode } })
}

function toggleGraph() {
  setView(viewMode.value === 'graph' ? 'list' : 'graph')
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

/* ─── Session Log view ──────────────────────────────────────────── */
.session-log {
  flex: 1;
  overflow-y: auto;
  padding: 24px 40px 40px;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
}

.slog-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: var(--ink-ghost);
  font-family: var(--font-body);
  font-size: 14px;
  font-style: italic;
}

/* Chapter block */
.slog-chapter {
  max-width: 720px;
  margin: 0 auto 12px;
  border-top: 1.5px dashed rgba(184, 134, 11, 0.35);
  padding-top: 20px;
}
.slog-chapter:first-of-type {
  border-top: none;
  padding-top: 0;
}

/* Header row */
.slog-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding-bottom: 10px;
}

.slog-num {
  font-family: 'Cinzel Decorative', var(--font-deco);
  font-size: 11px;
  font-weight: 700;
  color: rgba(139, 26, 26, 0.55);
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.slog-bullet {
  color: rgba(139, 26, 26, 0.3);
  font-size: 12px;
  flex-shrink: 0;
}

.slog-title {
  font-family: 'Cinzel', var(--font-deco);
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.slog-spacer { flex: 1; min-width: 12px; }

.slog-date {
  font-family: var(--font-head);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  flex-shrink: 0;
}

.slog-status {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid;
  flex-shrink: 0;
}

/* Rule below header */
.slog-rule {
  height: 1px;
  background: var(--parch-line);
  margin-bottom: 14px;
}

/* Body — collapsed by default; --expanded removes the cap */
.slog-body {
  position: relative;
  max-height: 120px;
  overflow: hidden;
  transition: max-height 0.35s ease;
}
.slog-body--expanded {
  max-height: 4000px;
}

.slog-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(transparent, var(--parch));
  pointer-events: none;
}

/* Prose content */
.slog-content {
  font-family: var(--font-body);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink-faded);
}
/* Basic markdown-it output styles scoped to log */
.slog-content :deep(p) { margin: 0 0 0.6em; }
.slog-content :deep(h1),
.slog-content :deep(h2),
.slog-content :deep(h3) {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  margin: 0.9em 0 0.35em;
}
.slog-content :deep(ul),
.slog-content :deep(ol) { padding-left: 1.4em; margin: 0 0 0.6em; }
.slog-content :deep(li) { margin-bottom: 0.2em; }
.slog-content :deep(strong) { color: var(--ink); font-weight: 600; }
.slog-content :deep(em) { color: var(--ink-faded); }
.slog-content :deep(blockquote) {
  border-left: 2px solid rgba(184,134,11,0.4);
  padding-left: 12px;
  color: var(--ink-ghost);
  font-style: italic;
  margin: 0.5em 0;
}
.slog-content :deep(hr) { border: none; border-top: 1px dashed var(--parch-line); margin: 0.8em 0; }
.slog-content :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: rgba(28,20,16,0.06);
  padding: 1px 4px;
  border-radius: 2px;
}

.slog-no-notes {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-ghost);
  font-style: italic;
  padding: 4px 0;
}

/* Footer */
.slog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-bottom: 4px;
}
.slog-footer-spacer { flex: 1; }

.slog-expand-btn {
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.slog-expand-btn:hover { color: var(--gold); }

.slog-readmore-btn {
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(139, 26, 26, 0.6);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.slog-readmore-btn:hover { color: var(--blood); }

/* ─── Timeline view ─────────────────────────────────────────────── */
.tl-outer {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  position: relative;
  display: flex;
  flex-direction: column;
}

.tl-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ink-ghost);
  font-family: var(--font-body);
  font-size: 14px;
  font-style: italic;
}

/* ── Track ── */
.tl-track {
  position: relative;
  display: flex;
  align-items: stretch;
  height: 360px;
  min-width: max-content;
  padding: 0 80px;
  flex-shrink: 0;
}

/* Spine line */
.tl-track::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--ink-faded);
  opacity: 0.45;
  pointer-events: none;
}

/* ── Individual event column ── */
.tl-event {
  position: relative;
  width: 180px;
  flex-shrink: 0;
  cursor: pointer;
}

/* Node (dot on spine) */
.tl-node {
  position: absolute;
  left: calc(50% - 5px);
  top:  calc(50% - 5px);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid var(--parch);
  z-index: 1;
  transition: transform 0.15s;
}
.tl-event:hover .tl-node { transform: scale(1.5); }

/* Stem (dashed vertical connector) */
.tl-stem {
  position: absolute;
  left: calc(50% - 0.5px);
  width: 0;
  border-left: 1px dashed var(--parch-line);
  opacity: 0.8;
}
.tl-event--above .tl-stem {
  bottom: calc(50% + 5px);
  height: 28px;
}
.tl-event--below .tl-stem {
  top: calc(50% + 5px);
  height: 28px;
}

/* Card */
.tl-card {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 152px;
  padding: 8px 10px 7px;
  background: color-mix(in srgb, var(--parch-dark) 85%, transparent);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tl-event:hover .tl-card {
  border-color: var(--ink-ghost);
  box-shadow: 0 2px 12px rgba(28, 20, 16, 0.12);
}

/* Card sits above spine for even-index, below for odd */
.tl-event--above .tl-card {
  bottom: calc(50% + 34px);   /* node-half(5) + stem(28) + gap(1) */
}
.tl-event--below .tl-card {
  top: calc(50% + 34px);
}

.tl-card-date {
  font-family: 'Cinzel', var(--font-deco);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tl-card-name {
  font-family: 'IM Fell English', var(--font-body);
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
}

.tl-card-loc {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--ink-ghost);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tl-card-sig {
  display: inline-block;
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 999px;
  padding: 1px 6px;
  margin-top: 2px;
  align-self: flex-start;
}

/* Scroll hint */
.tl-scroll-hint {
  text-align: center;
  font-family: var(--font-body);
  font-size: 11px;
  font-style: italic;
  color: var(--ink-ghost);
  opacity: 0.5;
  padding: 4px 0 10px;
  flex-shrink: 0;
  user-select: none;
}

</style>