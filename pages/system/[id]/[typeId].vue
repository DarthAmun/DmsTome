<template>
  <div class="records-page">
    <!-- Header -->
    <header class="records-header">
      <NuxtLink :to="`/system/${systemId}`" class="rec-back">
        <OhVueIcon name="md-arrowback" scale="0.9" /> {{ system?.name }}
      </NuxtLink>
      <div class="rec-title-row">
        <OhVueIcon v-if="entityType" :name="entityType.icon" scale="1.4"
          :style="{ color: entityType.color }" />
        <h1 class="rec-title">{{ entityType?.plural ?? typeId }}</h1>
        <span class="rec-count">({{ records.length }})</span>
        <div class="rec-spacer" />
        <div class="search-wrap">
          <OhVueIcon name="fa-search" scale="0.8" style="color:var(--muted)" />
          <input v-model="search" class="search-input" :placeholder="`Search ${entityType?.plural ?? ''}…`" />
        </div>
        <button class="btn-primary-pill" @click="createRecord">
          <OhVueIcon name="md-add" scale="0.85" /> New {{ entityType?.name }}
        </button>
      </div>
    </header>

    <!-- Detail view -->
    <template v-if="selectedId !== null">
      <div class="rec-detail-bar">
        <button class="pill-btn" @click="selectedId = null">
          <OhVueIcon name="md-arrowback" scale="0.8" /> All {{ entityType?.plural }}
        </button>
      </div>
      <div class="rec-detail-body" v-if="selectedRecord && entityType">
        <!-- Record header -->
        <div class="rec-detail-header" :style="{ borderColor: entityType.color + '44' }">
          <OhVueIcon :name="entityType.icon" scale="1.2" :style="{ color: entityType.color }" />
          <input v-if="editMode" class="rec-name-input" v-model="draftName"
            @blur="saveName" @keyup.enter="saveName" />
          <h2 v-else class="rec-name" @click="editMode = true">{{ selectedRecord.name }}</h2>
          <span class="rec-type-tag" :style="{ background: entityType.color + '22', color: entityType.color }">
            {{ entityType.name }}
          </span>
          <div class="rec-spacer" />
          <button class="btn-ghost-pill" @click="editMode = !editMode">
            {{ editMode ? 'Done' : 'Edit' }}
          </button>
          <button class="btn-danger-pill" @click="deleteRecord(selectedId!)">
            <OhVueIcon name="md-delete" scale="0.85" />
          </button>
        </div>
        <!-- Fields -->
        <div class="rec-fields-grid">
          <div v-for="field in entityType.fields" :key="field.key" class="rec-field-wrap"
            :class="{ 'rec-field-wide': field.component === 'textarea' || field.component === 'tracker' }">
            <label class="rec-field-label">{{ field.label }}</label>
            <FieldRenderer
              :field="field"
              :value="draftData[field.key]"
              :mode="editMode ? 'edit' : 'view'"
              @update="v => updateField(field.key, v)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Record grid -->
    <div v-else class="records-grid">
      <div
        v-for="rec in filtered" :key="rec.id!"
        class="rec-card v6-card"
        @click="openRecord(rec)"
      >
        <!-- Image field if one exists -->
        <div v-if="imageField && recordData(rec)[imageField.key]" class="rec-card-img">
          <img :src="recordData(rec)[imageField.key]" class="w-full h-full object-cover" />
        </div>
        <div v-else-if="entityType" class="rec-card-icon-col"
          :style="{ background: entityType.color + '18' }">
          <OhVueIcon :name="entityType.icon" scale="1.4" :style="{ color: entityType.color }" />
        </div>
        <div class="rec-card-body">
          <div class="rec-card-name">{{ rec.name }}</div>
          <div v-for="f in cardFields.slice(0, 3)" :key="f.key" class="rec-card-field">
            <span class="rec-card-field-label">{{ f.label }}:</span>
            <span class="rec-card-field-val">{{ formatCardValue(f, recordData(rec)[f.key]) }}</span>
          </div>
          <div class="rec-card-date">{{ formatDate(rec.updatedAt) }}</div>
        </div>
      </div>
      <div v-if="!filtered.length && !search" class="rec-empty">
        <OhVueIcon v-if="entityType" :name="entityType.icon" scale="3"
          style="opacity:0.1;margin-bottom:16px" />
        <p>No {{ entityType?.plural }} yet</p>
        <button class="btn-primary-pill" @click="createRecord">
          New {{ entityType?.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
import { getDb } from '~/composables/useDb'
import type { FieldSchema } from '~/types/entities'

const route = useRoute()
const systemsStore = useSystemsStore()
const systemId = Number(route.params.id)
const typeId = route.params.typeId as string

const records = ref<any[]>([])
const selectedId = ref<number | null>(null)
const editMode = ref(false)
const draftName = ref('')
const draftData = ref<Record<string, any>>({})
const search = ref('')

const system = computed(() => systemsStore.getSystem(systemId))
const entityType = computed(() => system.value?.entityTypes.find(t => t.id === typeId) ?? null)
const cardFields = computed(() => entityType.value?.fields.filter(f => f.showInCard) ?? [])
const imageField = computed(() => entityType.value?.fields.find(f => f.component === 'image') ?? null)
const selectedRecord = computed(() => records.value.find(r => r.id === selectedId.value) ?? null)
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return q ? records.value.filter(r => r.name.toLowerCase().includes(q)) : records.value
})

onMounted(async () => {
  if (!systemsStore.systems.length) await systemsStore.loadAll()
  await loadRecords()
})

async function loadRecords() {
  const rows = await getDb().records
    .where('systemId').equals(systemId)
    .filter(r => r.entityTypeId === typeId)
    .toArray()
  records.value = rows.map(r => ({ ...r, _data: JSON.parse(r.data || '{}') }))
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
  editMode.value = true  // always start in edit mode for new records
}

function openRecord(rec: any) {
  selectedId.value = rec.id
  draftName.value = rec.name
  draftData.value = { ...recordData(rec) }
  // Auto-enter edit mode if record has no data yet
  const hasData = Object.keys(recordData(rec)).some(k => recordData(rec)[k] !== undefined && recordData(rec)[k] !== null && recordData(rec)[k] !== '')
  editMode.value = !hasData
}

async function saveName() {
  if (!selectedId.value) return
  await getDb().records.update(selectedId.value, { name: draftName.value, updatedAt: new Date().toISOString() })
  const rec = records.value.find(r => r.id === selectedId.value)
  if (rec) rec.name = draftName.value
}

async function updateField(key: string, value: any) {
  draftData.value = { ...draftData.value, [key]: value }
  if (!selectedId.value) return
  await getDb().records.update(selectedId.value, {
    data: JSON.stringify(draftData.value),
    updatedAt: new Date().toISOString(),
  })
  const rec = records.value.find(r => r.id === selectedId.value)
  if (rec) rec._data = { ...draftData.value }
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

function formatCardValue(f: FieldSchema, v: any): string {
  if (v === undefined || v === null) return '—'
  if (f.component === 'multiselect' && Array.isArray(v)) return v.join(', ')
  if (f.component === 'toggle') return v ? 'Yes' : 'No'
  if (f.component === 'tracker' && typeof v === 'object') return `${v.current}/${v.max}`
  return String(v)
}

function formatDate(dt: string) {
  if (!dt) return ''
  const diff = Date.now() - new Date(dt).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}
</script>

<style scoped>
.records-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--forge-base); }
.records-header { padding: 20px 24px 16px; background: var(--forge-surface); border-bottom: 1px solid var(--forge-border); flex-shrink: 0; }
.rec-back { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--forge-muted); text-decoration: none; margin-bottom: 10px; }
.rec-back:hover { color: var(--forge-text); }
.rec-title-row { display: flex; align-items: center; gap: 10px; }
.rec-title { font-family: var(--font-display); font-size: 22px; font-weight: 900; text-transform: uppercase; color: var(--forge-text); }
.rec-count { font-size: 14px; color: var(--forge-muted); }
.rec-spacer { flex: 1; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: var(--forge-raised); border-radius: 999px; padding: 7px 14px; }
.search-input { background: none; border: none; outline: none; font-size: 13px; color: var(--forge-text); font-family: 'DM Sans', sans-serif; width: 150px; }
.rec-detail-bar { padding: 10px 20px; background: var(--forge-surface); border-bottom: 1px solid var(--forge-border); flex-shrink: 0; }
.rec-detail-body { flex: 1; overflow-y: auto; padding: 24px; }
.rec-detail-header { display: flex; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid; margin-bottom: 24px; }
.rec-name { font-family: var(--font-display); font-size: 24px; font-weight: 900; color: var(--forge-text); cursor: pointer; flex: 1; }
.rec-name:hover { color: var(--forge-accent); }
.rec-name-input { font-family: var(--font-display); font-size: 24px; font-weight: 900; background: var(--forge-raised); border: 1px solid var(--forge-accent); border-radius: 6px; color: var(--forge-text); padding: 2px 8px; flex: 1; outline: none; }
.rec-type-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 999px; }
.rec-fields-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.rec-field-wrap { display: flex; flex-direction: column; gap: 6px; }
.rec-field-wide { grid-column: 1 / -1; }
.rec-field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--forge-muted); }
.records-grid { flex: 1; overflow-y: auto; padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; align-content: start; }
.rec-card { display: flex; flex-direction: column; overflow: hidden; cursor: pointer; }
.rec-card-img { height: 100px; overflow: hidden; }
.rec-card-icon-col { height: 80px; display: flex; align-items: center; justify-content: center; }
.rec-card-body { padding: 12px 14px; }
.rec-card-name { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--forge-text); margin-bottom: 4px; }
.rec-card-field { font-size: 11px; color: var(--forge-muted); margin-bottom: 2px; display: flex; gap: 4px; }
.rec-card-field-label { color: var(--forge-muted); flex-shrink: 0; }
.rec-card-field-val { color: var(--forge-secondary); }
.rec-card-date { font-size: 10px; color: var(--forge-muted); margin-top: 6px; opacity: 0.6; }
.rec-empty { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; padding: 60px; color: var(--forge-muted); font-size: 13px; gap: 16px; }
.btn-danger-pill { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 999px; background: var(--forge-danger-dim); border: none; color: var(--forge-danger); font-size: 12px; cursor: pointer; transition: all 0.15s; }
.btn-danger-pill:hover { background: rgba(224,85,85,0.2); }
</style>
