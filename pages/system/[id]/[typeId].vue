<template>
  <div style="display:flex; flex-direction:column; flex:1; overflow:hidden;">

    <!-- Breadcrumb subnav -->
    <div class="sys-subnav">
      <div class="sys-breadcrumb">
        <NuxtLink :to="`/system/${systemId}/library`" class="sys-breadcrumb-link">{{ system?.name }}</NuxtLink>
        <span class="sys-breadcrumb-sep">›</span>
        <span class="sys-breadcrumb-cur">{{ entityType?.plural ?? typeId }}</span>
      </div>
      <div class="sys-subnav-actions">
        <NuxtLink :to="`/system/${systemId}/builder?type=${typeId}`" class="btn btn-ghost btn-sm">Edit Type</NuxtLink>
        <button class="btn btn-accent btn-sm" @click="createRecord">+ New {{ entityType?.name }}</button>
      </div>
    </div>

    <!-- Two-panel shell -->
    <div class="sys-entity-shell">

      <!-- Left: entity list -->
      <div class="sys-entity-list">
        <div class="sys-entity-list-head">
          <div style="flex:1; font-size:14px; font-weight:600; color:var(--text)">{{ entityType?.plural ?? typeId }}</div>
          <span style="font-family:var(--fm); font-size:11px; color:var(--text3)">{{ filtered.length }}</span>
        </div>
        <div class="sys-entity-list-search">
          <span style="font-size:13px; color:var(--text3); flex-shrink:0">⌕</span>
          <input
            v-model="search"
            class="sys-entity-search-input"
            :placeholder="`Search ${(entityType?.plural ?? typeId).toLowerCase()}…`"
          />
          <button v-if="filterableFields.length" class="sys-filter-btn" :class="{ active: activeFilterCount > 0 }" @click="showFilters = !showFilters">
            <span v-if="activeFilterCount" class="sys-filter-badge">{{ activeFilterCount }}</span>
            ⊕
          </button>
        </div>

        <!-- Sort bar -->
        <div v-if="sortableFields.length" class="sys-sort-bar">
          <span class="sys-sort-lbl">Sort</span>
          <select v-model="sortField" class="sys-sort-sel">
            <option value="_name">Name</option>
            <option v-for="f in sortableFields" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
          <button class="sys-sort-dir" @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'">
            {{ sortDir === 'asc' ? '↑' : '↓' }}
          </button>
        </div>

        <!-- Active filter chips -->
        <div v-if="activeFilterCount > 0" class="sys-filter-chips">
          <span v-for="[key, val] in activeFilterEntries" :key="key" class="sys-filter-chip">
            {{ filterChipLabel(key, val) }}
            <button class="sys-chip-x" @click="setFilter(key, null)">×</button>
          </span>
          <button class="sys-chip-clear" @click="clearFilters">Clear</button>
        </div>

        <!-- Filter panel -->
        <div v-if="showFilters && filterableFields.length" class="sys-filter-panel">
          <div v-for="field in filterableFields" :key="field.key" class="sys-fp-row">
            <div class="sys-fp-label">{{ field.label }}</div>
            <div class="sys-fp-ctrl">
              <!-- select -->
              <select v-if="field.component === 'select'" class="sys-fp-sel"
                :value="activeFilters[field.key] ?? ''"
                @change="setFilter(field.key, ($event.target as HTMLSelectElement).value || null)">
                <option value="">Any</option>
                <option v-for="opt in fieldOptions(field)" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <!-- toggle -->
              <div v-else-if="field.component === 'toggle'" class="sys-fp-3way">
                <button :class="{ on: activeFilters[field.key] == null }" @click="setFilter(field.key, null)">Any</button>
                <button :class="{ on: activeFilters[field.key] === true }" @click="setFilter(field.key, true)">Yes</button>
                <button :class="{ on: activeFilters[field.key] === false }" @click="setFilter(field.key, false)">No</button>
              </div>
              <!-- number / rating range -->
              <div v-else-if="field.component === 'number' || field.component === 'rating'" class="sys-fp-range">
                <input type="number" placeholder="Min" class="sys-fp-num"
                  :value="(activeFilters[field.key] ?? {}).min ?? ''"
                  @input="setRangeFilter(field.key, 'min', ($event.target as HTMLInputElement).value)" />
                <span style="color:var(--text3); flex-shrink:0">–</span>
                <input type="number" placeholder="Max" class="sys-fp-num"
                  :value="(activeFilters[field.key] ?? {}).max ?? ''"
                  @input="setRangeFilter(field.key, 'max', ($event.target as HTMLInputElement).value)" />
              </div>
              <!-- text -->
              <input v-else-if="field.component === 'text'" class="sys-fp-txt" type="text"
                placeholder="contains…"
                :value="activeFilters[field.key] ?? ''"
                @input="setFilter(field.key, ($event.target as HTMLInputElement).value || null)" />
              <!-- tags / multiselect -->
              <div v-else-if="field.component === 'tags' || field.component === 'multiselect'" class="sys-fp-opts">
                <button v-for="opt in fieldOptions(field)" :key="opt"
                  class="sys-fp-opt" :class="{ on: (activeFilters[field.key] ?? []).includes(opt) }"
                  @click="toggleTagFilter(field.key, opt)">{{ opt }}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="sys-entity-list-body">
          <div
            v-for="rec in filtered"
            :key="rec.id"
            class="sys-entity-row"
            :class="{ active: selectedId === rec.id }"
            @click="openRecord(rec)"
          >
            <div class="sys-entity-row-dot"
              :style="{ background: selectedId === rec.id ? entityType?.color : 'var(--border-hi)' }" />
            <span class="sys-entity-row-name">{{ rec.name }}</span>
            <span v-if="firstChipValue(rec)" class="sys-entity-row-sub">{{ firstChipValue(rec) }}</span>
          </div>
          <div v-if="!filtered.length" style="padding:32px 16px; text-align:center; color:var(--text3); font-size:13px">
            {{ search ? 'No results' : `No ${(entityType?.plural ?? typeId).toLowerCase()} yet` }}
          </div>
        </div>
      </div>

      <!-- Right: entity editor -->
      <div class="sys-entity-editor" v-if="selectedId !== null && selectedRecord && entityType">
        <div class="sys-entity-editor-topbar">
          <div style="flex:1; font-size:14px; font-weight:600; color:var(--text)">{{ selectedRecord.name }}</div>
          <span v-if="dirty" style="font-size:11px; color:var(--text3)">Unsaved changes</span>
          <button class="btn btn-ghost btn-sm" @click="closeRecord">✕</button>
          <button class="btn btn-ghost btn-sm" @click="editMode = !editMode">{{ editMode ? 'Done' : 'Edit' }}</button>
          <button class="btn btn-danger btn-sm" @click="deleteRecord(selectedId!)">Delete</button>
        </div>
        <div class="sys-entity-editor-body">
          <!-- Name field -->
          <div class="sys-entity-field-group">
            <div class="sys-entity-field-label">Name <span style="color:var(--accent)">*</span></div>
            <input
              v-if="editMode"
              class="sys-entity-field-input"
              v-model="draftName"
              @blur="saveName"
              @keyup.enter="($event.target as HTMLInputElement).blur()"
            />
            <div v-else class="sys-entity-field-view">{{ selectedRecord.name }}</div>
          </div>
          <!-- Dynamic fields via EntityLayout -->
          <EntityLayout
            :entity-type="entityType"
            :data="draftData"
            :mode="editMode ? 'edit' : 'view'"
            :accent-color="entityType.color"
            :system-id="systemId"
            @update="(key, value) => updateField(key, value)"
          />
        </div>
      </div>

      <!-- Right: empty state -->
      <div v-else class="sys-entity-empty">
        <div class="sys-entity-empty-icon"
          :style="entityType ? { color: entityType.color, background: entityType.color + '18', borderColor: entityType.color + '33' } : {}">
          {{ entityType?.name?.charAt(0) ?? '?' }}
        </div>
        <span>Select an entry to view and edit it</span>
        <button class="btn btn-accent btn-sm" style="margin-top:4px" @click="createRecord">
          + New {{ entityType?.name }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useSystems } from '~/composables/useSystems'
import { getDb } from '~/composables/useDb'
import type { FieldSchema } from '~/types/entities'

const route = useRoute()
const router = useRouter()
const systemsStore = useSystems()
const systemId = Number(route.params.id)
const typeId = route.params.typeId as string

const records = ref<any[]>([])
const selectedId = ref<number | null>(null)
const editMode = ref(false)
const dirty = ref(false)
const draftName = ref('')
const draftData = ref<Record<string, any>>({})
const search = ref('')

const system = computed(() => systemsStore.getSystem(systemId))
const entityType = computed(() => system.value?.entityTypes.find(t => t.id === typeId) ?? null)
const imageField = computed(() => entityType.value?.fields.find(f => f.component === 'image') ?? null)
const cardFields = computed(() => entityType.value?.fields.filter(f => f.showInCard && f.component !== 'image') ?? [])
const selectedRecord = computed(() => records.value.find(r => r.id === selectedId.value) ?? null)

// ── Filter / sort state ───────────────────────────────────────────────────────
const FILTERABLE = new Set(['text', 'number', 'select', 'multiselect', 'toggle', 'tags', 'rating'])
const showFilters = ref(false)
const activeFilters = ref<Record<string, any>>({})
const sortField = ref('_name')
const sortDir = ref<'asc' | 'desc'>('asc')

const filterableFields = computed(() =>
  entityType.value?.fields.filter(f => FILTERABLE.has(f.component)) ?? []
)
const sortableFields = computed(() =>
  entityType.value?.fields.filter(f => f.sortable && f.component !== 'image') ?? []
)
const activeFilterCount = computed(() =>
  Object.values(activeFilters.value).filter(v => {
    if (v === null || v === undefined) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'object') return v.min != null || v.max != null
    return true
  }).length
)
const activeFilterEntries = computed(() =>
  Object.entries(activeFilters.value).filter(([, v]) => {
    if (v === null || v === undefined) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'object') return v.min != null || v.max != null
    return true
  })
)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  let result = records.value
  if (q) result = result.filter(r => r.name.toLowerCase().includes(q))
  if (activeFilterCount.value > 0) result = result.filter(r => matchesFilters(r))
  if (sortField.value === '_name') {
    return [...result].sort((a, b) => {
      const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      return sortDir.value === 'asc' ? cmp : -cmp
    })
  }
  return [...result].sort((a, b) => {
    const va = resolveFieldValue(recordData(a), sortField.value)
    const vb = resolveFieldValue(recordData(b), sortField.value)
    return compareValues(va, vb, sortDir.value)
  })
})

watch(search, () => { if (selectedId.value !== null) closeRecord() })
watch(() => typeId, () => {
  activeFilters.value = {}
  sortField.value = '_name'
  sortDir.value = 'asc'
  showFilters.value = false
})

onMounted(async () => {
  await systemsStore.loadAll()
  await loadRecords()
  const openName = (route.query.record ?? route.query.open) as string | undefined
  if (openName) {
    const target = records.value.find(r => r.name.toLowerCase() === openName.toLowerCase())
    if (target) openRecord(target)
  }
})

// React to bookmark navigation while already on this page
watch(() => route.query.record ?? route.query.open, async (name) => {
  if (!name) return
  const target = records.value.find(r => r.name.toLowerCase() === String(name).toLowerCase())
  if (target && target.id !== selectedId.value) openRecord(target)
})

function parseRecordData(data: any): Record<string, any> {
  if (!data) return {}
  if (typeof data === 'object') return data
  try { return JSON.parse(data) } catch { return {} }
}

async function loadRecords() {
  const rows = await getDb().records
    .where('systemId').equals(systemId)
    .filter(r => r.entityTypeId === typeId)
    .toArray()
  records.value = rows.map(r => ({ ...r, _data: parseRecordData(r.data) }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

async function createRecord() {
  const ts = new Date().toISOString()
  const id = await getDb().records.add({
    systemId, entityTypeId: typeId,
    name: `New ${entityType.value?.name ?? 'Record'}`,
    data: '{}', createdAt: ts, updatedAt: ts,
  })
  await loadRecords()
  const rec = records.value.find(r => r.id === id)!
  selectedId.value = rec.id
  draftName.value = rec.name
  draftData.value = {}
  dirty.value = false
  editMode.value = true
  router.replace({ query: { record: rec.name } })
}

function openRecord(rec: any) {
  selectedId.value = rec.id
  draftName.value = rec.name
  draftData.value = { ...recordData(rec) }
  dirty.value = false
  const hasData = Object.keys(recordData(rec)).some(k => {
    const v = recordData(rec)[k]
    return v !== undefined && v !== null && v !== ''
  })
  editMode.value = !hasData
  router.replace({ query: { record: rec.name } })
}

function closeRecord() {
  selectedId.value = null
  router.replace({ query: {} })
}

async function saveName() {
  if (!selectedId.value) return
  await getDb().records.update(selectedId.value, { name: draftName.value, updatedAt: new Date().toISOString() })
  const rec = records.value.find(r => r.id === selectedId.value)
  if (rec) rec.name = draftName.value
  dirty.value = false
  router.replace({ query: { record: draftName.value } })
}

async function updateField(key: string, value: any) {
  draftData.value = { ...draftData.value, [key]: value }
  dirty.value = true
  if (!selectedId.value) return
  await getDb().records.update(selectedId.value, {
    data: JSON.stringify(draftData.value),
    updatedAt: new Date().toISOString(),
  })
  const rec = records.value.find(r => r.id === selectedId.value)
  if (rec) rec._data = { ...draftData.value }
  dirty.value = false
}

async function deleteRecord(id: number) {
  if (!confirm('Delete this record?')) return
  await getDb().records.delete(id)
  records.value = records.value.filter(r => r.id !== id)
  selectedId.value = null
}

function recordData(rec: any): Record<string, any> {
  return rec._data ?? {}
}

function resolveFieldValue(data: Record<string, any>, key: string): any {
  if (key in data) return data[key]
  const lower = key.toLowerCase()
  for (const k of Object.keys(data)) {
    if (k.toLowerCase() === lower) return data[k]
  }
  return undefined
}

function firstChipValue(rec: any): string | null {
  if (!entityType.value) return null
  const data = recordData(rec)
  for (const f of cardFields.value) {
    const v = resolveFieldValue(data, f.key)
    if (v === undefined || v === null || v === '') continue
    if (f.component === 'toggle') return v ? f.label : null
    if (Array.isArray(v)) return v.length ? v[0] : null
    if (typeof v === 'object' && v?.current !== undefined) return `${v.current}/${v.max}`
    const s = String(v)
    return s.length > 20 ? s.slice(0, 20) + '…' : s
  }
  return null
}

// ── Filter helpers ────────────────────────────────────────────────────────────

function matchesFilters(rec: any): boolean {
  const data = recordData(rec)
  for (const [key, filterVal] of Object.entries(activeFilters.value)) {
    if (filterVal === null || filterVal === undefined) continue
    if (Array.isArray(filterVal) && filterVal.length === 0) continue
    const fieldVal = resolveFieldValue(data, key)
    if (!matchesFieldFilter(fieldVal, filterVal)) return false
  }
  return true
}

function matchesFieldFilter(fieldVal: any, filterVal: any): boolean {
  if (typeof filterVal === 'boolean') return Boolean(fieldVal) === filterVal
  if (Array.isArray(filterVal)) {
    if (Array.isArray(fieldVal)) return filterVal.some(fv => fieldVal.includes(fv))
    return filterVal.includes(String(fieldVal ?? ''))
  }
  if (typeof filterVal === 'object' && filterVal !== null) {
    const num = Number(fieldVal)
    if (filterVal.min != null && num < Number(filterVal.min)) return false
    if (filterVal.max != null && num > Number(filterVal.max)) return false
    return true
  }
  if (typeof filterVal === 'string') {
    return String(fieldVal ?? '').toLowerCase().includes(filterVal.toLowerCase())
  }
  return true
}

function compareValues(a: any, b: any, dir: 'asc' | 'desc'): number {
  const na = Number(a), nb = Number(b)
  let cmp = 0
  if (!Number.isNaN(na) && !Number.isNaN(nb)) cmp = na - nb
  else cmp = String(a ?? '').toLowerCase().localeCompare(String(b ?? '').toLowerCase())
  return dir === 'asc' ? cmp : -cmp
}

function setFilter(key: string, value: any) {
  if (value === null || value === undefined) {
    const next = { ...activeFilters.value }
    delete next[key]
    activeFilters.value = next
  } else {
    activeFilters.value = { ...activeFilters.value, [key]: value }
  }
}

function toggleTagFilter(key: string, opt: string) {
  const current: string[] = activeFilters.value[key] ?? []
  const next = current.includes(opt) ? current.filter(v => v !== opt) : [...current, opt]
  if (next.length === 0) {
    const updated = { ...activeFilters.value }
    delete updated[key]
    activeFilters.value = updated
  } else {
    activeFilters.value = { ...activeFilters.value, [key]: next }
  }
}

function setRangeFilter(key: string, minMax: 'min' | 'max', rawValue: string) {
  const val = rawValue === '' ? null : Number(rawValue)
  const current = activeFilters.value[key] ?? {}
  const next = { ...current, [minMax]: val }
  if (next.min == null && next.max == null) {
    const updated = { ...activeFilters.value }
    delete updated[key]
    activeFilters.value = updated
  } else {
    activeFilters.value = { ...activeFilters.value, [key]: next }
  }
}

function clearFilters() { activeFilters.value = {} }

function filterChipLabel(key: string, val: any): string {
  const field = filterableFields.value.find(f => f.key === key)
  const label = field?.label ?? key
  if (typeof val === 'boolean') return `${label}: ${val ? 'Yes' : 'No'}`
  if (Array.isArray(val)) return `${label}: ${val.join(', ')}`
  if (typeof val === 'object' && val !== null) {
    const parts: string[] = []
    if (val.min != null) parts.push(`≥${val.min}`)
    if (val.max != null) parts.push(`≤${val.max}`)
    return `${label}: ${parts.join(' ')}`
  }
  const s = String(val)
  return `${label}: ${s.length > 12 ? s.slice(0, 12) + '…' : s}`
}

function fieldOptions(field: FieldSchema): string[] {
  if (field.config?.options?.length) return field.config.options
  const seen = new Set<string>()
  for (const rec of records.value) {
    const v = resolveFieldValue(recordData(rec), field.key)
    if (v === null || v === undefined || v === '') continue
    if (Array.isArray(v)) v.forEach(s => seen.add(String(s)))
    else seen.add(String(v))
  }
  return Array.from(seen).sort()
}
</script>

<style scoped>
.sys-entity-field-view {
  font-size: 14px;
  color: var(--text);
  padding: 4px 0;
}

/* Search bar filter button */
.sys-filter-btn {
  position: relative;
  background: none;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 7px;
  cursor: pointer;
  color: var(--text3);
  font-size: 14px;
  flex-shrink: 0;
  line-height: 1.4;
}
.sys-filter-btn:hover, .sys-filter-btn.active { color: var(--accent); border-color: var(--accent); }
.sys-filter-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--accent);
  color: #fff;
  border-radius: 50%;
  font-size: 9px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--fm);
  pointer-events: none;
}

/* Sort bar */
.sys-sort-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--border);
  background: var(--bg2);
}
.sys-sort-lbl { font-size: 11px; color: var(--text3); flex-shrink: 0; }
.sys-sort-sel {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 5px;
}
.sys-sort-dir {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  color: var(--text2);
  font-size: 13px;
  flex-shrink: 0;
}
.sys-sort-dir:hover { background: var(--bg3); }

/* Active filter chips */
.sys-filter-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--border);
}
.sys-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border: 1px solid var(--accent);
  border-radius: 12px;
  padding: 1px 8px;
  font-size: 11px;
  color: var(--accent);
  font-family: var(--fm);
}
.sys-chip-x {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  opacity: 0.7;
}
.sys-chip-x:hover { opacity: 1; }
.sys-chip-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text3);
  font-size: 11px;
  padding: 1px 6px;
}
.sys-chip-clear:hover { color: var(--text); }

/* Filter panel */
.sys-filter-panel {
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  max-height: 240px;
  overflow-y: auto;
}
.sys-fp-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
}
.sys-fp-row:last-child { border-bottom: none; }
.sys-fp-label {
  font-size: 11px;
  color: var(--text3);
  width: 76px;
  flex-shrink: 0;
  padding-top: 4px;
  font-family: var(--fm);
}
.sys-fp-ctrl { flex: 1; min-width: 0; }
.sys-fp-sel {
  width: 100%;
  font-size: 12px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 3px 6px;
}
.sys-fp-3way { display: flex; gap: 4px; }
.sys-fp-3way button {
  flex: 1;
  font-size: 11px;
  background: var(--bg);
  color: var(--text3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 3px 0;
  cursor: pointer;
}
.sys-fp-3way button.on { background: var(--accent); color: #fff; border-color: var(--accent); }
.sys-fp-range { display: flex; align-items: center; gap: 6px; }
.sys-fp-num {
  width: 64px;
  font-size: 12px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 3px 6px;
}
.sys-fp-txt {
  width: 100%;
  font-size: 12px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 3px 6px;
}
.sys-fp-opts { display: flex; flex-wrap: wrap; gap: 4px; }
.sys-fp-opt {
  font-size: 11px;
  background: var(--bg);
  color: var(--text3);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 2px 8px;
  cursor: pointer;
}
.sys-fp-opt.on { background: var(--accent); color: #fff; border-color: var(--accent); }
</style>
