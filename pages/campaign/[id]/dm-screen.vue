<template>
  <div class="dms-root" :class="{ resizing: !!resizeState }" @keydown.esc="navigateTo(`/campaign/${id}`)">

    <!-- ── Top Bar ─────────────────────────────────────────────── -->
    <div class="dms-top">
      <div class="dms-mark">
        <span class="dms-mark-icon">◈</span>
        <span>DM Screen</span>
      </div>
      <div class="dms-sep-v" />
      <div class="dms-camp">
        <div class="dms-camp-name">{{ campaignName }}</div>
        <div class="dms-camp-sub">{{ linkedSystemName ? `${linkedSystemName} · ` : '' }}{{ widgets.length }} widget{{ widgets.length !== 1 ? 's' : '' }}</div>
      </div>
      <div class="dms-top-stretch" />
      <div class="dms-density">
        <button v-for="d in DENSITIES" :key="d.key" :class="['dms-density-btn', { active: density === d.key }]" @click="density = d.key">{{ d.label }}</button>
      </div>
      <button class="dms-top-btn" @click="resetLayout" title="Reset to default layout">↺ Reset</button>
      <button class="dms-top-btn" @click="clearAll" title="Remove all widgets">⌫ Clear</button>
      <NuxtLink :to="`/campaign/${id}`" class="dms-top-btn dms-top-btn--danger">✕ Exit</NuxtLink>
    </div>

    <!-- ── Body ───────────────────────────────────────────────── -->
    <div class="dms-body">

      <!-- Left Palette -->
      <div :class="['dms-palette', { collapsed: palCollapsed }]">

        <!-- Collapsed rail -->
        <div class="dms-palette-rail">
          <button class="dms-palette-collapse" title="Expand palette" @click="palCollapsed = false">»</button>
          <div class="dms-palette-rail-sep" />
          <button v-for="g in palGroups.filter(g => g.items.length)" :key="g.key"
            class="dms-palette-rail-btn"
            :title="`${g.label} (${g.items.length})`"
            @click="palCollapsed = false; openGroups[g.key] = true">
            <span class="rail-dot" :style="{ background: g.color }" />
            <span class="rail-count">{{ g.items.length }}</span>
          </button>
          <div v-if="systemGroups.length" class="dms-palette-rail-sep" />
          <button v-for="sg in systemGroups.filter(g => g.records.length)" :key="sg.id"
            class="dms-palette-rail-btn"
            :title="`${sg.name} (${sg.records.length})`"
            @click="palCollapsed = false; openGroups[`sys-${sg.id}`] = true">
            <span class="rail-dot" :style="{ background: sg.color || 'var(--accent)' }" />
            <span class="rail-count">{{ sg.records.length }}</span>
          </button>
          <div class="dms-palette-rail-sep" />
          <button class="dms-palette-rail-btn" title="Quick widgets" @click="palCollapsed = false; openGroups.quick = true">
            <span style="font-size:13px;color:var(--accent-l)">✦</span>
          </button>
        </div>

        <!-- Expanded: search + scroll -->
        <div class="dms-palette-search">
          <span class="dms-palette-search-icon">⌕</span>
          <input class="dms-palette-search-input" placeholder="Find entity…" v-model="paletteQuery" />
          <button class="dms-palette-collapse" title="Collapse palette" @click="palCollapsed = true">«</button>
        </div>

        <div class="dms-palette-scroll">

          <!-- Quick widgets group -->
          <div class="dms-pal-group">
            <div class="dms-pal-group-head" @click="openGroups.quick = !openGroups.quick">
              <span :class="['dms-pal-group-arrow', { open: openGroups.quick }]">▶</span>
              <span class="dms-pal-group-dot" style="background: var(--accent)" />
              <span class="dms-pal-group-label">Quick</span>
              <span class="dms-pal-group-count">{{ QUICK_WIDGETS.length }}</span>
            </div>
            <div v-if="openGroups.quick" class="dms-pal-quick">
              <div v-for="q in QUICK_WIDGETS" :key="q.kind"
                :class="['dms-pal-quick-btn', { pinned: isWidgetPinned(q.kind) }]"
                :draggable="!isWidgetPinned(q.kind)"
                :title="isWidgetPinned(q.kind) ? 'Already on board' : 'Drag or double-click to add'"
                @dragstart="!isWidgetPinned(q.kind) && onPalDragStart($event, q.kind)"
                @dragend="onDragEnd"
                @dblclick="!isWidgetPinned(q.kind) && addWidget({ kind: q.kind })">
                <span class="dms-pal-quick-icon">{{ q.icon }}</span>
                <span class="dms-pal-quick-label">{{ q.label }}</span>
                <span v-if="isWidgetPinned(q.kind)" style="font-size:10px;color:var(--success)">✓</span>
              </div>
            </div>
          </div>

          <!-- Campaign entity groups -->
          <div v-for="g in palGroups" :key="g.key" class="dms-pal-group">
            <div class="dms-pal-group-head" @click="openGroups[g.key] = !openGroups[g.key]">
              <span :class="['dms-pal-group-arrow', { open: openGroups[g.key] }]">▶</span>
              <span class="dms-pal-group-dot" :style="{ background: g.color }" />
              <span class="dms-pal-group-label">{{ g.label }}</span>
              <span class="dms-pal-group-count">{{ g.items.length }}</span>
            </div>
            <template v-if="openGroups[g.key]">
              <div v-for="e in g.items" :key="e.id"
                :class="['dms-pal-item', { pinned: isEntityPinned(g.key, e.id) }]"
                :draggable="!isEntityPinned(g.key, e.id)"
                :title="isEntityPinned(g.key, e.id) ? 'Already pinned' : 'Drag or double-click to add'"
                @dragstart="!isEntityPinned(g.key, e.id) && onPalDragStart($event, g.key as any, e.id)"
                @dragend="onDragEnd"
                @dblclick="!isEntityPinned(g.key, e.id) && addWidget({ kind: g.key as any, entityId: e.id })">
                <span class="dms-pal-item-dot" :style="{ background: g.color }" />
                <span class="dms-pal-item-name">{{ e.name }}</span>
                <span v-if="isEntityPinned(g.key, e.id)" class="dms-pal-item-meta" style="color:var(--success)">✓</span>
              </div>
              <div v-if="!g.items.length" class="dms-pal-empty">No {{ g.label.toLowerCase() }}</div>
            </template>
          </div>

          <!-- System entity groups -->
          <template v-if="systemGroups.length">
            <div v-for="sg in systemGroups" :key="sg.id" class="dms-pal-group">
              <div class="dms-pal-group-head" @click="openGroups[`sys-${sg.id}`] = !openGroups[`sys-${sg.id}`]">
                <span :class="['dms-pal-group-arrow', { open: openGroups[`sys-${sg.id}`] }]">▶</span>
                <span class="dms-pal-group-dot" :style="{ background: sg.color || 'var(--accent)' }" />
                <span class="dms-pal-group-label">{{ sg.name }}</span>
                <span class="dms-pal-group-count">{{ sg.records.length }}</span>
              </div>
              <template v-if="openGroups[`sys-${sg.id}`]">
                <div v-for="r in sg.records" :key="r.id"
                  :class="['dms-pal-item', { pinned: isRecordPinned(r.id) }]"
                  :draggable="!isRecordPinned(r.id)"
                  :title="isRecordPinned(r.id) ? 'Already pinned' : 'Drag or double-click to add'"
                  @dragstart="!isRecordPinned(r.id) && onPalDragStart($event, 'system-entity', undefined, r.id)"
                  @dragend="onDragEnd"
                  @dblclick="!isRecordPinned(r.id) && addWidget({ kind: 'system-entity', recordId: r.id })">
                  <span class="dms-pal-item-dot" :style="{ background: sg.color || 'var(--accent)' }" />
                  <span class="dms-pal-item-name">{{ r.name }}</span>
                  <span v-if="isRecordPinned(r.id)" class="dms-pal-item-meta" style="color:var(--success)">✓</span>
                </div>
                <div v-if="!sg.records.length" class="dms-pal-empty">No entries</div>
              </template>
            </div>
          </template>

          <div v-if="!palGroups.some(g => g.items.length) && paletteQuery" class="dms-pal-empty" style="padding:20px;text-align:center">
            No matches for "{{ paletteQuery }}"
          </div>
        </div>

        <div class="dms-pal-foot">
          <kbd>drag</kbd> or <kbd>dbl-click</kbd> to add · <kbd>esc</kbd> to exit
        </div>
      </div>

      <!-- Widget Canvas -->
      <div ref="canvasRef" :class="['dms-canvas', `density-${density}`]"
        @dragover.prevent="onCanvasDragOver"
        @drop.prevent="onCanvasDrop"
        @dragleave="onCanvasDragLeave">
        <div ref="gridRef" :class="['dms-grid', `density-${density}`, { 'drag-active': isDragFromPalette }]">

          <!-- Empty state -->
          <div v-if="!widgets.length" class="dms-empty">
            <div class="dms-empty-icon">DM</div>
            <div class="dms-empty-title">Empty Screen</div>
            <div class="dms-empty-sub">Drag entities from the palette to pin them here. Resize, rearrange, and clear as you go — layout is saved per campaign.</div>
            <div class="dms-empty-quick">
              <button class="dms-empty-quick-btn" @click="resetLayout">↺ Suggest a layout</button>
            </div>
          </div>

          <!-- Drop preview ghost -->
          <div v-if="dragPreview" class="dms-drop-preview"
            :style="{
              gridColumn: `${dragPreview.col} / span ${dragPreview.cols}`,
              gridRow: `${dragPreview.row} / span ${dragPreview.rows}`,
            }" />

          <!-- Widgets -->
          <div v-for="w in widgets" :key="w.id"
            :class="['dms-w', { dragging: dragState?.from?.widgetId === w.id }]"
            :style="{ gridColumn: `${w.col} / span ${w.cols}`, gridRow: `${w.row} / span ${w.rows}` }">

            <!-- Widget header -->
            <div class="dms-w-head"
              draggable="true"
              @dragstart="onWidgetDragStart($event, w)"
              @dragend="onDragEnd">
              <span class="dms-w-head-dot" :style="{ background: widgetColor(w), color: widgetColor(w) }" />
              <span class="dms-w-head-kind">{{ widgetKindLabel(w) }}</span>
              <span class="dms-w-head-title">{{ widgetTitle(w) }}</span>
              <div class="dms-w-head-actions">
                <button class="dms-w-act del" @click="removeWidget(w.id)" title="Remove widget">✕</button>
              </div>
            </div>

            <!-- Widget content -->
            <WidgetSession    v-if="w.kind === 'session'       && getEntity(w)" :entity="getEntity(w)!" class="dms-w-fill" />
            <WidgetNpc        v-else-if="w.kind === 'npc'      && getEntity(w)" :entity="getEntity(w)!" class="dms-w-fill" />
            <WidgetLocation   v-else-if="w.kind === 'location' && getEntity(w)" :entity="getEntity(w)!" class="dms-w-fill" />
            <WidgetFaction    v-else-if="w.kind === 'faction'  && getEntity(w)" :entity="getEntity(w)!" class="dms-w-fill" />
            <WidgetQuest      v-else-if="w.kind === 'quest'    && getEntity(w)" :entity="getEntity(w)!" class="dms-w-fill" />
            <WidgetNote       v-else-if="(w.kind === 'note' || w.kind === 'event') && getEntity(w)" :entity="getEntity(w)!" class="dms-w-fill" />
            <WidgetEncounterLink v-else-if="w.kind === 'encounter-link'" :campaign-id="id" :encounter-id="w.encounterId" class="dms-w-fill" @update:encounter-id="setEncounterId(w.id, $event)" />
            <WidgetConditionsGrid v-else-if="w.kind === 'conditions-grid'" :system-id="linkedSystemId" class="dms-w-fill" />
            <WidgetDice   v-else-if="w.kind === 'dice'"   class="dms-w-fill" />
            <WidgetSearch v-else-if="w.kind === 'search'" class="dms-w-fill" />
            <WidgetScratchpad v-else-if="w.kind === 'scratchpad'" v-model="scratchpad" class="dms-w-fill" />
            <WidgetSystemEntity v-else-if="w.kind === 'system-entity' && w.recordId" :record-id="w.recordId" class="dms-w-fill" />
            <div v-else class="dms-w-missing">Entity removed or not found.</div>

            <!-- Resize handle -->
            <div class="dms-w-resize"
              :class="{ active: resizeState?.widgetId === w.id }"
              @mousedown.prevent.stop="onResizeStart($event, w)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dbApi } from '~/composables/useDb'
import { getDb } from '~/composables/useDb'
import { useEntities } from '~/composables/useEntities'
import { usePageChrome } from '~/composables/usePageChrome'

// ── Route ──────────────────────────────────────────────────────────────────
const route = useRoute()
const id = Number(route.params.id)

// ── Hide spine ─────────────────────────────────────────────────────────────
const { hideSpine, showSpine } = usePageChrome()
onMounted(hideSpine)
onUnmounted(showSpine)

// ── Data loading ────────────────────────────────────────────────────────────
const entitiesStore = useEntities()
const campaignName = ref('')
const linkedSystemId = ref<number | null>(null)
const linkedSystemName = ref('')

onMounted(async () => {
  const camps = await dbApi.campaigns.list()
  const c = camps.find((x: any) => x.id === id)
  campaignName.value = c?.name ?? ''
  linkedSystemId.value = (c as any)?.system_id ?? null

  if (linkedSystemId.value) {
    const sys = await dbApi.systems.list()
    const s = sys.find((s: any) => s.id === linkedSystemId.value)
    linkedSystemName.value = s?.name ?? ''
    await loadSystemGroups(linkedSystemId.value)
  }

  if (!entitiesStore.entities.some(e => e.campaignId === id)) {
    await entitiesStore.loadAll(id)
  }
})

// ── System entity groups (for palette) ─────────────────────────────────────
interface SystemGroup {
  id: string
  name: string
  color: string
  records: { id: number; name: string }[]
}
const systemGroups = ref<SystemGroup[]>([])

async function loadSystemGroups(sysId: number) {
  const db = getDb()
  const sys = await db.systems.get(sysId)
  if (!sys) return
  const entityTypes: any[] = typeof sys.entityTypes === 'string'
    ? JSON.parse(sys.entityTypes || '[]')
    : (sys.entityTypes ?? [])

  const groups: SystemGroup[] = []
  for (const et of entityTypes) {
    const recs = await db.records
      .where('systemId').equals(sysId)
      .filter((r: any) => r.entityTypeId === et.id)
      .toArray()
    if (recs.length) {
      groups.push({
        id: et.id,
        name: et.plural || et.name,
        color: et.color || 'var(--accent)',
        records: recs.map((r: any) => ({ id: r.id!, name: r.name })).sort((a, b) => a.name.localeCompare(b.name)),
      })
    }
  }
  systemGroups.value = groups
}

// ── Widget state ───────────────────────────────────────────────────────────
type WidgetKind =
  | 'session' | 'npc' | 'location' | 'faction' | 'quest' | 'event' | 'note'
  | 'encounter-link' | 'conditions-grid' | 'dice' | 'search' | 'scratchpad' | 'system-entity'

interface DmWidget {
  id: string
  kind: WidgetKind
  entityId?: number
  recordId?: number
  encounterId?: number | null
  cols: number
  rows: number
  col: number
  row: number
}

const DEFAULT_COLS_ROWS: Record<WidgetKind, [number, number]> = {
  session: [6, 2], npc: [3, 1], location: [3, 2], faction: [3, 1],
  quest: [3, 1], event: [3, 1], note: [3, 2],
  'encounter-link': [3, 2], 'conditions-grid': [3, 2],
  dice: [3, 3], search: [2, 1], scratchpad: [6, 1], 'system-entity': [3, 2],
}

const LEGACY_SIZE_MAP: Record<string, [number, number]> = {
  xs: [2, 1], s: [3, 1], m: [3, 2], w: [6, 1], l: [6, 2], t: [3, 3], xl: [12, 3],
}

const LS_KEY = `dmscreen-v2-${id}`
const LS_SCRATCH = `dmscreen-scratch-v2-${id}`

const widgets = ref<DmWidget[]>([])
const scratchpad = ref('')

// ── Grid packing helpers ───────────────────────────────────────────────────
function autopack(ws: DmWidget[]): DmWidget[] {
  const GRID_COLS = 12
  const occ = new Set<string>()

  function fits(c: number, r: number, cols: number, rows: number) {
    if (c + cols - 1 > GRID_COLS) return false
    for (let dc = 0; dc < cols; dc++)
      for (let dr = 0; dr < rows; dr++)
        if (occ.has(`${c + dc},${r + dr}`)) return false
    return true
  }
  function mark(c: number, r: number, cols: number, rows: number) {
    for (let dc = 0; dc < cols; dc++)
      for (let dr = 0; dr < rows; dr++)
        occ.add(`${c + dc},${r + dr}`)
  }
  function findPos(cols: number, rows: number): [number, number] {
    for (let r = 1; r < 500; r++)
      for (let c = 1; c <= GRID_COLS - cols + 1; c++)
        if (fits(c, r, cols, rows)) { mark(c, r, cols, rows); return [c, r] }
    return [1, 1]
  }

  return ws.map(w => {
    if (w.col != null && w.row != null) { mark(w.col, w.row, w.cols, w.rows); return w }
    const [col, row] = findPos(w.cols, w.rows)
    return { ...w, col, row }
  })
}

function findFreePos(cols: number, rows: number): [number, number] {
  for (let r = 1; r < 500; r++)
    for (let c = 1; c <= 13 - cols; c++)
      if (!isOccupied(c, r, cols, rows)) return [c, r]
  return [1, 1]
}

// Load from localStorage (with migration from old size-based format)
if (import.meta.client) {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) {
        let ws = parsed.map((w: any) => {
          const migrated = (w.cols != null && w.rows != null) ? w : (() => {
            const [cols, rows] = LEGACY_SIZE_MAP[w.size] ?? [3, 2]
            const { size: _s, ...rest } = w
            return { ...rest, cols, rows }
          })()
          if (migrated.kind === 'dice-search') return { ...migrated, kind: 'dice' }
          return migrated
        })
        // Migrate widgets that lack explicit col/row
        if (ws.some((w: any) => w.col == null || w.row == null)) ws = autopack(ws)
        widgets.value = ws
      }
    }
  } catch {}
  try { scratchpad.value = localStorage.getItem(LS_SCRATCH) || '' } catch {}
}

// Persist to localStorage
watch(widgets, v => {
  if (import.meta.client) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(v)) } catch {}
  }
}, { deep: true })

watch(scratchpad, v => {
  if (import.meta.client) {
    try { localStorage.setItem(LS_SCRATCH, v) } catch {}
  }
})

// ── Default layout ─────────────────────────────────────────────────────────
function buildDefaultLayout(): DmWidget[] {
  const ents = entitiesStore.entities.filter(e => e.campaignId === id)
  const partial: Omit<DmWidget, 'col' | 'row'>[] = []
  const byType = (t: string) => ents.filter(e => e.type === t)

  const lastSession = byType('session').at(-1)
  if (lastSession) partial.push({ id: `w-s-${lastSession.id}`, kind: 'session', entityId: lastSession.id, cols: 6, rows: 2 })

  partial.push({ id: 'w-dice', kind: 'dice', cols: 3, rows: 3 })
  partial.push({ id: 'w-enc', kind: 'encounter-link', cols: 3, rows: 2 })

  byType('npc').slice(0, 2).forEach(n => partial.push({ id: `w-n-${n.id}`, kind: 'npc', entityId: n.id, cols: 3, rows: 1 }))

  const activeQuest = byType('quest').find(q => (q.attributes as any)?.status === 'active')
  if (activeQuest) partial.push({ id: `w-q-${activeQuest.id}`, kind: 'quest', entityId: activeQuest.id, cols: 3, rows: 1 })

  partial.push({ id: 'w-cond', kind: 'conditions-grid', cols: 3, rows: 2 })
  partial.push({ id: 'w-scratch', kind: 'scratchpad', cols: 6, rows: 1 })

  return autopack(partial as DmWidget[])
}

function resetLayout() {
  if (confirm('Reset layout to defaults?')) {
    widgets.value = buildDefaultLayout()
  }
}

function clearAll() {
  if (confirm('Remove all widgets? (Scratchpad is kept.)')) {
    widgets.value = []
  }
}

// ── Widget helpers ─────────────────────────────────────────────────────────
function getEntity(w: DmWidget) {
  if (!w.entityId) return null
  return entitiesStore.entities.find(e => e.id === w.entityId && e.campaignId === id) ?? null
}

const SINGLETONS: WidgetKind[] = ['encounter-link', 'conditions-grid', 'dice', 'search', 'scratchpad']

function canAdd(kind: WidgetKind, entityId?: number, recordId?: number): boolean {
  if (SINGLETONS.includes(kind) && widgets.value.some(w => w.kind === kind)) return false
  if (entityId != null && widgets.value.some(w => w.kind === kind && w.entityId === entityId)) return false
  if (recordId != null && widgets.value.some(w => w.kind === kind && w.recordId === recordId)) return false
  return true
}

function addWidget(opts: { kind: WidgetKind; entityId?: number; recordId?: number }) {
  const { kind, entityId, recordId } = opts
  const [cols, rows] = DEFAULT_COLS_ROWS[kind]
  const [col, row] = findFreePos(cols, rows)
  addWidgetAt({ kind, entityId, recordId, col, row, cols, rows })
}

function addWidgetAt(opts: { kind: WidgetKind; entityId?: number; recordId?: number; col: number; row: number; cols: number; rows: number }) {
  const { kind, entityId, recordId, col, row, cols, rows } = opts
  if (!canAdd(kind, entityId, recordId)) return
  const id = entityId != null ? `w-${kind}-${entityId}`
    : recordId != null ? `w-${kind}-${recordId}`
    : `w-${kind}-${Date.now()}`
  widgets.value.push({ id, kind, entityId, recordId, col, row, cols, rows })
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter(w => w.id !== id)
}

function setEncounterId(wid: string, encounterId: number | null) {
  widgets.value = widgets.value.map(w => w.id === wid ? { ...w, encounterId } : w)
}

// ── Resize by dragging corner ──────────────────────────────────────────────
const gridRef = ref<HTMLElement | null>(null)

interface ResizeState {
  widgetId: string
  startX: number; startY: number
  startCols: number; startRows: number
  cellW: number; cellH: number; gap: number
}
const resizeState = ref<ResizeState | null>(null)

function onResizeStart(e: MouseEvent, w: DmWidget) {
  const grid = gridRef.value
  if (!grid) return
  const rect = grid.getBoundingClientRect()
  const gap = density.value === 'compact' ? 8 : density.value === 'loose' ? 16 : 12
  const cellH = density.value === 'compact' ? 88 : density.value === 'loose' ? 140 : 110
  const cellW = (rect.width - 11 * gap) / 12

  resizeState.value = { widgetId: w.id, startX: e.clientX, startY: e.clientY, startCols: w.cols, startRows: w.rows, cellW, cellH, gap }
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd, { once: true })
}

function onResizeMove(e: MouseEvent) {
  const s = resizeState.value
  if (!s) return
  const w = widgets.value.find(w => w.id === s.widgetId)
  if (!w) return
  const rawCols = Math.max(2, Math.min(13 - w.col, s.startCols + Math.round((e.clientX - s.startX) / (s.cellW + s.gap))))
  const rawRows = Math.max(1, Math.min(8,           s.startRows + Math.round((e.clientY - s.startY) / (s.cellH + s.gap))))
  // Always produce a valid size — shrink rather than refuse the drag
  let cols = rawCols
  while (cols > 2 && isOccupied(w.col, w.row, cols, rawRows, w.id)) cols--
  let rows = rawRows
  while (rows > 1 && isOccupied(w.col, w.row, cols, rows, w.id)) rows--
  if (w.cols === cols && w.rows === rows) return
  widgets.value = widgets.value.map(x => x.id === s.widgetId ? { ...x, cols, rows } : x)
}

function onResizeEnd() {
  resizeState.value = null
  document.removeEventListener('mousemove', onResizeMove)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
})

function isWidgetPinned(kind: WidgetKind) {
  return widgets.value.some(w => w.kind === kind)
}
function isEntityPinned(kind: string, entityId: number) {
  return widgets.value.some(w => w.kind === kind && w.entityId === entityId)
}
function isRecordPinned(recordId: number) {
  return widgets.value.some(w => w.kind === 'system-entity' && w.recordId === recordId)
}

function widgetTitle(w: DmWidget): string {
  if (w.kind === 'encounter-link')   return 'Encounter'
  if (w.kind === 'conditions-grid')  return 'Conditions'
  if (w.kind === 'dice')             return 'Dice Roller'
  if (w.kind === 'search')           return 'Search'
  if (w.kind === 'scratchpad')       return 'Scratchpad'
  if (w.kind === 'system-entity' && w.recordId) {
    const grp = systemGroups.value.flatMap(g => g.records).find(r => r.id === w.recordId)
    return grp?.name ?? 'Record'
  }
  const e = getEntity(w)
  return e?.name ?? '(missing)'
}

function widgetKindLabel(w: DmWidget): string {
  const MAP: Partial<Record<WidgetKind, string>> = {
    'encounter-link': 'Encounter', 'conditions-grid': 'Conditions',
    dice: 'Dice', search: 'Search', scratchpad: 'Notes', 'system-entity': 'System',
    session: 'Session', npc: 'NPC', location: 'Location',
    faction: 'Faction', quest: 'Quest', event: 'Event', note: 'Note',
  }
  return MAP[w.kind] ?? w.kind
}

function widgetColor(w: DmWidget): string {
  const MAP: Partial<Record<WidgetKind, string>> = {
    'encounter-link':  'oklch(72% 0.20 295)',
    'conditions-grid': 'oklch(72% 0.20 22)',
    dice:              'oklch(72% 0.18 145)',
    search:            'oklch(72% 0.18 145)',
    scratchpad:        'oklch(76% 0.10 215)',
    'system-entity':   'oklch(76% 0.14 85)',
    session:           '#6b9fe8', npc: '#5db870', location: '#a87de8',
    faction:           '#e05555', quest: '#e8924a', event: '#4ab8e8', note: '#7eaacc',
  }
  return MAP[w.kind] ?? 'var(--accent)'
}

// ── Density & grid ─────────────────────────────────────────────────────────
const DENSITIES = [
  { key: 'compact', label: 'Compact' },
  { key: 'comfortable', label: 'Cozy' },
  { key: 'loose', label: 'Loose' },
]
const density = ref('comfortable')

// ── Palette state ──────────────────────────────────────────────────────────
const palCollapsed = ref(false)
const paletteQuery = ref('')

const ENTITY_TYPES = [
  { key: 'session',  label: 'Sessions',  color: '#6b9fe8' },
  { key: 'npc',      label: 'NPCs',      color: '#5db870' },
  { key: 'location', label: 'Locations', color: '#a87de8' },
  { key: 'faction',  label: 'Factions',  color: '#e05555' },
  { key: 'quest',    label: 'Quests',    color: '#e8924a' },
  { key: 'event',    label: 'Events',    color: '#4ab8e8' },
  { key: 'note',     label: 'Notes',     color: '#7eaacc' },
]

const QUICK_WIDGETS = [
  { kind: 'encounter-link'  as WidgetKind, label: 'Encounter',       icon: '⚔' },
  { kind: 'conditions-grid' as WidgetKind, label: 'Conditions Grid', icon: '☣' },
  { kind: 'dice'            as WidgetKind, label: 'Dice Roller',     icon: '⚀' },
  { kind: 'search'          as WidgetKind, label: 'Search',          icon: '⌕' },
  { kind: 'scratchpad'      as WidgetKind, label: 'Scratchpad',      icon: '✎' },
]

const openGroups = reactive<Record<string, boolean>>({
  session: true, npc: true, location: false, faction: false,
  quest: false, event: false, note: false, quick: true,
})

const palGroups = computed(() =>
  ENTITY_TYPES.map(et => ({
    key: et.key,
    label: et.label,
    color: et.color,
    items: entitiesStore.entities
      .filter(e => e.campaignId === id && e.type === et.key &&
        (!paletteQuery.value.trim() || e.name.toLowerCase().includes(paletteQuery.value.toLowerCase()))),
  }))
)

// ── Drag and drop ──────────────────────────────────────────────────────────
interface DragState {
  kind: WidgetKind
  entityId?: number
  recordId?: number
  cols: number
  rows: number
  from?: { widgetId: string; col: number; row: number }
}

const dragState = ref<DragState | null>(null)
const dragPreview = ref<{ col: number; row: number; cols: number; rows: number } | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const lastDragCell = ref<{ col: number; row: number } | null>(null)

const isDragFromPalette = computed(() => !!dragState.value && !dragState.value.from)

function onPalDragStart(e: DragEvent, kind: WidgetKind, entityId?: number, recordId?: number) {
  const [cols, rows] = DEFAULT_COLS_ROWS[kind]
  dragState.value = { kind, entityId, recordId, cols, rows }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}

function onWidgetDragStart(e: DragEvent, w: DmWidget) {
  dragState.value = { kind: w.kind, entityId: w.entityId, recordId: w.recordId, cols: w.cols, rows: w.rows, from: { widgetId: w.id, col: w.col, row: w.row } }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function isOccupied(col: number, row: number, cols: number, rows: number, excludeId?: string, excludeCol?: number, excludeRow?: number): boolean {
  for (const w of widgets.value) {
    // Exclude by ID or by source position — both guards against any edge case
    if (w.id === excludeId) continue
    if (excludeCol !== undefined && excludeRow !== undefined && w.col === excludeCol && w.row === excludeRow) continue
    const noOverlap = col + cols <= w.col || col >= w.col + w.cols ||
                      row + rows <= w.row || row >= w.row + w.rows
    if (!noOverlap) return true
  }
  return false
}

function getDropCell(e: DragEvent): { col: number; row: number } | null {
  const grid = gridRef.value
  if (!grid || !dragState.value) return null
  const gap = density.value === 'compact' ? 8 : density.value === 'loose' ? 16 : 12
  const rowH = density.value === 'compact' ? 88 : density.value === 'loose' ? 140 : 110
  const rect = grid.getBoundingClientRect()
  const cellW = (rect.width - 11 * gap) / 12
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const { cols, rows } = dragState.value
  const col = Math.max(1, Math.min(13 - cols, Math.floor(x / (cellW + gap)) + 1))
  const row = Math.max(1, Math.floor(y / (rowH + gap)) + 1)
  return { col, row }
}

function onCanvasDragOver(e: DragEvent) {
  if (!dragState.value) return
  const { cols, from } = dragState.value
  if (e.dataTransfer) e.dataTransfer.dropEffect = from ? 'move' : 'copy'
  const cell = getDropCell(e)
  if (!cell) return
  if (lastDragCell.value?.col === cell.col && lastDragCell.value?.row === cell.row) return
  lastDragCell.value = cell
  if (!isOccupied(cell.col, cell.row, cols, dragState.value.rows, from?.widgetId, from?.col, from?.row)) {
    dragPreview.value = { col: cell.col, row: cell.row, cols, rows: dragState.value.rows }
  }
}

function onCanvasDragLeave(e: DragEvent) {
  if (!e.relatedTarget) return
  const canvas = canvasRef.value
  if (canvas && !canvas.contains(e.relatedTarget as Node)) dragPreview.value = null
}

function onCanvasDrop() {
  if (!dragState.value) return
  const pos = dragPreview.value
  if (!pos) { onDragEnd(); return }
  if (dragState.value.from) {
    const srcId = dragState.value.from.widgetId
    widgets.value = widgets.value.map(w => w.id === srcId ? { ...w, col: pos.col, row: pos.row } : w)
  } else {
    addWidgetAt({ kind: dragState.value.kind, entityId: dragState.value.entityId, recordId: dragState.value.recordId, col: pos.col, row: pos.row, cols: pos.cols, rows: pos.rows })
  }
  onDragEnd()
}

function onDragEnd() {
  dragState.value = null
  dragPreview.value = null
  lastDragCell.value = null
}
</script>

<style scoped>
.dms-root {
  position: fixed; inset: 0; z-index: 380;
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--bg);
  animation: dms-fade 0.20s ease both;
}
@keyframes dms-fade { from { opacity: 0; } to { opacity: 1; } }

.dms-root::before {
  content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 60% 45% at 12% -5%, color-mix(in oklch, var(--accent) 25%, transparent) 0%, transparent 55%),
    radial-gradient(ellipse 55% 40% at 92% 105%, color-mix(in oklch, var(--accent-d) 18%, transparent) 0%, transparent 55%);
}

/* ── Top bar ── */
.dms-top {
  position: relative; z-index: 2;
  display: flex; align-items: center; gap: 14px;
  padding: 0 18px; height: 54px; flex-shrink: 0;
  background: var(--surface);
  backdrop-filter: blur(32px) saturate(180%);
  border-bottom: 1px solid var(--border);
}
.dms-mark {
  display: flex; align-items: center; gap: 9px;
  font-family: var(--fh); font-size: 13px; font-weight: 700;
  color: var(--accent-l); letter-spacing: 0.10em; text-transform: uppercase;
}
.dms-mark-icon {
  width: 24px; height: 24px; border-radius: 6px;
  background: var(--accent-bg); border: 1px solid color-mix(in oklch, var(--accent) 45%, transparent);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
  box-shadow: 0 0 16px color-mix(in oklch, var(--accent) 30%, transparent);
}
.dms-sep-v { width: 1px; height: 22px; background: var(--border-hi); flex-shrink: 0; }
.dms-camp { display: flex; flex-direction: column; line-height: 1.2; }
.dms-camp-name { font-size: 14px; font-weight: 600; color: var(--text); }
.dms-camp-sub { font-size: 11px; color: var(--text3); font-family: var(--fm); }
.dms-top-stretch { flex: 1; }

.dms-density { display: flex; border: 1px solid var(--border-hi); border-radius: 8px; overflow: hidden; }
.dms-density-btn {
  padding: 5px 10px; font-size: 11px; font-family: var(--fm); font-weight: 500;
  color: var(--text3); background: transparent; transition: all 0.14s;
}
.dms-density-btn + .dms-density-btn { border-left: 1px solid var(--border); }
.dms-density-btn.active { background: var(--accent-bg); color: var(--accent-l); }
.dms-density-btn:hover:not(.active) { background: var(--surface-hi); color: var(--text); }

.dms-top-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: 8px; text-decoration: none;
  background: var(--surface); border: 1px solid var(--border-hi);
  color: var(--text2); font-size: 12px; font-weight: 500;
  transition: all 0.14s; cursor: pointer; white-space: nowrap;
}
.dms-top-btn:hover { background: var(--surface-hi); border-color: var(--border-hi); color: var(--text); }
.dms-top-btn.active { background: var(--accent-bg); border-color: color-mix(in oklch, var(--accent) 45%, transparent); color: var(--accent-l); }
.dms-top-btn--danger:hover { background: var(--danger-bg); border-color: color-mix(in oklch, var(--danger) 40%, transparent); color: var(--danger); }

/* ── Body ── */
.dms-body { position: relative; z-index: 1; flex: 1; display: flex; overflow: hidden; }

/* ── Palette ── */
.dms-palette {
  width: 248px; flex-shrink: 0;
  background: var(--surface);
  backdrop-filter: blur(28px) saturate(180%);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
  transition: width 0.22s cubic-bezier(0.4,0,0.2,1);
}
.dms-palette.collapsed { width: 48px; }
.dms-palette.collapsed .dms-palette-search,
.dms-palette.collapsed .dms-palette-scroll,
.dms-palette.collapsed .dms-pal-foot { display: none; }

.dms-palette-rail {
  display: none; flex-direction: column; align-items: center;
  padding: 10px 0; gap: 6px; flex: 1;
}
.dms-palette.collapsed .dms-palette-rail { display: flex; }
.dms-palette-collapse {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; color: var(--text3);
  font-size: 11px; cursor: pointer; flex-shrink: 0; transition: all 0.14s;
}
.dms-palette-collapse:hover { background: var(--surface-hi); color: var(--text); }
.dms-palette-rail-btn {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; color: var(--text3);
  font-size: 14px; cursor: pointer; transition: all 0.14s; position: relative;
}
.dms-palette-rail-btn:hover { background: var(--surface-hi); color: var(--text); }
.rail-dot { width: 7px; height: 7px; border-radius: 50%; }
.rail-count {
  position: absolute; top: -2px; right: -2px;
  font-family: var(--fm); font-size: 9px; font-weight: 600;
  color: var(--text3); background: var(--bg2);
  border: 1px solid var(--border); border-radius: 99px; padding: 0 4px; line-height: 1.3;
}
.dms-palette-rail-sep { width: 24px; height: 1px; background: var(--border); margin: 4px 0; }

.dms-palette-search {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 10px 10px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.dms-palette-search-icon { font-size: 13px; color: var(--text3); flex-shrink: 0; }
.dms-palette-search-input {
  flex: 1; background: none; border: none; outline: none;
  font-size: 13px; color: var(--text); font-family: var(--fu);
}
.dms-palette-search-input::placeholder { color: var(--text3); }

.dms-palette-scroll { flex: 1; overflow-y: auto; padding: 6px; }
.dms-palette-scroll::-webkit-scrollbar { width: 4px; }
.dms-palette-scroll::-webkit-scrollbar-thumb { background: var(--border-hi); }

.dms-pal-group { margin-bottom: 4px; }
.dms-pal-group-head {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px 4px; cursor: pointer; user-select: none;
}
.dms-pal-group-arrow { font-size: 9px; color: var(--text3); transition: transform 0.18s; width: 10px; }
.dms-pal-group-arrow.open { transform: rotate(90deg); }
.dms-pal-group-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; opacity: 0.8; }
.dms-pal-group-label { flex: 1; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text2); }
.dms-pal-group-count { font-family: var(--fm); font-size: 10px; color: var(--text3); }

.dms-pal-item {
  display: flex; align-items: center; gap: 9px;
  padding: 5px 10px 5px 22px; border-radius: 6px; cursor: grab;
  transition: background 0.10s; margin: 1px 0; user-select: none;
}
.dms-pal-item:hover { background: var(--surface-hi); }
.dms-pal-item:active { cursor: grabbing; }
.dms-pal-item.pinned { opacity: 0.42; cursor: default; }
.dms-pal-item-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.dms-pal-item-name {
  flex: 1; min-width: 0; font-size: 12.5px; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dms-pal-item-meta { font-family: var(--fm); font-size: 10px; color: var(--text3); flex-shrink: 0; }

.dms-pal-quick { display: flex; flex-direction: column; gap: 2px; padding: 2px 0 0 14px; }
.dms-pal-quick-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 6px; cursor: grab;
  transition: background 0.10s; background: transparent;
  font-size: 12.5px; color: var(--text);
  border: 1px dashed transparent; user-select: none;
}
.dms-pal-quick-btn:hover { background: var(--surface-hi); border-color: var(--border); }
.dms-pal-quick-btn.pinned { opacity: 0.42; cursor: default; }
.dms-pal-quick-icon {
  width: 18px; height: 18px; border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; flex-shrink: 0;
  background: var(--accent-bg); border: 1px solid color-mix(in oklch, var(--accent) 30%, transparent);
  color: var(--accent-l); font-family: var(--fm);
}
.dms-pal-quick-label { flex: 1; }
.dms-pal-empty { padding: 4px 10px 4px 22px; font-size: 11px; color: var(--text3); font-style: italic; }

.dms-pal-foot {
  padding: 10px 14px; border-top: 1px solid var(--border); flex-shrink: 0;
  font-size: 10.5px; color: var(--text3); line-height: 1.5; font-family: var(--fm);
}
.dms-pal-foot kbd {
  background: var(--surface-hi); border: 1px solid var(--border);
  padding: 0 5px; border-radius: 3px; font-size: 10px; color: var(--text2);
}

/* ── Canvas ── */
.dms-canvas {
  flex: 1; overflow-y: auto; overflow-x: hidden; padding: 18px; position: relative;
  background-image: radial-gradient(
    circle at calc(100% - var(--gap, 12px) / 2) calc(100% - var(--gap, 12px) / 2),
    var(--text3) 1.5px, transparent 1.5px
  );
  background-attachment: local;
  background-size:
    calc((100% - 36px + var(--gap, 12px)) / 12)
    calc(var(--row-h, 110px) + var(--gap, 12px));
  background-position: 18px 18px;
}
.dms-canvas.density-compact     { --row-h: 88px;  --gap: 8px; }
.dms-canvas.density-comfortable { --row-h: 110px; --gap: 12px; }
.dms-canvas.density-loose       { --row-h: 140px; --gap: 16px; }
.dms-canvas::-webkit-scrollbar { width: 8px; }
.dms-canvas::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 99px; }

.dms-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: var(--row-h, 110px);
  gap: var(--gap, 12px);
  min-height: 100%;
  position: relative;
}
.dms-grid.density-compact  { --row-h: 88px; --gap: 8px; }
.dms-grid.density-comfortable { --row-h: 110px; --gap: 12px; }
.dms-grid.density-loose    { --row-h: 140px; --gap: 16px; }

.dms-grid.drag-active::before {
  content: ''; position: absolute; inset: 14px; border-radius: 14px;
  border: 1.5px dashed color-mix(in oklch, var(--accent) 55%, transparent);
  background: var(--accent-bg);
  pointer-events: none;
}

/* Empty state */
.dms-empty {
  grid-column: 1 / -1; grid-row: 1 / 4;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; color: var(--text3); text-align: center;
  border: 1.5px dashed var(--border); border-radius: 14px;
}
.dms-empty-icon { font-family: var(--fh); font-size: 36px; font-weight: 700; color: color-mix(in oklch, var(--accent) 55%, transparent); letter-spacing: 0.08em; }
.dms-empty-title { font-family: var(--fh); font-size: 18px; color: var(--text2); letter-spacing: 0.06em; }
.dms-empty-sub { font-size: 13px; line-height: 1.6; max-width: 340px; color: var(--text3); }
.dms-empty-quick { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.dms-empty-quick-btn {
  padding: 6px 14px; border-radius: 99px;
  background: var(--accent-bg); border: 1px solid color-mix(in oklch, var(--accent) 30%, transparent);
  color: var(--accent-l); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.14s;
}
.dms-empty-quick-btn:hover { background: var(--accent-bhi); }

/* Widget cells */
.dms-w {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
  display: flex; flex-direction: column;
  transition: border-color 0.14s, box-shadow 0.14s, transform 0.14s;
  box-shadow: var(--sh);
}
.dms-w:hover { border-color: var(--border-hi); box-shadow: var(--sh-md); }
.dms-w.dragging { opacity: 0.35; transform: scale(0.97); pointer-events: none; }

.dms-drop-preview {
  border: 2px dashed color-mix(in oklch, var(--accent) 65%, transparent);
  border-radius: 12px;
  background: color-mix(in oklch, var(--accent) 8%, transparent);
  pointer-events: none;
  z-index: 0;
  transition: grid-column 0.08s, grid-row 0.08s;
}

/* Widget header */
.dms-w-head {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; flex-shrink: 0;
  background: var(--surface-hi);
  border-bottom: 1px solid var(--border);
  cursor: grab; user-select: none;
}
.dms-w-head:active { cursor: grabbing; }
.dms-w-head-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }
.dms-w-head-kind { font-family: var(--fm); font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.10em; color: var(--text3); }
.dms-w-head-title { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dms-w-head-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; opacity: 0.45; transition: opacity 0.14s; }
.dms-w:hover .dms-w-head-actions { opacity: 1; }
.dms-w-act {
  width: 22px; height: 22px; border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: var(--text3); transition: all 0.12s;
}
.dms-w-act:hover { background: var(--surface-hi); color: var(--text); }
.dms-w-act.del:hover { background: var(--danger-bg); color: var(--danger); }

.dms-w-fill { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.dms-w-missing { padding: 16px; font-size: 12px; color: var(--text3); font-style: italic; }

/* Resize handle */
.dms-w-resize {
  position: absolute; bottom: 0; right: 0;
  width: 22px; height: 22px; cursor: nwse-resize; z-index: 2;
  opacity: 0; transition: opacity 0.14s;
}
.dms-w:hover .dms-w-resize,
.dms-w-resize.active { opacity: 1; }
.dms-w-resize::before {
  content: '';
  position: absolute; bottom: 5px; right: 5px;
  width: 8px; height: 8px;
  border-right: 2px solid color-mix(in oklch, var(--accent) 80%, transparent);
  border-bottom: 2px solid color-mix(in oklch, var(--accent) 80%, transparent);
  border-radius: 0 0 3px 0;
}
.dms-w-resize::after {
  content: '';
  position: absolute; bottom: 9px; right: 9px;
  width: 4px; height: 4px;
  border-right: 1.5px solid color-mix(in oklch, var(--accent) 40%, transparent);
  border-bottom: 1.5px solid color-mix(in oklch, var(--accent) 40%, transparent);
}

/* Prevent text selection and enforce cursor while resizing */
.dms-root.resizing,
.dms-root.resizing * { cursor: nwse-resize !important; user-select: none !important; }
</style>
