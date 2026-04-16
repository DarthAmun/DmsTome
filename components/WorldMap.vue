<template>
  <div class="world-map-shell" :class="{ 'player-mode': playerMode }">
    <!-- Breadcrumb nav (DM only) -->
    <div v-if="!playerMode" class="map-breadcrumb">
      <button
        v-for="(crumb, i) in breadcrumb" :key="crumb.id"
        class="crumb-btn"
        :class="{ active: i === breadcrumb.length - 1 }"
        @click="navigateToCrumb(i)"
      >
        <OhVueIcon :name="crumb.icon" scale="0.8" />
        {{ crumb.name }}
      </button>
      <span v-if="breadcrumb.length === 0" class="crumb-hint">World Map</span>
    </div>

    <!-- Toolbar (DM only) -->
    <div v-if="!playerMode" class="map-toolbar">
      <span class="map-name">{{ currentMapName }}</span>
      <div class="toolbar-gap" />
      <Button severity="secondary" size="small" @click="openLoadMap">
        <template #icon><OhVueIcon name="md-map" scale="0.85" /></template>
        {{ mapImageUrl ? 'Change Map' : 'Load Map Image' }}
      </Button>
      <Button
        :severity="pinMode ? undefined : 'secondary'"
        size="small"
        :title="pinMode ? 'Click on the map to place a pin' : 'Enable pin placement'"
        @click="pinMode = !pinMode; selectedEntityForPin = null"
      >
        <template #icon><OhVueIcon name="gi-all-seeing-eye" scale="0.85" /></template>
        {{ pinMode ? 'Cancel Pin' : 'Add Pin' }}
      </Button>
      <Button severity="secondary" size="small" title="Open player map view" @click="openPlayerView">
        <template #icon><OhVueIcon name="md-openinnew" scale="0.85" /></template>
        Player View
      </Button>
    </div>

    <!-- Pin entity picker (DM only, shown when pinMode is active) -->
    <div v-if="!playerMode && pinMode" class="pin-picker">
      <div class="pin-picker-top">
        <div class="pin-search-wrap">
          <OhVueIcon name="fa-search" scale="0.8" style="color:var(--ink-ghost)" />
          <input v-model="pinSearch" class="pin-search-input" placeholder="Search entities…" autofocus />
        </div>
        <span v-if="selectedEntityForPin" class="pin-selected-label">
          Placing: <strong>{{ selectedEntityForPin.name }}</strong> — click map
        </span>
        <span v-else class="pin-selected-label" style="color:var(--ink-ghost)">Select an entity, then click the map</span>
        <button class="pin-cancel-btn" @click="pinMode = false; selectedEntityForPin = null; pinSearch = ''">
          <OhVueIcon name="md-close" scale="0.9" />
        </button>
      </div>
      <div class="pin-picker-list">
        <button
          v-for="e in filteredPinEntities"
          :key="e.id"
          class="pin-entity-btn"
          :class="{ selected: selectedEntityForPin?.id === e.id }"
          :style="{ borderColor: entityColor(e.type) + (selectedEntityForPin?.id === e.id ? 'cc' : '33') }"
          @click="selectedEntityForPin = e"
        >
          <div class="pin-entity-avatar" :style="{ background: pinImage(e.id) ? entityColor(e.type) + '22' : entityColor(e.type) + '99' }">
            <img v-if="pinImage(e.id)" :src="pinImage(e.id)!" class="w-full h-full object-cover" style="border-radius:50%" />
            <OhVueIcon v-else :name="entityIcon(e.type)" scale="0.75" :style="{ color: '#fff' }" />
          </div>
          <div class="pin-entity-info">
            <span class="pin-entity-name">{{ e.name }}</span>
            <span class="pin-entity-type" :style="{ color: entityColor(e.type) }">{{ e.type }}</span>
          </div>
        </button>
        <span v-if="filteredPinEntities.length === 0" style="color:var(--ink-ghost);font-size:12px;padding:4px 8px">No matches</span>
      </div>
    </div>

    <!-- Map canvas area -->
    <div class="map-canvas-wrap" ref="canvasWrap">
      <div
        v-if="mapImageUrl"
        class="map-image-container"
        :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }"
        @mousedown="onMapMouseDown"
        @wheel.prevent="onWheel"
        @click="onMapClick"
      >
        <img
          ref="mapImg"
          :src="mapImageUrl"
          class="map-image"
          draggable="false"
          @load="onImageLoad"
        />

        <!-- Pins -->
        <div
          v-for="pin in renderedPins" :key="pin.entityId"
          class="map-pin"
          :class="{ 'map-pin--hidden': pin.hidden && !playerMode }"
          :style="{
            left: pin.x * imgNaturalW + 'px',
            top:  pin.y * imgNaturalH + 'px',
            transform: `translate(-50%, -100%) scale(${1 / zoom})`,
            borderColor: entityColor(pinEntity(pin.entityId)?.type ?? 'note'),
          }"
          @click.stop="openPinPreview(pin)"
          @contextmenu.prevent="!playerMode && removePin(pin.entityId)"
        >
          <div class="pin-avatar"
            :style="{ background: pinImage(pin.entityId) ? entityColor(pinEntity(pin.entityId)?.type ?? 'note') + '22' : entityColor(pinEntity(pin.entityId)?.type ?? 'note') + '99' }">
            <img v-if="pinImage(pin.entityId)" :src="pinImage(pin.entityId)!" class="pin-avatar-img" />
            <OhVueIcon v-else :name="entityIcon(pinEntity(pin.entityId)?.type ?? 'note')" scale="0.8"
              :style="{ color: '#fff' }" />
          </div>
          <div class="pin-label">{{ pinEntity(pin.entityId)?.name }}</div>
          <!-- Hidden indicator (DM only) -->
          <div v-if="pin.hidden && !playerMode" class="pin-hidden-badge" title="Hidden from players">
            <OhVueIcon name="md-visibilityoff" scale="0.65" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="map-empty">
        <OhVueIcon name="gi-treasure-map" scale="4" style="opacity:0.15;margin-bottom:16px" />
        <p style="color:var(--ink-faded);font-size:14px;margin-bottom:16px">No map image loaded</p>
        <Button @click="openLoadMap">
          <template #icon><OhVueIcon name="md-map" scale="0.85" /></template>
          Load Map Image
        </Button>
      </div>
    </div>

    <!-- Pin preview popup -->
    <div v-if="previewPin" class="pin-preview-overlay" @click.self="previewPin = null">
      <div class="pin-preview">
        <!-- Image banner -->
        <div v-if="pinPreviewImageUrl" class="pin-preview-banner">
          <img :src="pinPreviewImageUrl" class="w-full h-full object-cover" />
        </div>
        <div class="pin-preview-body">
          <div class="pin-preview-type" :style="{ color: entityColor(previewEntity?.type ?? 'note') }">
            {{ previewEntity?.type }}
          </div>
          <h3 class="pin-preview-name">{{ previewEntity?.name }}</h3>
          <div v-if="previewAttrs.title" class="pin-preview-sub">{{ previewAttrs.title }}</div>
          <div v-if="previewAttrs.role" class="pin-preview-sub">{{ previewAttrs.role }}</div>
          <div v-if="previewAttrs.locationType" class="pin-preview-sub capitalize">{{ previewAttrs.locationType }}</div>
          <div v-if="previewAttrs.status" class="pin-preview-status">{{ previewAttrs.status }}</div>
          <div v-if="previewLinks.length > 0" class="pin-preview-links">
            <button
              v-for="link in previewLinks" :key="`${link.type}:${link.name}`"
              class="pin-link-chip"
              :style="{ borderColor: entityColor(link.type) + '55' }"
              @click="navigatePinLink(link.type, link.name)"
            >
              <OhVueIcon :name="entityIcon(link.type)" scale="0.7" :style="{ color: entityColor(link.type), flexShrink: 0 }" />
              <span>{{ link.name }}</span>
              <span class="pin-link-type">{{ link.type }}</span>
            </button>
          </div>
          <div class="pin-preview-actions">
            <Button v-if="!playerMode" size="small" severity="secondary" @click="$emit('navigate-entity', previewEntity!); previewPin = null">
              <template #icon><OhVueIcon name="md-editnote" scale="0.85" /></template>
              Open Note
            </Button>
            <!-- Drill-down: only for locations with a map image (DM only) -->
            <Button
              v-if="!playerMode && canDrillDown"
              size="small"
              @click="drillDown"
            >
              <template #icon><OhVueIcon name="md-map" scale="0.85" /></template>
              Open Map
            </Button>
            <!-- Visibility toggle (DM only) -->
            <button
              v-if="!playerMode"
              class="pin-visibility-btn"
              :class="{ 'pin-visibility-btn--hidden': previewPin?.hidden }"
              :title="previewPin?.hidden ? 'Show to players' : 'Hide from players'"
              @click="togglePinVisibility(previewPin!.entityId)"
            >
              <OhVueIcon :name="previewPin?.hidden ? 'md-visibility' : 'md-visibilityoff'" scale="0.85" />
            </button>
            <button v-if="!playerMode" class="pin-remove-btn" title="Remove pin" @click="removePin(previewPin!.entityId); previewPin = null">
              <OhVueIcon name="md-delete" scale="0.85" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotesStore } from '~/stores/notes'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import { extractLinks } from '~/composables/useEntityParser'
import type { MapPin } from '~/types/entities'

const props = defineProps<{
  campaignId: number
  rootLocationId?: number | null
  // Stack of previous location IDs for breadcrumb — managed by parent via router
  locationStack?: number[]
  // When true: hides DM controls and only renders visible pins
  playerMode?: boolean
}>()

const emit = defineEmits<{
  'navigate-entity': [entity: any]
  'drill-down': [fromId: number, toId: number]
  'navigate-crumb': [index: number]
}>()

const store = useNotesStore()

// Breadcrumb is derived from locationStack prop
const breadcrumb = computed<{ id: number; name: string; icon: string }[]>(() => {
  if (!props.locationStack?.length) return []
  return props.locationStack.map(id => {
    const e = store.entities.find(en => en.id === id)
    return {
      id,
      name: e?.name ?? '?',
      icon: entityIcon(e?.type ?? 'location'),
    }
  })
})

// currentLocationId is always the rootLocationId prop — parent controls it
const currentLocationId = computed<number | null>(() => props.rootLocationId ?? null)

const currentMap = computed(() => {
  if (!currentLocationId.value) return null
  return store.entities.find(e => e.id === currentLocationId.value) ?? null
})

const currentMapName = computed(() => currentMap.value?.name ?? 'World Map')

const currentPins = computed<MapPin[]>(() => {
  const attrs = currentMap.value?.attributes as any
  return attrs?.mapPins ?? []
})

// Player only sees visible pins; DM sees all (hidden ones rendered dimmed)
const renderedPins = computed<MapPin[]>(() =>
  props.playerMode ? currentPins.value.filter(p => !p.hidden) : currentPins.value
)

async function togglePinVisibility(entityId: number) {
  if (!currentMap.value) return
  const attrs = { ...(currentMap.value.attributes as any) }
  attrs.mapPins = (attrs.mapPins ?? []).map((p: MapPin) =>
    p.entityId === entityId ? { ...p, hidden: !p.hidden } : p
  )
  await store.updateEntity(currentMap.value.id, { attributes: attrs })
  // Notify player window of the data change so it can refresh
  if (!props.playerMode) window.dmforge.window.syncMap(currentLocationId.value)
}

const mapImageUrl = computed(() => {
  const attrs = currentMap.value?.attributes as any
  if (!attrs?.imageSource) return ''
  return attrs.imageType === 'url' ? attrs.imageSource : `${attrs.imageSource}`
})

const imgNaturalW = ref(800)
const imgNaturalH = ref(600)
const mapImg = ref<HTMLImageElement | null>(null)
const canvasWrap = ref<HTMLElement | null>(null)

function onImageLoad() {
  imgNaturalW.value = mapImg.value?.naturalWidth ?? 800
  imgNaturalH.value = mapImg.value?.naturalHeight ?? 600
  fitMap()
}

function fitMap() {
  const wrap = canvasWrap.value
  if (!wrap || !imgNaturalW.value || !imgNaturalH.value) return
  const ww = wrap.clientWidth
  const wh = wrap.clientHeight
  const scaleX = ww / imgNaturalW.value
  const scaleY = wh / imgNaturalH.value
  const fit = Math.min(scaleX, scaleY, 1) // never scale up beyond 1x
  zoom.value = fit
  // Center the image in the viewport
  pan.value = {
    x: (ww - imgNaturalW.value * fit) / 2,
    y: (wh - imgNaturalH.value * fit) / 2,
  }
}

// Pan + zoom
const pan = ref({ x: 0, y: 0 })
const zoom = ref(1)
let isPanning = false
let hasMoved = false
let panStart = { x: 0, y: 0 }

function onWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const oldZoom = zoom.value
  const newZoom = Math.min(Math.max(oldZoom * delta, 0.15), 8)
  if (newZoom === oldZoom) return
  // Zoom toward the cursor position:
  // mouse position relative to the canvas wrapper
  const wrap = canvasWrap.value
  if (!wrap) { zoom.value = newZoom; return }
  const rect = wrap.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  // Adjust pan so the point under the cursor stays fixed
  pan.value = {
    x: mouseX - (mouseX - pan.value.x) * (newZoom / oldZoom),
    y: mouseY - (mouseY - pan.value.y) * (newZoom / oldZoom),
  }
  zoom.value = newZoom
}

function onMapMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  isPanning = true
  hasMoved = false
  panStart = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e: MouseEvent) {
  if (!isPanning) return
  hasMoved = true
  pan.value = { x: e.clientX - panStart.x, y: e.clientY - panStart.y }
}
function onMouseUp() {
  isPanning = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// Pin placement
const pinMode = ref(false)
const selectedEntityForPin = ref<any>(null)
const pinSearch = ref('')

const filteredPinEntities = computed(() => {
  const all = store.entities.filter(e => e.campaignId === props.campaignId)
  const q = pinSearch.value.toLowerCase().trim()
  const filtered = q ? all.filter(e => e.name.toLowerCase().includes(q) || e.type.includes(q)) : all
  // Sort by updatedAt descending, show top 20 when no search
  return filtered
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, q ? 50 : 20)
})

function onMapClick(e: MouseEvent) {
  if (hasMoved) return  // was a pan drag, not a click
  if (!pinMode.value || !selectedEntityForPin.value) return
  // coords relative to the image container (already accounts for transform via CSS)
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = (e.clientX - rect.left) / (imgNaturalW.value * zoom.value)
  const y = (e.clientY - rect.top) / (imgNaturalH.value * zoom.value)
  addPin(selectedEntityForPin.value.id, Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)))
  pinMode.value = false
  selectedEntityForPin.value = null
}

async function addPin(entityId: number, x: number, y: number) {
  if (!currentMap.value) return
  const attrs = { ...(currentMap.value.attributes as any) }
  const pins: MapPin[] = [...(attrs.mapPins ?? [])]
  // Remove existing pin for same entity
  const idx = pins.findIndex(p => p.entityId === entityId)
  if (idx >= 0) pins.splice(idx, 1)
  pins.push({ entityId, x, y })
  attrs.mapPins = pins
  await store.updateEntity(currentMap.value.id, { attributes: attrs })
}

async function removePin(entityId: number) {
  if (!currentMap.value) return
  const attrs = { ...(currentMap.value.attributes as any) }
  attrs.mapPins = (attrs.mapPins ?? []).filter((p: MapPin) => p.entityId !== entityId)
  await store.updateEntity(currentMap.value.id, { attributes: attrs })
}

// Pin preview
const previewPin = ref<MapPin | null>(null)
const previewEntity = computed(() => previewPin.value ? store.entities.find(e => e.id === previewPin.value!.entityId) : null)
const previewAttrs = computed(() => (previewEntity.value?.attributes ?? {}) as any)
const pinPreviewImageUrl = computed(() => {
  const attrs = previewAttrs.value
  // Locations: prefer logo banner; NPCs: portrait; others: imageSource
  const src = attrs.logoSource || attrs.portraitSource || (previewEntity.value?.type !== 'location' ? attrs.imageSource : null)
  if (!src) return null
  return src
})
const previewLinks = computed(() => {
  const content = previewEntity.value?.content ?? ''
  return extractLinks(content)
})

const canDrillDown = computed(() => {
  if (!previewEntity.value) return false
  if (previewEntity.value.type !== 'location') return false
  const attrs = previewAttrs.value
  return !!attrs.imageSource  // location must have a dedicated map image
})

function navigatePinLink(type: string, name: string) {
  const entity = store.entities.find(e => e.type === type && e.name.toLowerCase() === name.toLowerCase())
  if (entity) {
    emit('navigate-entity', entity)
    previewPin.value = null
  }
}

function openPinPreview(pin: MapPin) {
  previewPin.value = pin
}

function drillDown() {
  if (!previewEntity.value || !currentLocationId.value) return
  emit('drill-down', currentLocationId.value, previewEntity.value.id)
  pan.value = { x: 0, y: 0 }
  zoom.value = 1
  previewPin.value = null
}

function navigateToCrumb(i: number) {
  emit('navigate-crumb', i)
  pan.value = { x: 0, y: 0 }
  zoom.value = 1
  nextTick(() => fitMap())
}

// Load map dialog
async function openLoadMap() {
  if (!currentMap.value) return
  const dataUrl = await window.dmforge.system.openFileDialog()
  if (!dataUrl) return
  const attrs = { ...(currentMap.value.attributes as any), imageSource: dataUrl, imageType: 'file' }
  await store.updateEntity(currentMap.value.id, { attributes: attrs })
}

// Helpers
const allEntities = computed(() =>
  store.entities.filter(e => e.campaignId === props.campaignId)
)

function pinEntity(id: number) {
  return store.entities.find(e => e.id === id) ?? null
}

function pinImage(entityId: number): string | null {
  const e = pinEntity(entityId)
  if (!e) return null
  const attrs = e.attributes as any
  const src = attrs.logoSource || attrs.portraitSource || attrs.imageSource
  if (!src) return null
  return src
}

function entityColor(type: string) {
  return ENTITY_TYPE_CONFIG[type as keyof typeof ENTITY_TYPE_CONFIG]?.color ?? '#888'
}

function entityIcon(type: string) {
  return ENTITY_TYPE_CONFIG[type as keyof typeof ENTITY_TYPE_CONFIG]?.defaultIcon ?? 'gi-scroll-unfurled'
}

// Reset pan/zoom when root location changes (navigation handled by parent)
watch(() => props.rootLocationId, (newId) => {
  pan.value = { x: 0, y: 0 }
  zoom.value = 1
  // Keep player window in sync when DM navigates
  if (!props.playerMode && newId) window.dmforge.window.syncMap(newId)
})

function openPlayerView() {
  if (!currentLocationId.value) return
  window.dmforge.window.openMapPlayer(props.campaignId, currentLocationId.value)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.world-map-shell { display: flex; flex-direction: column; height: 100%; overflow: hidden; background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply; }
.world-map-shell.player-mode { background: transparent; }

.map-breadcrumb {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 16px; flex-shrink: 0;
  background: var(--parch-dark); border-bottom: 1px solid var(--parch-line);
  min-height: 38px;
}
.crumb-btn { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: var(--r-pill); background: transparent; border: none; color: var(--ink-faded); font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
.crumb-btn:hover { background: var(--parch-dark); color: var(--ink); }
.crumb-btn.active { color: var(--ink); font-weight: 600; cursor: default; }
.crumb-btn:not(:last-child)::after { content: '›'; margin-left: 4px; color: var(--ink-ghost); }
.crumb-hint { font-size: 12px; color: var(--ink-ghost); }

.map-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; flex-shrink: 0;
  background: var(--parch-dark); border-bottom: 1px solid var(--parch-line);
}
.map-name { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--ink); }
.toolbar-gap { flex: 1; }

.pin-picker {
  flex-shrink: 0;
  background: var(--parch-dark);
  border-bottom: 1px solid var(--parch-line);
  display: flex; flex-direction: column; gap: 0;
  max-height: 220px;
}
.pin-picker-top {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}
.pin-search-wrap {
  display: flex; align-items: center; gap: 7px;
  background: var(--parch-dark); border-radius: var(--r-pill);
  padding: 5px 12px; flex: 1;
}
.pin-search-input {
  background: none; border: none; outline: none;
  font-size: 13px; color: var(--ink);
  font-family: 'DM Sans', sans-serif; width: 100%;
}
.pin-search-input::placeholder { color: var(--ink-ghost); }
.pin-selected-label { font-size: 12px; color: var(--gold); white-space: nowrap; }
.pin-cancel-btn {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: var(--parch-dark); color: var(--ink-faded); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.pin-cancel-btn:hover { background: rgba(28,20,16,0.08); color: var(--ink); }
.pin-picker-list {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 8px 14px; overflow-y: auto;
}
.pin-entity-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 5px 10px 5px 5px; border-radius: var(--r);
  background: var(--parch-dark); border: 1px solid;
  font-size: 12px; font-family: 'DM Sans', sans-serif; color: var(--ink);
  cursor: pointer; transition: all 0.15s;
}
.pin-entity-btn:hover { background: rgba(28,20,16,0.08); }
.pin-entity-btn.selected { outline: 2px solid var(--gold); }
.pin-entity-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
}
.pin-entity-info { display: flex; flex-direction: column; line-height: 1.2; }
.pin-entity-name { font-size: 12px; color: var(--ink); font-weight: 500; }
.pin-entity-type { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

.map-canvas-wrap { flex: 1; overflow: hidden; position: relative; cursor: grab; }
.map-canvas-wrap:active { cursor: grabbing; }
.map-image-container { position: absolute; top: 0; left: 0; transform-origin: 0 0; user-select: none; }
.map-image { display: block; max-width: none; }

/* Pins */
.map-pin {
  position: absolute;
  transform-origin: 50% 100%;
  display: flex; flex-direction: column; align-items: center;
  cursor: pointer; z-index: 10;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
  transition: filter 0.15s;
}
.map-pin:hover { filter: drop-shadow(0 3px 10px rgba(0,0,0,0.7)) brightness(1.1); z-index: 20; }
.pin-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--parch-dark);
}
.pin-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.pin-label {
  margin-top: 3px; font-size: 10px; font-weight: 600;
  color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  white-space: nowrap; max-width: 80px;
  overflow: hidden; text-overflow: ellipsis;
  font-family: 'DM Sans', sans-serif;
}

/* Pointer triangle under pin */
.map-pin::after {
  content: '';
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid var(--parch-dark);
  margin-top: -1px;
}

.map-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }

/* Hidden pins (DM view) */
.map-pin--hidden { opacity: 0.35; filter: grayscale(0.6) drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
.map-pin--hidden:hover { opacity: 0.65; }
.pin-hidden-badge {
  position: absolute;
  top: -6px; right: -6px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: rgba(28,20,16,0.75);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.7);
}

/* Preview popup */
.pin-preview-overlay {
  position: absolute; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
}
.pin-preview {
  background: var(--parch-dark); border-radius: var(--r);
  box-shadow: var(--shadow-float);
  width: 320px; max-width: 90%; overflow: hidden;
  animation: slideUp 0.2s ease-out;
}
.pin-preview-banner { height: 140px; overflow: hidden; flex-shrink: 0; }
.pin-preview-body { padding: 16px 18px; }
.pin-preview-type { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
.pin-preview-name { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
.pin-preview-sub { font-size: 12px; color: var(--ink-faded); margin-bottom: 2px; }
.pin-preview-status { font-size: 11px; color: var(--gold); font-style: italic; margin-top: 2px; }
.pin-preview-links {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
  margin-bottom: 12px;
  max-height: 100px;
  overflow-y: auto;
}
.pin-link-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 6px;
  border-radius: 20px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  cursor: pointer;
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  color: var(--ink);
  transition: background 0.15s;
}
.pin-link-chip:hover { background: var(--parch-line); }
.pin-link-type {
  font-size: 10px;
  color: var(--ink-ghost);
  margin-left: 2px;
}
.pin-preview-actions { display: flex; align-items: center; gap: 8px; }
.pin-visibility-btn {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(184,134,11,0.08); border: 1px solid rgba(184,134,11,0.25);
  color: var(--gold); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.pin-visibility-btn:hover { background: rgba(184,134,11,0.18); }
.pin-visibility-btn--hidden {
  background: rgba(28,20,16,0.08); border-color: var(--parch-line);
  color: var(--ink-ghost);
}
.pin-visibility-btn--hidden:hover { background: rgba(28,20,16,0.15); color: var(--ink); }
.pin-remove-btn { margin-left: auto; width: 30px; height: 30px; border-radius: 50%; background: var(--danger-dim); border: none; color: var(--danger); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.pin-remove-btn:hover { background: rgba(224,85,85,0.25); }
</style>
