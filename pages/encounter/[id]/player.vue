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
import { useEncounterCanvas, type ShapeOverlay } from '../../../composables/useEncounterCanvas'
import { useEncounterStore } from '~/stores/encounter'

const route = useRoute()
const store = useEncounterStore()
const canvasContainer = ref<HTMLElement | null>(null)
let canvas: ReturnType<typeof useEncounterCanvas> | null = null

// Initiative tracker state (updated via encounter sync)
const playerTurnIndex = ref(0)
const playerRoundNumber = ref(1)
const playerInitiativeOrder = ref<any[]>([])
const playerActiveTurnTokenId = computed(() =>
  playerInitiativeOrder.value[playerTurnIndex.value]?.id ?? null
)

onMounted(async () => {
  const id = Number(route.params.id)
  await store.loadEncounter(id)

  // Player window always stays in group mode regardless of DM's current mode
  store.fovMode = 'group'

  if (!canvasContainer.value) return

  canvas = useEncounterCanvas({
    container: canvasContainer.value,
    isDmMode: false,
    getActiveTool: () => 'select',
    getActiveTurnTokenId: () => playerActiveTurnTokenId.value,
    onTokenMoved: undefined,
    onFogToggle: undefined,
  })

  await canvas.init()

  if (store.current?.mapSource) {
    await canvas.loadMap(store.current.mapSource, store.current.mapType)
  }
  await canvas.renderTokens()
  canvas.redrawFog()
  canvas.recomputeFov()

  let renderedShapeIds = new Set<string>()

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

    // Apply door-open states so FOV computation sees current wall config
    if (data.wallDoorStates) {
      for (const state of data.wallDoorStates) {
        const wall = store.walls.find(w => w.id === state.id)
        if (wall) wall.isOpen = state.isOpen
      }
    }

    // Update initiative state before rendering so the active-turn ring lands on
    // the correct token when renderTokens reads getActiveTurnTokenId()
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

    canvas?.drawGrid()
    canvas?.redrawFog()
    await canvas?.renderTokens()

    // Sync shape overlays
    const incoming: ShapeOverlay[] = data.shapes ?? []
    const incomingIds = new Set(incoming.map((s: ShapeOverlay) => s.id))
    for (const id of renderedShapeIds) {
      if (!incomingIds.has(id)) canvas?.removeShapeOverlay(id)
    }
    for (const shape of incoming) {
      if (!renderedShapeIds.has(shape.id)) canvas?.addShapeOverlay(shape)
    }
    renderedShapeIds = incomingIds

    // Recompute FOV with the fully updated state
    canvas?.recomputeFov()
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
  top: 24px;
  right: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: 0;
  min-width: 200px;
  pointer-events: none;
}

.init-tracker-round {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(184, 134, 11, 0.9);
  text-align: right;
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(184, 134, 11, 0.25);
}
.init-tracker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  opacity: 0.35;
}
.init-tracker-row--active { opacity: 1; }
.init-tracker-arrow {
  font-size: 11px;
  color: rgba(184, 134, 11, 0.95);
  width: 12px;
  flex-shrink: 0;
}
.init-tracker-init {
  font-family: monospace;
  font-size: 13px;
  color: rgba(184, 134, 11, 0.85);
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}
.init-tracker-name {
  font-size: 15px;
  color: rgba(232, 220, 197, 0.7);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8);
}
.init-tracker-row--active .init-tracker-name {
  color: rgba(232, 220, 197, 1);
  font-weight: 600;
  font-size: 16px;
  text-shadow: 0 0 12px rgba(184,134,11,0.4), 0 1px 4px rgba(0,0,0,0.9);
}
</style>