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
        <button v-if="type !== 'region'" class="btn-accent-sm" @click="createEntry">+ New</button>
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
          <button v-if="type !== 'region'" class="btn-accent-sm" style="margin-top: 8px" @click="createEntry">Create one</button>
          <span v-else style="font-size:11px;color:var(--ink-ghost);margin-top:6px">Draw regions on the World Map</span>
        </div>

        <div
          v-for="e in filteredEntries"
          :key="e.id"
          class="erow"
          :class="{ active: activeForList === e.id }"
        >
          <component
            :is="ENTRY_COMPONENTS[type]"
            :entry="e"
            :deletable="true"
            @open="route.path.endsWith('/map') && type === 'location' ? selectMapLocation(e) : openEntry(e)"
            @delete="deleteEntry"
          />
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
import NpcEntry         from '~/components/notes/NpcEntry.vue'
import LocationEntry    from '~/components/notes/LocationEntry.vue'
import FactionEntry     from '~/components/notes/FactionEntry.vue'
import QuestEntry       from '~/components/notes/QuestEntry.vue'
import EventEntry       from '~/components/notes/EventEntry.vue'
import SessionEntry     from '~/components/notes/SessionEntry.vue'
import NoteEntry        from '~/components/notes/NoteEntry.vue'
import RandomTableEntry from '~/components/notes/RandomTableEntry.vue'
import RumorEntry       from '~/components/notes/RumorEntry.vue'
import RegionEntry      from '~/components/notes/RegionEntry.vue'

const ENTRY_COMPONENTS: Record<EntityType, any> = {
  npc: NpcEntry, location: LocationEntry, faction: FactionEntry,
  quest: QuestEntry, event: EventEntry, session: SessionEntry, note: NoteEntry,
  'random-table': RandomTableEntry, rumor: RumorEntry, region: RegionEntry,
}

const props = defineProps<{ type: EntityType }>()

const route = useRoute()
const router = useRouter()
const {
  typeConfig, entries, openEntry, createEntry, deleteEntry, ensureLoaded,
} = useCampaignEntity(props.type)

const campaignId = computed(() => Number(route.params.id))

const search = ref('')

// ── Quick filters ─────────────────────────────────────────────────────────────
interface QFConfig { key: string; label: string }

const QF_FIELDS: Partial<Record<string, QFConfig[]>> = {
  npc:            [{ key: 'status', label: 'Status' }, { key: 'race', label: 'Race' }, { key: 'role', label: 'Class' }, { key: 'level', label: 'Level' }],
  quest:          [{ key: 'status', label: 'Status' }],
  session:        [{ key: 'mode', label: 'Mode' }],
  location:       [{ key: 'locationType', label: 'Type' }, { key: 'status', label: 'Status' }],
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

/* ── Entry-card row wrapper ──────────────────────────────────────────────── */
/* Override the global .erow flex layout — the entry component owns its layout */
.erow {
  display: block;
  padding: 0;
  gap: 0;
  border-radius: var(--r2);
  margin-bottom: 2px;
}

/* Active accent bleeds into the entry card */
.erow.active :deep(.entry) {
  background: var(--accent-bg);
}

/* Suppress the entry component's own hover padding-shift inside the erow border */
.erow :deep(.entry:hover) {
  padding-left: 10px;
}
.erow :deep(.entry:hover::before) {
  display: none;
}

</style>
