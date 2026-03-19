<template>
  <div class="player-view">
    <div id="pixi-canvas-player" ref="canvasContainer" class="w-full h-full" />
    <div class="player-overlay">
      <div class="font-display text-forge-gold-l/70 text-sm tracking-widest uppercase">
        {{ store.current?.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEncounterCanvas } from '~/composables/useEncounterCanvas'
import { useEncounterStore } from '~/stores/encounter'

const route = useRoute()
const store = useEncounterStore()
const canvasContainer = ref<HTMLElement | null>(null)
let canvas: ReturnType<typeof useEncounterCanvas> | null = null

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

  // Live sync from DM window via BroadcastChannel
  window.dmforge.window.onEncounterSync(async (data: any) => {
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
  })

  // Notify DM window when this tab closes
  window.addEventListener('beforeunload', () => {
    const ch = new BroadcastChannel('dmforge-player')
    ch.postMessage({ type: 'player-closed' })
    ch.close()
  })
})

onUnmounted(() => canvas?.destroy())
</script>

<style scoped>
.player-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #08080f;
}

.player-overlay {
  position: absolute;
  bottom: 16px;
  right: 16px;
  pointer-events: none;
}
</style>