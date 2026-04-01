<template>
  <div class="records-folio">
    <div class="open-book">

      <!-- LEFT PAGE -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <div class="page-header">
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
          <div class="leaf-inner">
            <div class="leaf-index">
              <div v-for="(rec, i) in pagedEntries" :key="rec.id!" class="entry"
                :class="{ 'entry--active': selectedId === rec.id }"
                :style="{ '--et-color': entityType?.color ?? 'var(--ink-ghost)' }"
                @click="openRecord(rec)">
                <span class="entry-num">{{ listPage * PAGE_SIZE + i + 1 }}</span>
                <div class="entry-icon">
                  <div class="entry-badge">
                    <img v-if="imageField && recordData(rec)[imageField.key]" :src="recordData(rec)[imageField.key]"
                      class="entry-thumb" />
                    <OhVueIcon v-else :name="entityType?.icon || 'gi-scroll-unfurled'" scale="0.75"
                      :style="{ color: entityType?.color }" />
                  </div>
                </div>
                <div class="entry-body">
                  <div class="entry-top">
                    <span class="entry-name">{{ rec.name }}</span>
                    <span class="entry-leader" />
                    <span class="entry-date">{{ formatDate(rec.updatedAt) }}</span>
                    <div class="entry-actions" @click.stop>
                      <button class="entry-act entry-act--del" @click.stop="deleteRecord(rec.id!)">
                        <OhVueIcon name="md-delete" scale="0.7" />
                      </button>
                    </div>
                  </div>
                  <div v-if="recordChips(rec).length > 0" class="entry-attrs">
                    <template v-for="(chip, ci) in recordChips(rec)" :key="chip.key">
                      <span v-if="ci > 0" class="ea-sep">✦</span>
                      <span v-if="chip.kind === 'pill'" class="ea-pill"
                        :style="{ color: entityType?.color, borderColor: entityType?.color, background: `color-mix(in srgb, ${entityType?.color} 10%, transparent)` }"
                        :title="chip.full">{{ chip.value }}</span>
                      <span v-else-if="chip.kind === 'text'" class="ea-text ea-text--trunc"
                        :title="chip.full">{{ chip.value }}</span>
                      <span v-else-if="chip.kind === 'bool'" class="ea-bool">{{ chip.value }}</span>
                      <template v-else-if="chip.kind === 'tags'">
                        <span v-for="t in chip.tags" :key="t" class="ea-tag">{{ t }}</span>
                      </template>
                    </template>
                  </div>
                </div>
              </div>
              <div v-if="!filtered.length" class="tome-empty-inline">
                <em>{{ search ? 'No results' : `No ${entityType?.plural} yet` }}</em>
              </div>
            </div>
          </div>
          <div class="leaf-footer">
            <button class="leaf-nav-btn" :disabled="!hasPrevPage" @click="prevPage">
              <OhVueIcon name="md-chevronleft" scale="0.9" />
            </button>
            <button class="leaf-new" @click="createRecord">
              <span class="leaf-new-line-l"></span>
              <span class="leaf-new-label">✦ New {{ entityType?.name }} ✦</span>
              <span class="leaf-new-line-r"></span>
            </button>
            <span class="leaf-folio-num">{{ listPage + 1 }} / {{ totalPages }}</span>
            <button class="leaf-nav-btn" :disabled="!hasNextPage" @click="nextPage">
              <OhVueIcon name="md-chevronright" scale="0.9" />
            </button>
          </div>
        </div>
      </div>

      <div class="book-binding"></div>

      <!-- RIGHT PAGE -->
      <div class="book-stack book-stack--right">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--right">
          <div class="leaf-inner">
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
              <EntityLayout
                :entity-type="entityType"
                :data="draftData"
                :mode="editMode ? 'edit' : 'view'"
                :accent-color="entityType.color"
                :system-id="systemId"
                @update="(key, value) => updateField(key, value)"
              />
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
const draftName = ref('')
const draftData = ref<Record<string, any>>({})
const search = ref('')

const system = computed(() => systemsStore.getSystem(systemId))
const entityType = computed(() => system.value?.entityTypes.find(t => t.id === typeId) ?? null)
const cardFields = computed(() => entityType.value?.fields.filter(f => f.showInCard && f.component !== 'image') ?? [])
const imageField = computed(() => entityType.value?.fields.find(f => f.component === 'image') ?? null)
const selectedRecord = computed(() => records.value.find(r => r.id === selectedId.value) ?? null)
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return q ? records.value.filter(r => r.name.toLowerCase().includes(q)) : records.value
})

// Pagination — 10 entries per left page
const PAGE_SIZE = 10
const listPage = ref(0)
const hasPrevPage = computed(() => listPage.value > 0)
const hasNextPage = computed(() => (listPage.value + 1) * PAGE_SIZE < filtered.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pagedEntries = computed(() => filtered.value.slice(listPage.value * PAGE_SIZE, (listPage.value + 1) * PAGE_SIZE))

function prevPage() { if (hasPrevPage.value) listPage.value-- }
function nextPage() { if (hasNextPage.value) listPage.value++ }

watch(search, () => { listPage.value = 0 })
watch(entityType, () => { listPage.value = 0 })

onMounted(async () => {
  if (!systemsStore.systems.length) await systemsStore.loadAll()
  await loadRecords()
  // Support ?open=name deep link (from entity refs in markdown)
  const openName = route.query.open as string | undefined
  if (openName) {
    const target = records.value.find(r => r.name.toLowerCase() === openName.toLowerCase())
    if (target) openRecord(target)
  }
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

type ChipKind =
  | { kind: 'pill'; key: string; value: string; full?: string }
  | { kind: 'text'; key: string; value: string; full?: string }
  | { kind: 'bool'; key: string; value: string }
  | { kind: 'tags'; key: string; tags: string[] }

const CHIP_MAX = 28

function trunc(s: string): { value: string; full?: string } {
  return s.length > CHIP_MAX
    ? { value: s.slice(0, CHIP_MAX) + '…', full: s }
    : { value: s }
}

function recordChips(rec: any): ChipKind[] {
  if (!entityType.value) return []
  const data = recordData(rec)
  const chips: ChipKind[] = []
  for (const f of cardFields.value) {
    const v = data[f.key]
    if (v === undefined || v === null || v === '') continue
    switch (f.component) {
      case 'select': {
        const t = trunc(String(v))
        chips.push({ kind: 'pill', key: f.key, ...t })
        break
      }
      case 'multiselect':
        if (Array.isArray(v) && v.length) chips.push({ kind: 'tags', key: f.key, tags: v })
        break
      case 'toggle':
        chips.push({ kind: 'bool', key: f.key, value: v ? f.label : `Not ${f.label}` })
        break
      case 'number': {
        const t = trunc(`${v}${f.config.unit ? ' ' + f.config.unit : ''}`)
        chips.push({ kind: 'pill', key: f.key, ...t })
        break
      }
      case 'tracker':
        if (typeof v === 'object' && v !== null)
          chips.push({ kind: 'text', key: f.key, value: `${v.current}/${v.max}` })
        break
      case 'tags':
        if (Array.isArray(v) && v.length) chips.push({ kind: 'tags', key: f.key, tags: v })
        break
      default: {
        const str = String(v)
        if (str) chips.push({ kind: 'text', key: f.key, ...trunc(str) })
      }
    }
  }
  return chips
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
  overflow: visible;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
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

/* ── Entry list ── */
.leaf-index { display: flex; flex-direction: column; }

/* Entry row */
.entry {
  align-items: flex-start;
  border-left: 2px solid transparent;
  transition: border-color 0.15s, background 0.15s, padding-left 0.15s;
}
.entry:hover {
  border-left-color: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 40%, transparent);
  background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 4%, transparent);
}
.entry--active {
  border-left-color: var(--et-color, var(--blood));
  background: color-mix(in srgb, var(--et-color, var(--blood)) 7%, transparent);
  padding-left: 4px;
}

/* Entry ordinal number */
.entry-num {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--ink-ghost);
  opacity: 0.4;
  width: 18px;
  flex-shrink: 0;
  text-align: right;
  padding-top: 2px;
  line-height: 1;
}

/* Icon badge — small circle with tinted background */
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
  color: var(--ink); font-weight: 600; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.entry--active .entry-name { color: var(--et-color, var(--ink)); }

/* Dotted leader between name and date */
.entry-leader {
  flex: 1; min-width: 8px;
  border-bottom: 1px dotted var(--ink-ghost);
  opacity: 0.3; align-self: center; position: relative; top: 1px;
}

.entry-date {
  font-family: var(--font-head); font-size: 8px;
  color: var(--ink-ghost); letter-spacing: 0.05em;
  flex-shrink: 0; white-space: nowrap;
}
.entry-attrs { display: flex; flex-wrap: nowrap; align-items: center; gap: 5px; overflow: hidden; padding-bottom: 3px; }

/* Actions (delete) */
.entry-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
.entry:hover .entry-actions { opacity: 1; }
.entry-act { width: 18px; height: 18px; border-radius: 2px; background: rgba(28,20,16,0.06); border: 1px solid transparent; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.entry-act--del:hover { background: var(--blood-pale); color: var(--blood); }

/* Chip styles */
.ea-pill {
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-head); font-size: 9px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 7px 2px 5px; border: 1px solid currentColor; border-radius: 2px;
  color: var(--ink-ghost); flex-shrink: 0; white-space: nowrap;
}
.ea-text {
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-ui); font-size: 11px;
  color: var(--ink-faded); flex-shrink: 0; white-space: nowrap;
}
.ea-text--trunc { max-width: 120px; overflow: hidden; text-overflow: ellipsis; cursor: default; }
.ea-bool {
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-head); font-size: 9px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 2px 7px 2px 5px; border-radius: 2px;
  color: var(--gold); background: rgba(184,134,11,0.08); border: 1px solid rgba(184,134,11,0.3);
  flex-shrink: 0;
}
.ea-tag {
  font-family: var(--font-ui); font-size: 10px; color: var(--ink-faded);
  background: rgba(28,20,16,0.04); border: 1px solid var(--parch-line);
  border-radius: 2px; padding: 1px 5px; flex-shrink: 0;
}
.ea-sep {
  color: var(--gold); font-size: 7px; opacity: 0.6;
  flex-shrink: 0; align-self: center; user-select: none;
}

/* Pagination footer */
.leaf-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 14px;
}
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
.leaf-nav-btn:hover:not(:disabled) { border-color: var(--ink-faded); color: var(--ink); }
.leaf-nav-btn:disabled { opacity: 0.25; cursor: default; }

.leaf-folio-num {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
  letter-spacing: 0.12em;
  white-space: nowrap;
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
  min-height: 300px;
  padding: 40px 0;
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