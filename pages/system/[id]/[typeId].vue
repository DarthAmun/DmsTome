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
          <button class="btn btn-ghost btn-sm" @click="selectedId = null">✕</button>
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
import { useSystemsStore } from '~/stores/systems'
import { getDb } from '~/composables/useDb'

const route = useRoute()
const systemsStore = useSystemsStore()
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

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return q ? records.value.filter(r => r.name.toLowerCase().includes(q)) : records.value
})

watch(search, () => { selectedId.value = null })

onMounted(async () => {
  await systemsStore.loadAll()
  await loadRecords()
  const openName = (route.query.record ?? route.query.open) as string | undefined
  if (openName) {
    const target = records.value.find(r => r.name.toLowerCase() === openName.toLowerCase())
    if (target) openRecord(target)
  }
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
}

async function saveName() {
  if (!selectedId.value) return
  await getDb().records.update(selectedId.value, { name: draftName.value, updatedAt: new Date().toISOString() })
  const rec = records.value.find(r => r.id === selectedId.value)
  if (rec) rec.name = draftName.value
  dirty.value = false
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
</script>

<style scoped>
.sys-entity-field-view {
  font-size: 14px;
  color: var(--text);
  padding: 4px 0;
}
</style>
