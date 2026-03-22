<template>
  <div class="encounter-page" :class="{ 'fog-paint-mode': activeTool === 'fog' }">

    <!-- ── Top toolbar ─────────────────────────────────────────────────────── -->
    <header class="encounter-toolbar">
      <div class="toolbar-left">
        <NuxtLink :to="`/campaign/${encounter?.campaignId}/encounters`" class="pill-btn">
          <OhVueIcon name="md-arrowback" scale="0.85" /> Back
        </NuxtLink>
        <div class="encounter-title">
          <span class="font-display text-forge-accent">{{ encounter?.name }}</span>
        </div>
      </div>

      <!-- Tool selector -->
      <div class="toolbar-tools">
        <button v-for="tool in tools" :key="tool.id" class="tool-btn" :class="{ active: activeTool === tool.id }"
          :title="tool.label" @click="activeTool = tool.id">
          <OhVueIcon :name="tool.icon" scale="1.1" />
        </button>
      </div>

      <div class="toolbar-right">
        <!-- Player window toggle -->
        <Button :severity="playerWindowOpen ? undefined : 'secondary'" @click="togglePlayerWindow">
          <template #icon>
            <OhVueIcon name="md-desktopmac" scale="0.9" />
          </template>
          {{ playerWindowOpen ? 'Close Player View' : 'Open Player View' }}
        </Button>
      </div>
    </header>

    <!-- ── Main layout ─────────────────────────────────────────────────────── -->
    <div class="encounter-layout">

      <!-- Left sidebar: Token library -->
      <aside class="encounter-sidebar left-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-header">
            <span class="f-label">Token Library</span>
            <Button severity="secondary" size="small" @click="showAddToken = true">
              <template #icon>
                <OhVueIcon name="md-add" scale="0.8" />
              </template>Add
            </Button>
          </div>

          <div class="token-search">
            <InputText v-model="tokenSearch" placeholder="Search tokens…" />
          </div>

          <!-- Draggable token list -->
          <div class="token-list">
            <div v-for="token in filteredLibrary" :key="token.id" class="token-chip" draggable="true"
              @dragstart="onTokenDragStart($event, token)">
              <div class="token-thumb">
                <img v-if="token.imageSource" :src="getImageUrl(token)"
                  class="w-full h-full object-cover rounded-full" />
                <span v-else class="font-display text-forge-accent text-sm">{{ token.name.charAt(0) }}</span>
              </div>
              <span class="text-sm text-forge-text truncate flex-1">{{ token.name }}</span>
              <button class="icon-btn-sq icon-btn-sq--danger" @click.stop="removeFromLibrary(token.id)">
                <OhVueIcon name="md-close" scale="0.75" />
              </button>
            </div>
            <p v-if="filteredLibrary.length === 0" class="text-forge-muted text-sm text-center py-4">
              No tokens yet
            </p>
          </div>
        </div>

        <!-- Grid settings -->
        <div class="sidebar-section">
          <div class="sidebar-header">
            <span class="f-label">Grid Settings</span>
          </div>
          <div class="space-y-2">
            <label class="f-label">Cell Size (px)</label>
            <input type="range" min="1" max="200" step="1" :value="encounter?.gridSize ?? 70"
              class="w-full accent-forge-accent" @input="onGridSizeChange" />
            <div class="flex justify-between text-xs text-forge-muted font-ui">
              <span>1px</span>
              <span class="text-forge-text">{{ encounter?.gridSize ?? 70 }}px</span>
              <span>200px</span>
            </div>

            <label class="f-label mt-2">Offset X</label>
            <InputText type="number" :value="encounter?.gridOffsetX ?? 0" @change="onOffsetChange('x', $event)" />
            <label class="f-label">Offset Y</label>
            <InputText type="number" :value="encounter?.gridOffsetY ?? 0" @change="onOffsetChange('y', $event)" />

            <Button severity="secondary" style="width:100%;justify-content:center;margin-top:6px" @click="onSetMap">
              <OhVueIcon name="md-map" scale="0.85" />
              Load Map
            </Button>
          </div>
        </div>
      </aside>

      <!-- Centre: PixiJS Canvas -->
      <main class="encounter-canvas-wrapper" @dragover.prevent @drop="onCanvasDrop">
        <div id="pixi-canvas" ref="canvasContainer" class="w-full h-full" />

        <!-- Drop hint when no map -->
        <div v-if="!encounter?.mapSource" class="canvas-empty-state">
          <OhVueIcon name="md-map" scale="4" class="text-forge-muted mb-4" />
          <p class="text-forge-muted font-body text-lg">Drop a map image here or use the sidebar to load one</p>
        </div>
      </main>

      <!-- Right sidebar: Selected token / encounter tokens -->
      <aside class="encounter-sidebar right-sidebar">
        <!-- Active encounter tokens -->
        <div class="sidebar-section flex-1 overflow-y-auto">
          <div class="sidebar-header">
            <span class="f-label">On Map ({{ encounterTokens.length }})</span>
          </div>
          <div class="space-y-1">
            <div v-for="token in sortedEncounterTokens" :key="token.id" class="encounter-token-row"
              @click="selectToken(token)">
              <div class="token-thumb-sm">
                <img v-if="token.imageSource" :src="getImageUrl(token)"
                  class="w-full h-full object-cover rounded-full" />
                <span v-else class="font-display text-forge-accent text-xs">{{ token.name.charAt(0) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-forge-text truncate">{{ token.label || token.name }}</div>
                <div class="flex items-center gap-1.5">
                  <span v-if="token.hpMax" class="text-xs text-forge-muted font-ui">
                    HP {{ token.hpCurrent }}/{{ token.hpMax }}
                  </span>
                </div>
              </div>
              <div class="flex gap-1">
                <button class="icon-btn-sq" :title="token.isVisible ? 'Hide from players' : 'Show to players'"
                  @click.stop="store.updateToken(token.id, { isVisible: !token.isVisible })">
                  <OhVueIcon :name="token.isVisible ? 'md-visibility' : 'md-visibilityoff'" scale="0.85" />
                </button>
                <button class="icon-btn-sq" :title="token.isDead ? 'Mark alive' : 'Mark dead'"
                  :class="token.isDead ? 'icon-btn-sq--danger' : ''"
                  @click.stop="store.updateToken(token.id, { isDead: !token.isDead })">
                  <OhVueIcon name="fa-skull-crossbones" scale="0.85" />
                </button>
                <button class="icon-btn-sq icon-btn-sq--danger" @click.stop="store.removeToken(token.id)">
                  <OhVueIcon name="md-delete" scale="0.85" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected token detail panel -->
        <div v-if="selectedToken" class="sidebar-section border-t border-forge-border">
          <div class="sidebar-header">
            <span class="f-label">Selected Token</span>
            <Button severity="secondary" size="small" @click="selectedToken = null">✕</Button>
          </div>
          <div class="space-y-2 text-sm">
            <div>
              <label class="f-label">Label</label>
              <InputText :value="selectedToken.label || selectedToken.name"
                @change="store.updateToken(selectedToken!.id, { label: ($event.target as HTMLInputElement).value })" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="f-label">HP Current</label>
                <InputText type="number" :value="selectedToken.hpCurrent"
                  @change="store.updateToken(selectedToken!.id, { hpCurrent: Number(($event.target as HTMLInputElement).value) })" />
              </div>
              <div>
                <label class="f-label">HP Max</label>
                <InputText type="number" :value="selectedToken.hpMax"
                  @change="store.updateToken(selectedToken!.id, { hpMax: Number(($event.target as HTMLInputElement).value) })" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="f-label">Initiative</label>
                <InputText type="number" :value="selectedToken.initiative"
                  @change="store.updateToken(selectedToken!.id, { initiative: Number(($event.target as HTMLInputElement).value) })" />
              </div>
              <div>
                <label class="f-label">Size (tiles)</label>
                <Select :model-value="selectedToken.size" :options="tokenSizeOptions" option-label="label"
                  option-value="value" @update:model-value="store.updateToken(selectedToken!.id, { size: $event })" />
              </div>
            </div>

            <!-- Conditions -->
            <div>
              <label class="f-label block mb-1.5">Conditions</label>

              <!-- Active conditions -->
              <div class="flex flex-wrap gap-1 mb-2">
                <div v-for="(cond, idx) in selectedToken.conditions" :key="idx" class="condition-tag">
                  <span>{{ cond.name }}</span>
                  <div v-if="cond.value !== null" class="condition-value-controls">
                    <button class="cond-ctrl-btn" @click="adjustConditionValue(idx, -1)">−</button>
                    <span>{{ cond.value }}</span>
                    <button class="cond-ctrl-btn" @click="adjustConditionValue(idx, 1)">+</button>
                  </div>
                  <button class="condition-remove" @click="removeCondition(idx)">✕</button>
                </div>
                <span v-if="selectedToken.conditions.length === 0" class="text-forge-muted text-xs italic">None</span>
              </div>

              <!-- Add condition -->
              <div class="flex gap-2">
                <AutoComplete v-model="newConditionName" :suggestions="filteredConditions" placeholder="Condition name…"
                  @complete="searchConditions" @keyup.enter="addCondition" />
                <InputNumber v-model.number="newConditionValue" min="1" class="w-20" />
                <Button severity="secondary" size="small" @click="addCondition">+</Button>
              </div>
              <p class="text-xs text-forge-muted font-ui">Leave value empty for conditions without a degree.</p>
            </div>

            <!-- Notes -->
            <div>
              <label class="f-label">Notes</label>
              <Textarea :value="selectedToken.notes || ''" placeholder="Anything to remember…" :rows="3"
                @change="store.updateToken(selectedToken!.id, { notes: ($event.target as HTMLTextAreaElement).value })" />
            </div>
          </div>
        </div>

        <!-- Fog controls -->
        <div class="sidebar-section border-t border-forge-border">
          <div class="sidebar-header">
            <span class="f-label">Fog of War</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <Button severity="secondary" size="small" style="width:100%;justify-content:center"
              @click="store.hideAllFog()">
              <OhVueIcon name="md-cloud" scale="0.85" />
              Hide All
            </Button>
            <Button severity="secondary" size="small" style="width:100%;justify-content:center"
              @click="store.revealAllFog()">
              <OhVueIcon name="md-sunny" scale="0.85" /> Reveal All
            </Button>
          </div>
          <p class="text-xs text-forge-muted mt-2 font-ui leading-relaxed">
            Select the fog tool and click/paint cells to toggle visibility.
          </p>
        </div>
      </aside>
    </div>

    <!-- ── Add Token Modal ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showAddToken" class="modal-overlay" @click.self="showAddToken = false">
        <div class="modal-box">
          <h2 class="font-display text-forge-accent text-lg mb-4">Add Token to Library</h2>
          <div class="space-y-3">
            <div>
              <label class="f-label">Name</label>
              <InputText v-model="newToken.name" placeholder="Goblin, Wizard, etc." autofocus />
            </div>
            <div>
              <label class="f-label">Image</label>
              <div class="flex gap-2">
                <InputText v-model="newToken.imageSource" placeholder="URL or file path" class="flex-1" />
                <Button class="icon-btn-sq" @click="browseTokenImage">
                  <OhVueIcon name="fa-folder-open" scale="0.9" />
                </Button>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <Button severity="secondary" @click="showAddToken = false">Cancel</Button>
            <Button @click="confirmAddToken">Add Token</Button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { useEncounterStore } from '~/stores/encounter'
import { useEncounterCanvas } from '~/composables/useEncounterCanvas'

const route = useRoute()
const store = useEncounterStore()
const canvasContainer = ref<HTMLElement | null>(null)

const activeTool = ref<'select' | 'fog' | 'measure'>('select')

const tokenSizeOptions = [
  { label: '1×1 (medium)', value: 1 },
  { label: '2×2 (large)', value: 2 },
  { label: '3×3 (huge)', value: 3 },
  { label: '4×4 (gargantuan)', value: 4 },
]
const selectedToken = ref<any>(null)
const showAddToken = ref(false)
const tokenSearch = ref('')
const newToken = ref({ name: '', imageSource: '', imageType: 'file' as 'file' | 'url' })

const tools = [
  { id: 'select', icon: 'md-shield', label: 'Select / Move' },
  { id: 'fog', icon: 'md-cloud', label: 'Fog of War' },
]

const encounter = computed(() => store.current)
const encounterTokens = computed(() => store.allTokens)
const sortedEncounterTokens = computed(() =>
  store.allTokens.sort((a, b) => {
    // Tokens with initiative set come first, sorted descending
    if (a.initiative === null && b.initiative === null) return 0
    if (a.initiative === null) return 1
    if (b.initiative === null) return -1
    return b.initiative - a.initiative
  })
)
const playerWindowOpen = computed(() => store.playerWindowOpen)
const filteredLibrary = computed(() =>
  store.tokenLibrary.filter(t =>
    t.name.toLowerCase().includes(tokenSearch.value.toLowerCase())
  )
)

let canvas: ReturnType<typeof useEncounterCanvas> | null = null

const newConditionName = ref('')
const newConditionValue = ref<number | null>(null)
const filteredConditions = ref<string[]>([])

function searchConditions(event: { query: string }) {
  const q = event.query.toLowerCase()
  filteredConditions.value = q
    ? conditionSuggestions.filter(c => c.toLowerCase().includes(q))
    : [...conditionSuggestions]
}

const conditionSuggestions = [
  'Blinded', 'Broken', 'Clumsy', 'Confused', 'Controlled', 'Dazzled',
  'Deafened', 'Doomed', 'Drained', 'Dying', 'Encumbered', 'Enfeebled',
  'Fascinated', 'Fatigued', 'Flat-Footed', 'Fleeing', 'Frightened',
  'Grabbed', 'Hidden', 'Immobilized', 'Invisible', 'Observed',
  'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Quickened',
  'Restrained', 'Sickened', 'Slowed', 'Stunned', 'Stupefied',
  'Unconscious', 'Undetected', 'Unnoticed', 'Wounded',
]

function addCondition() {
  if (!selectedToken.value || !newConditionName.value.trim()) return
  const current = [...selectedToken.value.conditions]
  current.push({
    name: newConditionName.value.trim(),
    value: newConditionValue.value ?? null,
  })
  store.updateToken(selectedToken.value.id, { conditions: current })
  newConditionName.value = ''
  newConditionValue.value = null
}

function removeCondition(idx: number) {
  if (!selectedToken.value) return
  const current = [...selectedToken.value.conditions]
  current.splice(idx, 1)
  store.updateToken(selectedToken.value.id, { conditions: current })
}

function adjustConditionValue(idx: number, delta: number) {
  if (!selectedToken.value) return
  const current = [...selectedToken.value.conditions].map(c => ({ ...c }))
  const cond = current[idx]
  if (cond.value === null) return
  cond.value = cond.value + delta
  if (cond.value <= 0) {
    current.splice(idx, 1)
  }
  store.updateToken(selectedToken.value.id, { conditions: current })
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  const id = Number(route.params.id)
  await store.loadEncounter(id)
  await store.loadTokenLibrary()

  if (!canvasContainer.value) return

  canvas = useEncounterCanvas({
    container: canvasContainer.value,
    isDmMode: true,
    getActiveTool: () => activeTool.value,
    onTokenMoved: (instanceId, gridX, gridY) => {
      store.moveToken(instanceId, gridX, gridY)
    },
    onFogToggle: (cellKey, newState) => {
      store.setFogCell(cellKey, newState)
      canvas?.redrawFog()
    },
  })

  await canvas.init()

  if (store.current?.mapSource) {
    await canvas.loadMap(store.current.mapSource, store.current.mapType)
  }
  await canvas.renderTokens()

  // Listen for player window close
  window.dmforge.window.onPlayerClosed(() => {
    store.playerWindowOpen = false
  })
})

watch(() => store.current?.mapSource, async (src, old) => {
  if (src && src !== old && canvas) {
    await canvas.loadMap(src, store.current!.mapType)
  }
})

watch(() => store.current?.tokens, async () => {
  await canvas?.renderTokens()
}, { deep: true })

watch(() => store.current?.fogData, () => {
  canvas?.redrawFog()
}, { deep: true })

watch(() => [store.current?.gridSize, store.current?.gridOffsetX, store.current?.gridOffsetY], () => {
  canvas?.drawGrid()
  canvas?.redrawFog()
})

onUnmounted(() => canvas?.destroy())

// ── Handlers ───────────────────────────────────────────────────────────────
async function onSetMap() {
  const dataUrl = await window.dmforge.system.openFileDialog()
  if (dataUrl) await store.setMap(dataUrl, 'file')
}

async function onGridSizeChange(e: Event) {
  const size = Number((e.target as HTMLInputElement).value)
  const enc = store.current
  if (!enc) return
  await store.updateGrid(size, enc.gridOffsetX, enc.gridOffsetY)
}

async function onOffsetChange(axis: 'x' | 'y', e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  const enc = store.current
  if (!enc) return
  if (axis === 'x') await store.updateGrid(enc.gridSize, val, enc.gridOffsetY)
  else await store.updateGrid(enc.gridSize, enc.gridOffsetX, val)
}

let draggingTokenId: number | null = null
function onTokenDragStart(e: DragEvent, token: any) {
  draggingTokenId = token.id
  e.dataTransfer?.setData('tokenId', String(token.id))
}

async function onCanvasDrop(e: DragEvent) {
  if (!canvas || draggingTokenId === null) return
  const { gridX, gridY } = canvas.getGridPosFromScreen(e.offsetX, e.offsetY)
  await store.addTokenToEncounter(draggingTokenId, gridX, gridY)
  draggingTokenId = null
}

async function togglePlayerWindow() {
  if (playerWindowOpen.value) await store.closePlayerWindow()
  else await store.openPlayerWindow()
}

function selectToken(token: any) {
  selectedToken.value = token
}

async function browseTokenImage() {
  const dataUrl = await window.dmforge.system.openFileDialog()
  if (dataUrl) {
    newToken.value.imageSource = dataUrl
    newToken.value.imageType = 'file'
  }
}

async function confirmAddToken() {
  if (!newToken.value.name.trim()) return
  const type = newToken.value.imageSource.startsWith('http') ? 'url' : 'file'  // data: URLs are stored as 'file' type
  await store.addToLibrary(newToken.value.name, newToken.value.imageSource || null, type)
  newToken.value = { name: '', imageSource: '', imageType: 'file' }
  showAddToken.value = false
}

async function removeFromLibrary(id: number) {
  await window.dmforge.tokens.delete(id)
  store.tokenLibrary = store.tokenLibrary.filter(t => t.id !== id)
}

function getImageUrl(token: any): string {
  if (!token.imageSource) return ''
  if (token.imageType === 'url') return token.imageSource
  return `${token.imageSource}`
}
</script>

<style scoped>
.encounter-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
}

.encounter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  height: 60px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-tools {
  display: flex;
  gap: 4px;
}

.encounter-title {
  padding: 4px 12px;
  border-left: 1px solid var(--border);
  font-weight: 600;
}

.encounter-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.encounter-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--card);
  overflow-y: auto;
}

.left-sidebar {
  border-right: 1px solid var(--border);
}

.right-sidebar {
  border-left: 1px solid var(--border);
}

.sidebar-section {
  padding: 12px;
  border-bottom: 1px solid var(--border);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.token-search {
  margin-bottom: 8px;
}

.encounter-canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #080808;
}

.canvas-empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.token-thumb {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--forge-raised);
  border: 1px solid var(--forge-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.token-thumb-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--forge-raised);
  border: 1px solid var(--forge-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.encounter-token-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
}

.encounter-token-row:hover {
  background: var(--forge-raised);
}

.encounter-token-row.dead {
  opacity: 0.45;
}

.encounter-token-row.invisible {
  opacity: 0.6;
}

.icon-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--forge-muted);
  cursor: pointer;
  border-radius: 5px;
  transition: color 0.15s;
  background: none;
  border: none;
}

.icon-btn:hover {
  color: var(--forge-text);
}

.fog-paint-mode .encounter-canvas-wrapper {
  cursor: crosshair;
}

/* Conditions */
.condition-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(224, 85, 85, 0.1);
  border: 1px solid rgba(224, 85, 85, 0.3);
  color: #f08080;
  font-size: 11px;
  font-family: 'DM Sans', sans-serif;
}

.condition-value-controls {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.condition-value-controls button {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 2px;
  color: #f08080;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 0;
}

.condition-value-controls button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.condition-remove {
  background: none;
  border: none;
  color: #f08080;
  cursor: pointer;
  opacity: 0.55;
  padding: 0;
  font-size: 10px;
  line-height: 1;
}

.condition-remove:hover {
  opacity: 1;
}

/* Add token modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-box {
  background: var(--forge-surface);
  border: 1px solid var(--forge-border-l);
  border-radius: var(--r);
  padding: 24px;
  width: 400px;
  max-width: 90vw;
  animation: slideUp 0.2s ease-out;
}

.cond-ctrl-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.07);
  border: none;
  border-radius: 3px;
  color: #f08080;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 0;
  transition: background 0.1s;
}

.cond-ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>