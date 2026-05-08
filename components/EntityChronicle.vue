<template>
  <div class="chronicle screen-in">

    <!-- ── Left panel: entity list ── -->
    <div class="elist">

      <div class="elist-head">
        <div class="elist-head-title" :style="{ color: typeConfig?.color }">
          {{ typeConfig?.plural }}
        </div>
        <div v-if="hasViewToggle" class="elist-vtabs">
          <button class="elist-vbtn" :class="{ active: !route.path.endsWith('/log') && !route.path.endsWith('/timeline') }" @click="setView('list')">List</button>
          <button v-if="type === 'event'" class="elist-vbtn" :class="{ active: route.path.endsWith('/timeline') }" @click="setView('timeline')">Timeline</button>
          <button v-if="type === 'session'" class="elist-vbtn" :class="{ active: route.path.endsWith('/log') }" @click="setView('log')">Log</button>
          <button v-if="type === 'location'" class="elist-vbtn" :class="{ active: viewMode === 'map' }" @click="setView('map')">Map</button>
        </div>
        <button class="btn-accent-sm" @click="createEntry">+ New</button>
      </div>

      <div class="elist-search">
        <span class="elist-search-icon">⌕</span>
        <input
          v-model="search"
          class="elist-search-input"
          :placeholder="`Search ${typeConfig?.plural?.toLowerCase() ?? ''}…`"
        />
      </div>

      <div class="elist-body">
        <div v-if="!filteredEntries.length" class="elist-empty">
          <div :style="{ color: typeConfig?.color, fontSize: '28px', opacity: 0.15 }">
            {{ typeConfig?.plural?.charAt(0) }}
          </div>
          <span>{{ search ? 'No results' : `No ${typeConfig?.plural?.toLowerCase()} yet` }}</span>
          <button class="btn-accent-sm" style="margin-top: 8px" @click="createEntry">Create one</button>
        </div>

        <div
          v-for="e in filteredEntries"
          :key="e.id"
          class="erow"
          :class="{ active: activeForList === e.id }"
          @click="viewMode === 'map' && type === 'location' ? selectMapLocation(e) : openEntry(e)"
        >
          <!-- NPC -->
          <div v-if="type === 'npc'" class="erow-avatar"
            :style="attrImg(e, 'portraitSource') ? {} : { background: avatarGradient(e.name) }">
            <img v-if="attrImg(e, 'portraitSource')" :src="attrImg(e, 'portraitSource')!" class="erow-avatar-img" />
            <template v-else>{{ initials(e.name) }}</template>
          </div>

          <!-- Location -->
          <div v-else-if="type === 'location'" class="erow-avatar erow-avatar--sq"
            :style="attrImg(e, 'logoSource') ? {} : { background: avatarGradient(e.name) }">
            <img v-if="attrImg(e, 'logoSource')" :src="attrImg(e, 'logoSource')!" class="erow-avatar-img" />
            <template v-else>{{ initials(e.name) }}</template>
          </div>

          <!-- Faction -->
          <div v-else-if="type === 'faction'" class="erow-avatar erow-avatar--icon"
            :style="attrImg(e, 'imageSource') ? {} : { background: (typeConfig?.color ?? '#888') + '18', borderColor: (typeConfig?.color ?? '#888') + '40' }">
            <img v-if="attrImg(e, 'imageSource')" :src="attrImg(e, 'imageSource')!" class="erow-avatar-img" />
            <OhVueIcon v-else name="gi-american-shield" scale="0.7" :style="{ color: typeConfig?.color }" />
          </div>

          <!-- Session: selected icon if set, otherwise session number badge -->
          <div v-else-if="type === 'session'">
            <div v-if="(e.attributes as any)?.icon" class="erow-icon-badge" :style="{ color: typeConfig?.color }">
              <OhVueIcon :name="(e.attributes as any).icon" scale="0.75" />
            </div>
            <div v-else class="erow-num-badge"
              :style="{ background: (typeConfig?.color ?? '#888') + '18', borderColor: (typeConfig?.color ?? '#888') + '40', color: typeConfig?.color }">
              {{ (e.attributes as any)?.sessionNumber || '#' }}
            </div>
          </div>

          <!-- Quest icon -->
          <div v-else-if="type === 'quest'" class="erow-icon-badge" :style="{ color: questColor(e) }">
            <OhVueIcon name="gi-holy-grail" scale="0.75" />
          </div>

          <!-- Event icon -->
          <div v-else-if="type === 'event'" class="erow-icon-badge" :style="{ color: eventColor(e) }">
            <OhVueIcon name="gi-sands-of-time" scale="0.75" />
          </div>

          <!-- Note icon -->
          <div v-else-if="type === 'note'" class="erow-icon-badge" :style="{ color: typeConfig?.color }">
            <OhVueIcon :name="(e.attributes as any)?.icon || 'gi-scroll-unfurled'" scale="0.75" />
          </div>

          <!-- Fallback dot -->
          <div v-else class="erow-dot" :style="{ background: activeEntryId === e.id ? typeConfig?.color : 'var(--border-hi)' }" />

          <!-- Name + sub -->
          <div class="erow-body">
            <div class="erow-name">{{ e.name }}</div>
            <div v-if="rowSub(e)" class="erow-sub">{{ rowSub(e) }}</div>
          </div>

          <span v-if="rowTag(e)" class="erow-pill" :style="pillStyle(rowTag(e)!)">{{ rowTag(e) }}</span>
          <span v-if="rowDate(e)" class="erow-date">{{ rowDate(e) }}</span>
        </div>
      </div>
    </div>

    <!-- ── Right panel: special view or child route ── -->
    <div class="edetail">

      <!-- Event timeline (vertical) — only shown if no dedicated timeline route child is active -->
      <div v-if="false" class="sv-timeline">
        <div v-if="!timelineEvents.length" class="sv-empty">
          <OhVueIcon name="gi-sands-of-time" scale="2.5" style="opacity:0.1" />
          <span>No events yet.</span>
        </div>
        <div v-else class="tl-outer">
          <div class="tl-track">
            <div
              v-for="ev in timelineEvents"
              :key="ev.id"
              class="tl-event"
              @click="openEntry(ev)"
            >
              <div class="tl-spine">
                <div class="tl-node" :style="{ background: sigNodeColor((ev.attributes as any)?.significance), boxShadow: `0 0 0 3px ${sigNodeColor((ev.attributes as any)?.significance)}22` }" />
                <div class="tl-line" />
              </div>
              <div class="tl-card">
                <div class="tl-card-top">
                  <span class="tl-card-name">{{ ev.name }}</span>
                  <span
                    v-if="(ev.attributes as any)?.significance"
                    class="tl-card-sig"
                    :style="{ color: sigNodeColor((ev.attributes as any)?.significance), borderColor: sigNodeColor((ev.attributes as any)?.significance) + '55' }"
                  >{{ (ev.attributes as any).significance }}</span>
                </div>
                <div class="tl-card-meta">
                  <span class="tl-card-date">{{ (ev.attributes as any)?.date || '— undated —' }}</span>
                  <template v-if="(ev.attributes as any)?.location">
                    <span class="tl-sep">·</span>
                    <span class="tl-card-loc">{{ (ev.attributes as any).location }}</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Session log — only shown if no dedicated log route child is active -->
      <div v-else-if="false" class="sv-log">
        <div v-if="!logSessions.length" class="sv-empty">
          <OhVueIcon name="gi-book-aura" scale="2.5" style="opacity:0.1" />
          <span>No sessions recorded yet.</span>
        </div>
        <div v-for="sess in logSessions" :key="sess.id" class="slog-chapter">
          <div class="slog-header" @click="toggleExpand(sess.id)">
            <span class="slog-num">{{ (sess.attributes as any)?.sessionNumber ? 'Session ' + (sess.attributes as any).sessionNumber : '—' }}</span>
            <span class="slog-title">{{ sess.name }}</span>
            <span class="slog-spacer" />
            <span v-if="(sess.attributes as any)?.date" class="slog-date">{{ formatSessionDate((sess.attributes as any).date) }}</span>
            <span
              v-if="(sess.attributes as any)?.mode"
              class="slog-status"
              :style="{ color: sessionStatusColor((sess.attributes as any)?.mode), borderColor: sessionStatusColor((sess.attributes as any)?.mode) + '55' }"
            >{{ (sess.attributes as any).mode }}</span>
            <button class="slog-open" @click.stop="openEntry(sess)">Open →</button>
          </div>
          <div class="slog-body" :class="{ 'slog-body--expanded': expandedIds.has(sess.id) }">
            <div
              v-if="(sess.attributes as any)?.scriptContent"
              class="slog-content"
              v-html="renderSessionNotes((sess.attributes as any).scriptContent)"
            />
            <div v-else class="slog-no-notes">No script recorded for this session.</div>
            <div v-if="!expandedIds.has(sess.id) && (sess.attributes as any)?.scriptContent" class="slog-fade" />
          </div>
          <button
            v-if="(sess.attributes as any)?.scriptContent"
            class="slog-expand-btn"
            @click="toggleExpand(sess.id)"
          >{{ expandedIds.has(sess.id) ? '▲ Collapse' : '▼ Read more' }}</button>
        </div>
      </div>

      <!-- World map (locations) — not shown when navigated to a specific location entry -->
      <div v-else-if="type === 'location' && viewMode === 'map' && !activeEntryId" class="sv-map">
        <WorldMap
          v-if="mapRootId"
          :campaign-id="campaignId"
          :root-location-id="mapRootId"
          :location-stack="mapStack"
          @navigate-entity="onMapNavigateEntity"
          @drill-down="onMapDrillDown"
          @navigate-crumb="onMapNavigateCrumb"
        />
        <div v-else class="sv-empty">
          <OhVueIcon name="gi-treasure-map" scale="2.5" style="opacity:0.1" />
          <span>Select a location on the left to view its map</span>
        </div>
      </div>

      <!-- Default: child route -->
      <NuxtPage v-else />
    </div>

  </div>
</template>

<script setup lang="ts">
import { useCampaignEntity } from '~/composables/useCampaignEntity'
import { useEntityMarkdown } from '~/composables/useEntityMarkdown'
import { useNotesStore } from '~/stores/notes'
import type { EntityType } from '~/types/entities'
import type { Entity } from '~/stores/notes'

const props = defineProps<{ type: EntityType }>()

const route = useRoute()
const router = useRouter()
const {
  typeConfig, entries, openEntry, createEntry, ensureLoaded, formatDateShort,
} = useCampaignEntity(props.type)

const campaignId = computed(() => Number(route.params.id))

const search = ref('')

const filteredEntries = computed(() => {
  if (!search.value) return entries.value
  const q = search.value.toLowerCase()
  return entries.value.filter(e => e.name.toLowerCase().includes(q))
})

const activeEntryId = computed(() =>
  route.params.entryId ? Number(route.params.entryId) : null
)

// ── View mode ─────────────────────────────────────────────────────────────────
const hasViewToggle = props.type === 'event' || props.type === 'session' || props.type === 'location'
const localKey = `dmstome.${props.type}.view`
const viewMode = ref(
  hasViewToggle && import.meta.client ? (localStorage.getItem(localKey) || 'list') : 'list'
)
function setView(m: string) {
  if (m === 'log' && props.type === 'session') {
    router.push(`/campaign/${campaignId.value}/sessions/log`)
    return
  }
  if (m === 'timeline' && props.type === 'event') {
    router.push(`/campaign/${campaignId.value}/events/timeline`)
    return
  }
  if (m === 'list' && props.type === 'session' && route.path.endsWith('/log')) {
    router.push(`/campaign/${campaignId.value}/sessions`)
    return
  }
  if (m === 'list' && props.type === 'event' && route.path.endsWith('/timeline')) {
    router.push(`/campaign/${campaignId.value}/events`)
    return
  }
  viewMode.value = m
  if (import.meta.client) localStorage.setItem(localKey, m)
  if (props.type !== 'location') return
  if (m === 'map' && activeEntryId.value) {
    router.push({ path: `/campaign/${campaignId.value}/locations`, query: { map: String(activeEntryId.value) } })
  } else if (m === 'list' && mapRootId.value) {
    router.push(`/campaign/${campaignId.value}/locations/${mapRootId.value}`)
  }
}

// ── Timeline (events) ─────────────────────────────────────────────────────────
const timelineEvents = computed(() => {
  if (props.type !== 'event') return []
  return [...entries.value].sort((a, b) => {
    const da = (a.attributes as any)?.date ?? ''
    const db = (b.attributes as any)?.date ?? ''
    if (!da && !db) return a.id - b.id
    if (!da) return 1; if (!db) return -1
    return da.localeCompare(db)
  })
})

function sigNodeColor(sig: string | undefined): string {
  return ({ critical: 'var(--danger)', major: '#ebbd34', minor: 'var(--text3)' } as any)[sig ?? ''] ?? 'var(--text3)'
}

// ── Session log ───────────────────────────────────────────────────────────────
const expandedIds = ref<Set<number>>(new Set())
const { renderMarkdown } = useEntityMarkdown()
const notesStore = useNotesStore()
const SESSION_TYPE_COLORS: Record<string, string> = {
  npc: '#7cc44e', location: '#a87de8', faction: '#e05555',
  quest: '#e8924a', event: '#4ab8e8', note: '#6b9fe8', session: '#b87de8',
}
function sessionEntityLookup(type: string, name: string) {
  const ent = notesStore.findByTypeAndName(type, name)
  if (!ent) return null
  return { color: SESSION_TYPE_COLORS[ent.type] ?? '#888' }
}

const logSessions = computed(() => {
  if (props.type !== 'session') return []
  return [...entries.value].sort((a, b) => {
    const na = parseInt((a.attributes as any)?.sessionNumber ?? '', 10)
    const nb = parseInt((b.attributes as any)?.sessionNumber ?? '', 10)
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb
    return a.id - b.id
  })
})

function toggleExpand(id: number) {
  const s = new Set(expandedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedIds.value = s
}

function renderSessionNotes(content: string): string {
  return renderMarkdown(content || '', { rich: true, entityLookup: sessionEntityLookup })
}

function sessionStatusColor(mode: string | undefined): string {
  return ({ planning: '#6b9fe8', running: 'var(--success)', finished: '#b87de8' } as any)[mode ?? ''] ?? 'var(--text3)'
}

function formatSessionDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-US', opts)
}

// ── World map (locations) — fully URL-driven ──────────────────────────────────
// Map state lives in query params so reload always works:
//   ?map=5        → root location being viewed
//   ?stack=3,1    → drill-down breadcrumb stack
const mapRootId = computed(() =>
  props.type === 'location' && route.query.map ? Number(route.query.map) : null
)
const mapStack = computed<number[]>(() => {
  const s = route.query.stack as string | undefined
  if (!s) return []
  return s.split(',').map(Number).filter(Boolean)
})

// In map mode the left list highlights the map root; in list mode it's the detail route param
const activeForList = computed(() =>
  viewMode.value === 'map' && props.type === 'location'
    ? mapRootId.value
    : activeEntryId.value
)

const TYPE_PLURAL_ROUTE: Record<string, string> = {
  npc: 'npcs', location: 'locations',
  faction: 'factions', quest: 'quests', event: 'events',
  session: 'sessions', note: 'notes',
}

function selectMapLocation(e: Entity) {
  router.push({
    path: `/campaign/${campaignId.value}/locations`,
    query: { map: String(e.id) },
  })
}

function onMapDrillDown(fromId: number, toId: number) {
  const newStack = [...mapStack.value, fromId]
  router.push({
    path: `/campaign/${campaignId.value}/locations`,
    query: { map: String(toId), ...(newStack.length ? { stack: newStack.join(',') } : {}) },
  })
}

function onMapNavigateCrumb(index: number) {
  const targetId = mapStack.value[index]
  const newStack = mapStack.value.slice(0, index)
  router.push({
    path: `/campaign/${campaignId.value}/locations`,
    query: { map: String(targetId), ...(newStack.length ? { stack: newStack.join(',') } : {}) },
  })
}

function onMapNavigateEntity(entity: any) {
  const segment = TYPE_PLURAL_ROUTE[entity.type] ?? (entity.type + 's')
  router.push(`/campaign/${campaignId.value}/${segment}/${entity.id}`)
}

// ── Avatar helpers ─────────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ['#6f6fc8', '#9b68c8'], ['#c86f6f', '#c89b68'], ['#6fc8a8', '#68c89b'],
  ['#c8a86f', '#c8c868'], ['#6fa8c8', '#6890c8'], ['#c86fa8', '#c868c8'],
]
function avatarGradient(name: string): string {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_GRADIENTS.length
  const [a, b] = AVATAR_GRADIENTS[idx]
  return `linear-gradient(135deg, ${a}, ${b})`
}
function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function attrImg(e: Entity, key: string): string | null {
  const v = (e.attributes as any)?.[key]
  return v && typeof v === 'string' && v.length > 0 ? v : null
}

// ── Row helpers ───────────────────────────────────────────────────────────────
function rowSub(e: Entity): string | null {
  const a = e.attributes as any
  if (props.type === 'npc') return [a?.title, a?.race].filter(Boolean).join(' · ') || null
  if (props.type === 'location') return a?.locationType || null
if (props.type === 'faction') return [a?.factionType, a?.size].filter(Boolean).join(' · ') || null
  if (props.type === 'quest') return a?.questGiver ? `from ${a.questGiver}` : null
  if (props.type === 'event') return [a?.location, a?.significance].filter(Boolean).join(' · ') || null
  if (props.type === 'note') { const tags = a?.tags as string[] | undefined; return tags?.length ? tags.slice(0, 2).join(', ') : null }
  return null
}

function rowDate(e: Entity): string | null {
  const a = e.attributes as any
  if (props.type === 'session' && a?.date) return formatDateShort(a.date)
  if (props.type === 'event' && a?.date) return formatDateShort(a.date)
  return null
}

function rowTag(e: Entity): string | null {
  const a = e.attributes as any
  if (props.type === 'npc') return a?.status || null
  if (props.type === 'session') return a?.mode || null
  if (props.type === 'quest') return a?.status || null
  if (props.type === 'location') return a?.status || null
return null
}

const TAG_COLORS: Record<string, string> = {
  active: 'var(--success)', planning: '#6b9fe8', running: 'var(--success)',
  finished: '#b87de8', completed: 'var(--success)', failed: 'var(--danger)',
  dormant: 'var(--text3)', discovered: 'var(--success)', undiscovered: 'var(--text3)',
  destroyed: 'var(--danger)', rare: '#b87de8', unique: '#e8924a',
  uncommon: '#7cc44e', common: 'var(--text3)',
}
function pillStyle(tag: string) {
  const c = TAG_COLORS[tag] ?? 'var(--text3)'
  return { color: c, borderColor: c + '44', background: c + '11' }
}
function questColor(e: Entity): string { return TAG_COLORS[(e.attributes as any)?.status] ?? 'var(--text3)' }
function eventColor(e: Entity): string {
  const sig = (e.attributes as any)?.significance
  if (sig === 'critical') return 'var(--danger)'
  if (sig === 'major') return '#ebbd34'
  return 'var(--text3)'
}

onMounted(() => ensureLoaded())
</script>

<style scoped>
/* ── View toggle in list head ────────────────────────────────────────────── */
.elist-vtabs {
  display: flex;
  border: 1px solid var(--border);
  border-radius: var(--r1);
  overflow: hidden;
  background: var(--bg);
}
.elist-vbtn {
  padding: 2px 9px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text3);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.12s;
}
.elist-vbtn + .elist-vbtn { border-left: 1px solid var(--border); }
.elist-vbtn:hover { color: var(--text2); background: var(--surface-hi); }
.elist-vbtn.active { background: var(--accent-bg); color: var(--accent-l); }

/* ── Special view container ──────────────────────────────────────────────── */
.sv-timeline {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.sv-log {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 40px;
}

.sv-map {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.sv-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text3);
  font-size: 13px;
  font-style: italic;
}

/* ── Event timeline (vertical) ───────────────────────────────────────────── */
.tl-outer {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px 40px;
}

.tl-track {
  display: flex;
  flex-direction: column;
  max-width: 580px;
}

.tl-event {
  display: flex;
  gap: 14px;
  cursor: pointer;
}

.tl-spine {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 14px;
  padding-top: 3px;
}

.tl-node {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--bg);
  flex-shrink: 0;
  transition: transform 0.15s;
  z-index: 1;
}
.tl-event:hover .tl-node { transform: scale(1.3); }

.tl-line {
  flex: 1;
  width: 1px;
  background: var(--border-hi);
  margin-top: 4px;
  min-height: 12px;
}
.tl-event:last-child .tl-line { display: none; }

.tl-card {
  flex: 1;
  padding: 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tl-card-top {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.tl-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
  transition: color 0.12s;
}
.tl-event:hover .tl-card-name { color: var(--accent-l); }

.tl-card-sig {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: var(--r4);
  padding: 1px 7px;
  flex-shrink: 0;
}

.tl-card-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.tl-card-date {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text3);
}

.tl-sep { font-size: 10px; color: var(--text3); }

.tl-card-loc {
  font-size: 11px;
  color: var(--text3);
  font-style: italic;
}

/* ── Session log ─────────────────────────────────────────────────────────── */
.slog-chapter {
  max-width: 720px;
  margin: 0 auto 8px;
  border: 1px solid var(--border);
  border-radius: var(--r2);
  background: var(--surface);
  overflow: hidden;
}

.slog-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
}
.slog-header:hover { background: var(--surface-hi); }

.slog-num {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text3);
  flex-shrink: 0;
}
.slog-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.slog-spacer { flex: 1; min-width: 8px; }
.slog-date {
  font-size: 10px;
  letter-spacing: 0.07em;
  color: var(--text3);
  flex-shrink: 0;
}
.slog-status {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: var(--r4);
  border: 1px solid;
  flex-shrink: 0;
}
.slog-open {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-l);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: opacity 0.12s;
}
.slog-open:hover { opacity: 0.75; }

.slog-body {
  position: relative;
  max-height: 110px;
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: 12px 14px 0;
}
.slog-body--expanded { max-height: 3000px; }

.slog-fade {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 50px;
  background: linear-gradient(transparent, var(--surface));
  pointer-events: none;
}

.slog-content {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text2);
  padding-bottom: 12px;
}
.slog-content :deep(p) { margin: 0 0 0.5em; }
.slog-content :deep(h1), .slog-content :deep(h2), .slog-content :deep(h3) {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text3); margin: 0.8em 0 0.3em;
}
.slog-content :deep(ul), .slog-content :deep(ol) { padding-left: 1.4em; margin: 0 0 0.5em; }
.slog-content :deep(li) { margin-bottom: 0.15em; }
.slog-content :deep(strong) { color: var(--text); font-weight: 600; }
.slog-content :deep(blockquote) {
  border-left: 2px solid var(--border-hi); padding-left: 10px;
  color: var(--text3); font-style: italic; margin: 0.4em 0;
}
.slog-content :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 0.7em 0; }

.slog-no-notes { font-size: 12px; color: var(--text3); font-style: italic; padding: 12px 0; }

.slog-expand-btn {
  display: block;
  width: 100%;
  padding: 6px 14px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text3);
  background: var(--bg2);
  border: none;
  border-top: 1px solid var(--border);
  cursor: pointer;
  text-align: center;
  transition: color 0.12s, background 0.12s;
}
.slog-expand-btn:hover { color: var(--accent-l); background: var(--accent-bg); }
</style>
