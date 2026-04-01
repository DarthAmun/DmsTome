import { defineStore } from 'pinia'
import { dbApi } from '~/composables/useDb'

export interface Token {
  id: number
  name: string
  imageSource: string | null
  imageType: 'file' | 'url'
}

export interface TokenCondition {
  name: string
  value: number | null  // null = no value (e.g. Prone), number = stage (e.g. Poisoned 2)
}

export interface EncounterToken {
  id: number
  encounterId: number
  tokenId: number
  // From token join
  name: string
  imageSource: string | null
  imageType: 'file' | 'url'
  // Position
  gridX: number
  gridY: number
  size: number // 1 = 1x1, 2 = 2x2, etc.
  // State
  isVisible: boolean
  isDead: boolean
  label: string | null
  conditions: TokenCondition[]
  hpCurrent: number | null
  hpMax: number | null
  initiative: number | null
  notes: string | null
}

export interface Encounter {
  id: number
  campaignId: number
  name: string
  mapSource: string | null
  mapType: 'file' | 'url'
  gridSize: number
  gridOffsetX: number
  gridOffsetY: number
  fogData: Record<string, 'hidden' | 'revealed' | 'partial'>
  viewport: { x: number; y: number; scale: number }
  tokens: EncounterToken[]
}

export const useEncounterStore = defineStore('encounter', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const current = ref<Encounter | null>(null)
  const tokenLibrary = ref<Token[]>([])
  const isLoading = ref(false)
  const playerWindowOpen = ref(false)
  const isDmMode = ref(true)
  const shapeOverlays = ref<any[]>([])

  // ── Computed ───────────────────────────────────────────────────────────────
  const visibleTokens = computed(() =>
    current.value?.tokens.filter(t => t.isVisible) ?? []
  )

  const allTokens = computed(() => current.value?.tokens ?? [])

  // ── Actions — Loading ──────────────────────────────────────────────────────
  async function loadEncounter(id: number) {
    isLoading.value = true
    try {
      const data = await dbApi.encounters.get(id)
      if (!data) return
      current.value = {
        ...data,
        fogData: typeof data.fog_data === 'string' ? JSON.parse(data.fog_data) : {},
        viewport: typeof data.viewport === 'string' ? JSON.parse(data.viewport) : { x: 0, y: 0, scale: 1 },
        gridSize: data.grid_size,
        gridOffsetX: data.grid_offset_x,
        gridOffsetY: data.grid_offset_y,
        mapSource: data.map_source,
        mapType: data.map_type,
        campaignId: data.campaign_id,
        tokens: ((data as any).tokens || []).map(normalizeToken),
      }
    } finally {
      isLoading.value = false
    }
  }

  async function loadTokenLibrary() {
    const items = await dbApi.tokens.list()
    tokenLibrary.value = items.map(t => ({
      id: t.id!,
      name: t.name,
      imageSource: t.image_source,
      imageType: t.image_type,
    }))
  }

  // ── Actions — Map ──────────────────────────────────────────────────────────
  async function setMap(source: string, type: 'file' | 'url') {
    if (!current.value) return
    current.value.mapSource = source
    current.value.mapType = type
    await persistEncounter()
    syncToPlayer()
  }

  async function updateGrid(gridSize: number, offsetX: number, offsetY: number) {
    if (!current.value) return
    current.value.gridSize = gridSize
    current.value.gridOffsetX = offsetX
    current.value.gridOffsetY = offsetY
    await persistEncounter()
    syncToPlayer()
  }

  async function updateViewport(viewport: { x: number; y: number; scale: number }) {
    if (!current.value) return
    current.value.viewport = viewport
    // Debounced — don't hit DB on every pan frame
    syncToPlayer()
  }

  // ── Actions — Fog of War ───────────────────────────────────────────────────
  async function setFogCell(key: string, state: 'hidden' | 'revealed' | 'partial') {
    if (!current.value) return
    current.value.fogData[key] = state
    await persistFog()
    syncToPlayer()
  }

  async function revealAllFog() {
    if (!current.value) return
    current.value.fogData = {}  // no _allHidden = nothing drawn = all visible
    await persistFog()
    syncToPlayer()
  }

  async function hideAllFog() {
    if (!current.value) return
    // We'll compute all cells from grid dimensions — store as a sparse "all hidden" marker
    current.value.fogData = { _allHidden: 'hidden' } as any
    await persistFog()
    syncToPlayer()
  }

  async function persistFog() {
    if (!current.value) return
    await dbApi.encounters.update({ id: current.value.id, fog_data: JSON.stringify(current.value.fogData) })
  }

  // ── Actions — Tokens ──────────────────────────────────────────────────────
  async function addTokenToEncounter(tokenId: number, gridX: number, gridY: number) {
    if (!current.value) return
    const result = await dbApi.encounterTokens.add({
      encounterId: current.value.id,
      tokenId,
      gridX,
      gridY,
      size: 1,
      isVisible: 1,
    })
    current.value.tokens.push(normalizeToken(result))
    syncToPlayer()
  }

  async function moveToken(instanceId: number, gridX: number, gridY: number) {
    if (!current.value) return
    const token = current.value.tokens.find(t => t.id === instanceId)
    if (!token) return
    token.gridX = gridX
    token.gridY = gridY
    await dbApi.encounterTokens.update({ id: instanceId, gridX, gridY })
    syncToPlayer()
  }

  async function updateToken(instanceId: number, updates: Partial<EncounterToken>) {
    if (!current.value) return
    const token = current.value.tokens.find(t => t.id === instanceId)
    if (!token) return
    Object.assign(token, updates)
    const dbUpdates: Record<string, any> = { id: instanceId }
    if ('isVisible' in updates) dbUpdates.isVisible = updates.isVisible ? 1 : 0
    if ('isDead' in updates) dbUpdates.isDead = updates.isDead ? 1 : 0
    if ('size' in updates) dbUpdates.size = updates.size
    if ('hpCurrent' in updates) dbUpdates.hpCurrent = updates.hpCurrent
    if ('hpMax' in updates) dbUpdates.hpMax = updates.hpMax
    if ('initiative' in updates) dbUpdates.initiative = updates.initiative
    if ('label' in updates) dbUpdates.label = updates.label
    if ('notes' in updates) dbUpdates.notes = updates.notes
    if ('conditions' in updates) dbUpdates.conditions = JSON.stringify(updates.conditions)
    await dbApi.encounterTokens.update(dbUpdates)
    syncToPlayer()
  }

  async function removeToken(instanceId: number) {
    if (!current.value) return
    current.value.tokens = current.value.tokens.filter(t => t.id !== instanceId)
    await dbApi.encounterTokens.remove(instanceId)
    syncToPlayer()
  }

  async function addToLibrary(name: string, imageSource: string | null, imageType: 'file' | 'url') {
    const token = await dbApi.tokens.create({ name, imageSource, imageType })
    tokenLibrary.value.push({
      id: token!.id!,
      name: token!.name,
      imageSource: token!.image_source,
      imageType: token!.image_type,
    })
    return token
  }

  // ── Actions — Windows ─────────────────────────────────────────────────────
  async function openPlayerWindow() {
    if (!current.value) return
    await dbApi.window.openPlayer(current.value.id)
    playerWindowOpen.value = true
    syncToPlayer()
  }

  async function closePlayerWindow() {
    await dbApi.window.closePlayer()
    playerWindowOpen.value = false
  }

  function setShapeOverlays(shapes: any[]) {
    shapeOverlays.value = shapes
    syncToPlayer()
  }

  function syncToPlayer() {
    if (!current.value) return
    dbApi.window.syncEncounter({
      tokens: current.value.tokens
        .filter(t => t.isVisible)
        .map(t => ({ ...toRaw(t) })),
      fogData: { ...toRaw(current.value.fogData) },
      mapSource: current.value.mapSource,
      mapType: current.value.mapType,
      gridSize: current.value.gridSize,
      gridOffsetX: current.value.gridOffsetX,
      gridOffsetY: current.value.gridOffsetY,
      shapes: shapeOverlays.value.map(s => ({ ...toRaw(s) })),
    })
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function persistEncounter() {
    if (!current.value) return
    await dbApi.encounters.update({
      id: current.value.id,
      map_source: current.value.mapSource,
      map_type: current.value.mapType,
      grid_size: current.value.gridSize,
      grid_offset_x: current.value.gridOffsetX,
      grid_offset_y: current.value.gridOffsetY,
    })
  }

  async function updateName(name: string) {
    if (!current.value) return
    current.value.name = name
    await dbApi.encounters.update({ id: current.value.id, name })
  }

  function normalizeToken(raw: any): EncounterToken {
    return {
      id: raw.id,
      encounterId: raw.encounter_id,
      tokenId: raw.token_id,
      name: raw.name,
      imageSource: raw.image_source,
      imageType: raw.image_type,
      gridX: raw.grid_x ?? 0,
      gridY: raw.grid_y ?? 0,
      size: raw.size ?? 1,
      isVisible: Boolean(raw.is_visible),
      isDead: Boolean(raw.is_dead),
      label: raw.label,
      conditions: typeof raw.conditions === 'string'
        ? JSON.parse(raw.conditions)
        : [],
      hpCurrent: raw.hp_current,
      hpMax: raw.hp_max,
      initiative: raw.initiative,
      notes: raw.notes,
    }
  }

  return {
    current, tokenLibrary, isLoading, playerWindowOpen, isDmMode,
    visibleTokens, allTokens,
    loadEncounter, loadTokenLibrary,
    setMap, updateGrid, updateViewport, updateName,
    setFogCell, revealAllFog, hideAllFog,
    addTokenToEncounter, moveToken, updateToken, removeToken, addToLibrary,
    openPlayerWindow, closePlayerWindow, syncToPlayer, setShapeOverlays,
  }
})
