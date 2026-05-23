<template>
  <div class="chronicle screen-in">

    <!-- ── Left panel: entity list ── -->
    <div class="elist">

      <div class="elist-head">
        <div class="elist-head-title" :style="{ color: typeConfig?.color }">
          {{ typeConfig?.plural }}
        </div>
        <div v-if="hasViewToggle" class="elist-vtabs">
          <button class="elist-vbtn" :class="{ active: type === 'location' ? !route.path.endsWith('/map') : !route.path.endsWith('/log') && !route.path.endsWith('/timeline') }" @click="setView('list')">{{ type === 'location' ? 'Entry' : 'List' }}</button>
          <button v-if="type === 'event'" class="elist-vbtn" :class="{ active: route.path.endsWith('/timeline') }" @click="setView('timeline')">Timeline</button>
          <button v-if="type === 'session'" class="elist-vbtn" :class="{ active: route.path.endsWith('/log') }" @click="setView('log')">Log</button>
          <button v-if="type === 'location'" class="elist-vbtn" :class="{ active: route.path.endsWith('/map') }" :disabled="!activeEntryId" @click="setView('map')">Map</button>
        </div>
        <button class="elist-export-btn" title="Export as JSON" @click="exportEntries">↓ JSON</button>
        <button class="btn-accent-sm" @click="createEntry">+ New</button>
      </div>

      <div class="elist-search">
        <span class="elist-search-icon">⌕</span>
        <input
          v-model="search"
          class="elist-search-input"
          :placeholder="`Search ${typeConfig?.plural?.toLowerCase() ?? ''}…`"
        />
        <button v-if="qfConfigs.length" class="elist-filter-btn" :class="{ active: activeQFCount > 0 }" @click="showFilters = !showFilters">
          <span v-if="activeQFCount" class="elist-filter-badge">{{ activeQFCount }}</span>
          ⊕
        </button>
      </div>

      <!-- Active filter chips -->
      <div v-if="activeQFCount > 0" class="elist-qf-chips">
        <span v-for="[key, val] in activeQFEntries" :key="key" class="elist-qf-chip">
          {{ qfChipLabel(key, val) }}
          <button class="elist-chip-x" @click="toggleQF(key, val)">×</button>
        </span>
        <button class="elist-chip-clear" @click="clearQF">Clear</button>
      </div>

      <!-- Collapsible filter panel -->
      <div v-if="showFilters && qfConfigs.length" class="elist-filter-panel">
        <template v-for="cfg in qfConfigs" :key="cfg.key">
          <div v-if="qfValuesFor(cfg.key).length" class="elist-fp-row">
            <span class="elist-fp-label">{{ cfg.label }}</span>
            <div class="elist-fp-pills">
              <button
                v-for="val in qfValuesFor(cfg.key)"
                :key="val"
                class="elist-qf-pill"
                :class="{ active: activeQF[cfg.key] === val }"
                @click="toggleQF(cfg.key, val)"
              >{{ val }}</button>
            </div>
          </div>
        </template>
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
          @click="route.path.endsWith('/map') && type === 'location' ? selectMapLocation(e) : openEntry(e)"
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

          <!-- Random Table: die badge -->
          <div v-else-if="type === 'random-table'" class="erow-die-badge" :style="{ color: typeConfig?.color, borderColor: (typeConfig?.color ?? '#888') + '55', background: (typeConfig?.color ?? '#888') + '11' }">
            {{ (e.attributes as any)?.die || 'd?' }}
          </div>

          <!-- Rumor: speak icon -->
          <div v-else-if="type === 'rumor'" class="erow-icon-badge" :style="{ color: typeConfig?.color }">
            <OhVueIcon name="gi-speaker" scale="0.75" />
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

      <!-- Child route (entry detail, map, log, timeline, etc.) -->
      <NuxtPage />
    </div>

  </div>
</template>

<script setup lang="ts">
import { useCampaignEntity } from '~/composables/useCampaignEntity'
import type { EntityType } from '~/types/entities'
import type { Entity } from '~/composables/useEntities'

const props = defineProps<{ type: EntityType }>()

const route = useRoute()
const router = useRouter()
const {
  typeConfig, entries, openEntry, createEntry, ensureLoaded, formatDateShort,
} = useCampaignEntity(props.type)

const campaignId = computed(() => Number(route.params.id))

const search = ref('')

// ── Quick filters ─────────────────────────────────────────────────────────────
interface QFConfig { key: string; label: string }

const QF_FIELDS: Partial<Record<string, QFConfig[]>> = {
  npc:            [{ key: 'status', label: 'Status' }, { key: 'race', label: 'Race' }, { key: 'role', label: 'Class' }, { key: 'level', label: 'Level' }],
  quest:          [{ key: 'status', label: 'Status' }],
  session:        [{ key: 'mode', label: 'Mode' }],
  location:       [{ key: 'status', label: 'Status' }],
  event:          [{ key: 'significance', label: 'Significance' }],
  faction:        [{ key: 'factionType', label: 'Type' }, { key: 'size', label: 'Size' }],
  'random-table': [{ key: 'die', label: 'Die' }],
  rumor:          [{ key: 'statuses', label: 'Status' }],
}

const activeQF = ref<Record<string, string | null>>({})
const showFilters = ref(false)

const qfConfigs = computed(() => QF_FIELDS[props.type] ?? [])
const activeQFCount = computed(() => Object.values(activeQF.value).filter(v => v !== null).length)
const activeQFEntries = computed(() =>
  Object.entries(activeQF.value).filter((e): e is [string, string] => e[1] !== null)
)

function qfValuesFor(key: string): string[] {
  const seen = new Set<string>()
  for (const e of entries.value) {
    const v = (e.attributes as any)?.[key]
    if (Array.isArray(v)) { v.forEach((item: string) => seen.add(item)); continue }
    if (v !== undefined && v !== null && v !== '') seen.add(String(v))
  }
  const arr = Array.from(seen)
  const allNum = arr.every(v => !Number.isNaN(Number(v)))
  return allNum ? arr.sort((a, b) => Number(a) - Number(b)) : arr.sort()
}

function toggleQF(key: string, val: string) {
  activeQF.value = { ...activeQF.value, [key]: activeQF.value[key] === val ? null : val }
}

function clearQF() { activeQF.value = {} }

function qfChipLabel(key: string, val: string): string {
  const cfg = qfConfigs.value.find(c => c.key === key)
  return `${cfg?.label ?? key}: ${val}`
}

const filteredEntries = computed(() => {
  let result = entries.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(e => e.name.toLowerCase().includes(q))
  }
  for (const [key, val] of Object.entries(activeQF.value)) {
    if (!val) continue
    result = result.filter(e => {
      const v = (e.attributes as any)?.[key]
      return Array.isArray(v) ? v.includes(val) : String(v ?? '') === val
    })
  }
  return result
})

const activeEntryId = computed(() =>
  route.params.entryId ? Number(route.params.entryId) : null
)

// ── View mode ─────────────────────────────────────────────────────────────────
const hasViewToggle = props.type === 'event' || props.type === 'session' || props.type === 'location'

function setView(m: string) {
  if (props.type === 'session') {
    if (m === 'log') router.push(`/campaign/${campaignId.value}/sessions/log`)
    else if (route.path.endsWith('/log')) router.push(`/campaign/${campaignId.value}/sessions`)
    return
  }
  if (props.type === 'event') {
    if (m === 'timeline') router.push(`/campaign/${campaignId.value}/events/timeline`)
    else if (route.path.endsWith('/timeline')) router.push(`/campaign/${campaignId.value}/events`)
    return
  }
  if (props.type === 'location') {
    if (m === 'map' && activeEntryId.value) {
      router.push(`/campaign/${campaignId.value}/locations/${activeEntryId.value}/map`)
    } else if (m === 'list' && route.path.endsWith('/map')) {
      router.push(`/campaign/${campaignId.value}/locations/${activeEntryId.value}`)
    }
  }
}

const activeForList = computed(() => activeEntryId.value)

function selectMapLocation(e: Entity) {
  router.push(`/campaign/${campaignId.value}/locations/${e.id}/map`)
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
  if (props.type === 'random-table') { const rows = a?.rows?.length; return rows ? `${rows} row${rows !== 1 ? 's' : ''}` : null }
  if (props.type === 'rumor') return a?.source ? `from ${a.source}` : null
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
  if (props.type === 'rumor') return a?.statuses?.[0] ?? null
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

function exportEntries() {
  const data = {
    version: 1,
    type: props.type,
    campaignId: campaignId.value,
    exportedAt: new Date().toISOString(),
    entries: entries.value,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dmstome-${props.type}s-${campaignId.value}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => ensureLoaded())
</script>

<style scoped>
/* ── Export button ───────────────────────────────────────────────────────── */
.elist-export-btn {
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text3);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r1);
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.elist-export-btn:hover { color: var(--text2); border-color: var(--border-hi); }

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

</style>
