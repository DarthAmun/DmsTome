<template>
  <div class="player-view">
    <div id="pixi-canvas-player" ref="canvasContainer" class="w-full h-full" />

    <!-- Initiative tracker — top-right, visible on hover -->
    <div v-if="playerInitiativeOrder.length" class="init-tracker">
      <div class="init-tracker-round">Round {{ playerRoundNumber }}</div>
      <div
        v-for="(token, i) in playerInitiativeOrder"
        :key="token.id"
        class="init-tracker-row"
        :class="{ 'init-tracker-row--active': i === playerTurnIndex }"
      >
        <span class="init-tracker-arrow">{{ i === playerTurnIndex ? '▶' : '' }}</span>
        <span class="init-tracker-init">{{ token.initiative ?? '—' }}</span>
        <span class="init-tracker-name">{{ token.label || token.name }}</span>
      </div>
    </div>

    <div class="player-overlay">
      <div class="font-display text-forge-gold-l/70 text-sm tracking-widest uppercase">
        {{ store.current?.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// window.dmstome used for file dialog / IPC only
import { useEncounterCanvas, type ShapeOverlay } from '../../../composables/useEncounterCanvas'
import { useEncounterStore } from '~/stores/encounter'

const route = useRoute()
const store = useEncounterStore()
const canvasContainer = ref<HTMLElement | null>(null)
let canvas: ReturnType<typeof useEncounterCanvas> | null = null

// Initiative tracker state (updated via BroadcastChannel sync)
const playerTurnIndex = ref(0)
const playerRoundNumber = ref(1)
const playerInitiativeOrder = ref<any[]>([])

onMounted(async () => {
  const id = Number(route.params.id)
  await store.loadEncounter(id)

  if (!canvasContainer.value) return

  canvas = useEncounterCanvas({
    container: canvasContainer.value,
    isDmMode: false,
    getActiveTool: () => 'select',
    onTokenMoved: undefined,
    onFogToggle: undefined,
  })

  await canvas.init()

  if (store.current?.mapSource) {
    await canvas.loadMap(store.current.mapSource, store.current.mapType)
  }
  await canvas.renderTokens()
  canvas.redrawFog()

  // Track rendered shape ids so we can diff on each sync
  let renderedShapeIds = new Set<string>()

  // Live sync from DM window via BroadcastChannel
  window.dmstome.window.onEncounterSync(async (data: any) => {
    if (!store.current) return
    store.current.tokens = data.tokens
    store.current.fogData = data.fogData
    store.current.gridSize = data.gridSize
    store.current.gridOffsetX = data.gridOffsetX
    store.current.gridOffsetY = data.gridOffsetY
    if (data.mapSource && data.mapSource !== store.current.mapSource) {
      store.current.mapSource = data.mapSource
      store.current.mapType = data.mapType
      await canvas?.loadMap(data.mapSource, data.mapType)
    }
    canvas?.drawGrid()
    canvas?.redrawFog()
    await canvas?.renderTokens()

    // Update initiative tracker
    playerTurnIndex.value = data.currentTurnIndex ?? 0
    playerRoundNumber.value = data.roundNumber ?? 1
    playerInitiativeOrder.value = (data.tokens ?? [])
      .filter((t: any) => !t.isDead)
      .slice()
      .sort((a: any, b: any) => {
        if (a.initiative === null && b.initiative === null) return 0
        if (a.initiative === null) return 1
        if (b.initiative === null) return -1
        return b.initiative - a.initiative
      })

    // Sync shape overlays
    const incoming: ShapeOverlay[] = data.shapes ?? []
    const incomingIds = new Set(incoming.map((s: ShapeOverlay) => s.id))
    // Remove shapes no longer present
    for (const id of renderedShapeIds) {
      if (!incomingIds.has(id)) canvas?.removeShapeOverlay(id)
    }
    // Add new shapes
    for (const shape of incoming) {
      if (!renderedShapeIds.has(shape.id)) canvas?.addShapeOverlay(shape)
    }
    renderedShapeIds = incomingIds
  })

  // Notify DM window when this tab closes
  window.addEventListener('beforeunload', () => {
    const ch = new BroadcastChannel('dmforge-player')
    ch.postMessage({ type: 'player-closed' })
    ch.close()
  })
})

onUnmounted(() => {
  window.dmstome.window.offEncounterSync()
  canvas?.destroy()
})
</script>

<style scoped>
.player-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--void);
}

.player-overlay {
  position: absolute;
  bottom: 16px;
  right: 16px;
  pointer-events: none;
}

/* ── Initiative tracker overlay ── */
.init-tracker {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(4, 3, 8, 0.6); /* translucent void */
  backdrop-filter: blur(8px);
  border: 1px solid rgba(184, 134, 11, 0.22); /* = var(--gold) at 22% opacity */
  border-radius: 3px;
  padding: 8px 12px;
  min-width: 152px;
  pointer-events: none;
}

.init-tracker-round {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(184, 134, 11, 0.75); /* = var(--gold) at 75% opacity */
  text-align: center;
  padding-bottom: 5px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(184, 134, 11, 0.15); /* = var(--gold) at 15% opacity */
}
.init-tracker-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  opacity: 0.45;
}
.init-tracker-row--active { opacity: 1; }
.init-tracker-arrow {
  font-size: 7px;
  color: rgba(184, 134, 11, 0.9); /* = var(--gold) at 90% opacity */
  width: 8px;
  flex-shrink: 0;
}
.init-tracker-init {
  font-family: monospace;
  font-size: 9px;
  color: rgba(184, 134, 11, 0.8); /* = var(--gold) at 80% opacity */
  width: 18px;
  text-align: right;
  flex-shrink: 0;
}
.init-tracker-name {
  font-size: 11px;
  color: rgba(232, 220, 197, 0.75); /* parchment-on-dark, translucent */
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.init-tracker-row--active .init-tracker-name {
  color: rgba(232, 220, 197, 1); /* parchment-on-dark, opaque */
  font-weight: 500;
}
</style>