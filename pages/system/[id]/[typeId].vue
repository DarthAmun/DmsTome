<template>
  <div class="records-folio">
    <div class="page-header rec-header">
      <div class="page-chapter-num">{{ system?.name }}</div>
      <div class="rec-title-row">
        <OhVueIcon v-if="entityType" :name="entityType.icon" scale="1" :style="{ color: entityType.color }" />
        <h1 class="page-title" style="margin-bottom:0">{{ entityType?.plural ?? typeId }}</h1>
        <div style="flex:1" />
        <div class="rec-search-wrap">
          <OhVueIcon name="fa-search" scale="0.75" style="color:var(--ink-ghost)" />
          <input v-model="search" class="rec-search" placeholder="Search…" />
        </div>
        <button class="new-rec-fab" @click="createRecord">
          <OhVueIcon name="md-add" scale="0.9" /> New {{ entityType?.name }}
        </button>
      </div>
      <div class="page-rule" />
    </div>

    <div class="book-spread">
      <div class="book-page book-page--left">
        <div class="book-page-inner">
          <div class="index-list">
            <div v-for="rec in filtered" :key="rec.id!" class="entry"
              :class="{ 'entry--active': selectedId === rec.id }" @click="openRecord(rec)">
              <div class="entry-icon">
                <img v-if="imageField && recordData(rec)[imageField.key]" :src="recordData(rec)[imageField.key]"
                  class="entry-thumb" />
                <OhVueIcon v-else :name="entityType?.icon || 'gi-scroll-unfurled'" scale="0.85"
                  :style="{ color: entityType?.color }" />
              </div>
              <span class="entry-name">
                {{ rec.name }}
                <em v-if="cardFields[0] && recordData(rec)[cardFields[0].key]">
                  — {{ formatCardValue(cardFields[0], recordData(rec)[cardFields[0].key]) }}
                </em>
              </span>
              <span class="entry-dots" />
              <span v-if="cardFields[1] && recordData(rec)[cardFields[1].key]" class="entry-tag"
                :style="{ color: entityType?.color, borderColor: entityType?.color }">
                {{ formatCardValue(cardFields[1], recordData(rec)[cardFields[1].key]) }}
              </span>
              <span class="entry-date">{{ formatDate(rec.updatedAt) }}</span>
            </div>
            <div v-if="!filtered.length" class="tome-empty-inline">
              <em>{{ search ? 'No results' : `No ${entityType?.plural} yet` }}</em>
            </div>
          </div>
          <div class="new-entry-row">
            <button class="new-entry-btn" @click="createRecord">
              <span class="new-entry-line-left" />
              <span class="new-entry-label">✦ New {{ entityType?.name }} ✦</span>
              <span class="new-entry-line-right" />
            </button>
          </div>
        </div>
      </div>

      <div class="book-binding" />

      <div class="book-page book-page--right">
        <div class="book-page-inner">
          <template v-if="selectedId !== null && selectedRecord && entityType">
            <div class="rec-detail-header" :style="{ borderColor: entityType.color + '55' }">
              <OhVueIcon :name="entityType.icon" scale="1" :style="{ color: entityType.color }" />
              <input v-if="editMode" class="quill-input rec-name-input-folio" v-model="draftName" @blur="saveName"
                @keyup.enter="saveName" />
              <h2 v-else class="rec-name-folio" @click="editMode = true">{{ selectedRecord.name }}</h2>
              <span class="rec-type-tag" :style="{ color: entityType.color, borderColor: entityType.color }">
                {{ entityType.name }}
              </span>
              <div style="flex:1" />
              <button class="parch-btn parch-btn--sm" @click="editMode = !editMode">
                {{ editMode ? 'Done' : 'Edit' }}
              </button>
              <button class="parch-btn parch-btn--danger parch-btn--sm" @click="deleteRecord(selectedId!)">
                <OhVueIcon name="md-delete" scale="0.8" />
              </button>
            </div>
            <div class="rec-fields-grid">
              <div v-for="field in entityType.fields" :key="field.key" class="rec-field-wrap"
                :class="{ 'rec-field-wide': field.component === 'textarea' || field.component === 'tracker' }">
                <label class="rec-field-label">{{ field.label }}</label>
                <FieldRenderer :field="field" :value="draftData[field.key]" :mode="editMode ? 'edit' : 'view'"
                  @update="v => updateField(field.key, v)" />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="page-right-empty">
              <OhVueIcon v-if="entityType" :name="entityType.icon" scale="3" style="opacity:0.06;margin-bottom:16px" />
              <em class="page-right-hint">Select a record to view or edit it.</em>
            </div>
          </template>
        </div>
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
.records-folio {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--parch);
}

.rec-header {
  padding-bottom: 0;
  flex-shrink: 0;
}

.rec-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rec-search-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  border-bottom: 1px solid var(--ink-ghost);
  padding: 3px 0;
}

.rec-search {
  background: none;
  border: none;
  outline: none;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--ink);
  width: 100px;
}

.rec-search::placeholder {
  color: var(--ink-ghost);
  font-style: italic;
}

.new-rec-fab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 2px;
  background: var(--blood);
  color: var(--parch);
  border: none;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 6px rgba(139, 26, 26, 0.3);
}

.new-rec-fab:hover {
  background: var(--blood-l);
}

/* Book spread */
.book-spread {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--leather);
}

.book-page {
  flex: 1;
  min-width: 0;
  background: var(--parch);
  display: flex;
  flex-direction: column;
}

.book-page--left {
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.15);
}

.book-page--right {
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
}

.book-page-inner {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 32px;
  background: var(--parch);
}

.book-binding {
  width: 8px;
  flex-shrink: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.05) 30%, rgba(0, 0, 0, 0.05) 70%, rgba(0, 0, 0, 0.15));
  position: relative;
}

.book-binding::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  right: 3px;
  background: var(--leather);
  opacity: 0.6;
}

/* Entry states */
.entry--active {
  background: rgba(139, 26, 26, 0.06);
  padding-left: 8px;
}

.entry--active::before {
  content: '›';
  position: absolute;
  left: -4px;
  color: var(--blood);
  font-size: 16px;
}

/* Entry thumb */
.entry-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--parch-dark);
  flex-shrink: 0;
}

.entry-icon {
  width: 26px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-actions {
  display: flex;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s;
}

.entry:hover .entry-actions {
  opacity: 1;
}

.entry-act {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  background: rgba(28, 20, 16, 0.06);
  border: 1px solid transparent;
  color: var(--ink-ghost);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.entry-act--del:hover {
  background: var(--blood-pale);
  color: var(--blood);
}

/* New entry row */
.new-entry-row {
  display: flex;
  align-items: center;
  margin-top: 16px;
}

.new-entry-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0;
}

.new-entry-line-left {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--ink-ghost));
}

.new-entry-line-right {
  flex: 1;
  height: 1px;
  background: linear-gradient(to left, transparent, var(--ink-ghost));
}

.new-entry-label {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.2s;
}

.new-entry-btn:hover .new-entry-label {
  color: var(--blood);
}

.new-entry-btn:hover .new-entry-line {
  background: linear-gradient(to right, transparent, var(--blood));
}

/* Detail pane */
.rec-detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.rec-name-folio {
  font-family: var(--font-deco);
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  flex: 1;
  line-height: 1.2;
}

.rec-name-folio:hover {
  color: var(--blood);
}

.rec-name-input-folio {
  font-size: 18px;
  color: var(--ink);
  flex: 1;
  border-bottom: 1px solid var(--gold) !important;
  padding: 2px 0;
  font-family: var(--font-deco);
}

.rec-type-tag {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 2px 7px;
  border: 1px solid;
  border-radius: 2px;
}

.rec-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}

.rec-field-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rec-field-wide {
  grid-column: 1 / -1;
}

.rec-field-label {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--ink-ghost);
}

.parch-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: var(--parch-dark);
  border: 1px solid var(--ink-ghost);
  border-radius: 2px;
  color: var(--ink);
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}

.parch-btn:hover {
  background: var(--ink);
  color: var(--parch);
}

.parch-btn--sm {
  padding: 4px 10px;
  font-size: 9px;
}

.parch-btn--danger {
  border-color: var(--blood);
  color: var(--blood);
  background: var(--blood-pale);
}

.parch-btn--danger:hover {
  background: var(--blood);
  color: var(--parch);
}

/* Empty states */
.page-right-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.page-right-hint {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--ink-ghost);
  font-style: italic;
  text-align: center;
}

.tome-empty-inline {
  padding: 20px 0;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink-ghost);
  font-style: italic;
  text-align: center;
}
</style>