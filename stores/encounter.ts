import { defineStore } from 'pinia'
import { dbApi } from '~/composables/useDb'
import type { DbEncounterWall } from '~/composables/useDb'
import type { ShapeOverlay } from '~/composables/useEncounterCanvas'
import { useStatBlockLinker } from '~/composables/useStatBlockLinker'

export interface CombatLogEntry {
  id: number
  round: number
  timestamp: number
  tokenId: number
  tokenName: string
  type: 'damage' | 'healing' | 'condition-added' | 'condition-removed' | 'death' | 'revival' | 'note'
  value?: number
  conditionName?: string
  note?: string
}

export interface Token {
  id: number
  name: string
  imageSource: string | null
  imageType: 'file' | 'url'
  linkedRecordId: number | null
  isPlayerCharacter: boolean
}

export interface TokenCondition {
  name: string
  value: number | null  // null = no value (e.g. Prone), number = stage (e.g. Poisoned 2)
}

export interface EncounterToken {
  id: number
  encounterId: number
  tokenId: number | null
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
  ac: number | null
  initiative: number | null
  notes: string | null
  linkedRecordId: number | null
  visionRange: number | null  // tiles, null = infinite
  isPlayerToken: boolean      // default false
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
  combatLog: CombatLogEntry[]
  fovEnabled: boolean
  soundPlaylistId?: number
}

export const useEncounterStore = defineStore('encounter', () => {
  const { extractStatsFromData, extractAllFromRecord } = useStatBlockLinker()

  // ── State ──────────────────────────────────────────────────────────────────
  const current = ref<Encounter | null>(null)
  const tokenLibrary = ref<Token[]>([])
  const isLoading = ref(false)
  const playerWindowOpen = ref(false)
  const shapeOverlays = ref<ShapeOverlay[]>([])
  const currentTurnIndex = ref(0)
  const roundNumber = ref(1)
  const walls = ref<DbEncounterWall[]>([])
  const fovMode = ref<'gm' | 'active' | 'group'>('gm')
  const wallUndoStack = ref<number[]>([])
  const fovRecomputeTrigger = ref(0)

  // ── Computed ───────────────────────────────────────────────────────────────
  const allTokens = computed(() => current.value?.tokens ?? [])

  // Tokens that participate in turn order: visible and alive, sorted by initiative descending
  const initiativeOrder = computed(() =>
    (current.value?.tokens ?? [])
      .filter(t => t.isVisible && !t.isDead)
      .slice()
      .sort((a, b) => {
        if (a.initiative === null && b.initiative === null) return 0
        if (a.initiative === null) return 1
        if (b.initiative === null) return -1
        return b.initiative - a.initiative
      })
  )

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
        combatLog: typeof data.combat_log === 'string' ? JSON.parse(data.combat_log || '[]') : [],
        gridSize: data.grid_size,
        gridOffsetX: data.grid_offset_x,
        gridOffsetY: data.grid_offset_y,
        mapSource: data.map_source,
        mapType: data.map_type,
        campaignId: data.campaign_id,
        fovEnabled: data.fov_enabled ?? false,
        soundPlaylistId: data.sound_playlist_id ?? undefined,
        tokens: ((data as any).tokens || []).map(normalizeToken),
      }
      currentTurnIndex.value = data.current_turn_index ?? 0
      roundNumber.value = data.round_number ?? 1
      walls.value = await dbApi.walls.list(id)
      wallUndoStack.value = []
    } catch (err) {
      console.error('[EncounterStore] loadEncounter:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function loadTokenLibrary() {
    try {
      const items = await dbApi.tokens.list()
      tokenLibrary.value = items.map(t => ({
        id: t.id!,
        name: t.name,
        imageSource: t.image_source,
        imageType: t.image_type,
        linkedRecordId: t.linked_record_id ?? null,
        isPlayerCharacter: Boolean(t.is_player_character),
      }))
    } catch (err) {
      console.error('[EncounterStore] loadTokenLibrary:', err)
    }
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
    syncToPlayer()
    await persistFog()
  }

  async function hideAllFog() {
    if (!current.value) return
    current.value.fogData = { _allHidden: 'hidden' } as any
    syncToPlayer()
    await persistFog()
  }

  async function clearAllFog() {
    if (!current.value) return
    current.value.fogData = {}
    syncToPlayer()
    await persistFog()
  }

  async function persistFog() {
    if (!current.value) return
    try {
      await dbApi.encounters.update({ id: current.value.id, fog_data: JSON.stringify(current.value.fogData) })
    } catch (err) {
      console.error('[EncounterStore] persistFog:', err)
    }
  }

  // ── Actions — Tokens ──────────────────────────────────────────────────────
  async function addTokenToEncounter(tokenId: number, gridX: number, gridY: number): Promise<{ autoLinked: boolean }> {
    if (!current.value) return { autoLinked: false }
    try {
      const libToken = tokenLibrary.value.find(t => t.id === tokenId)
      let hpCurrent: number | null = null
      let hpMax: number | null = null
      let ac: number | null = null
      let linkedRecordId: number | null = null
      let autoLinked = false

      if (libToken?.linkedRecordId) {
        const rec = await dbApi.records.get(libToken.linkedRecordId)
        if (rec) {
          const data: Record<string, any> = typeof rec.data === 'string' ? JSON.parse(rec.data || '{}') : (rec.data ?? {})
          const stats = extractStatsFromData(data)
          hpMax = stats.hpMax
          hpCurrent = stats.hpCurrent
          ac = stats.ac
          linkedRecordId = rec.id!
          autoLinked = true
        }
      }

      const result = await dbApi.encounterTokens.add({
        encounterId: current.value.id,
        tokenId,
        gridX,
        gridY,
        size: 1,
        isVisible: 1,
        hpCurrent,
        hpMax,
        ac,
        linkedRecordId,
      })
      current.value.tokens.push(normalizeToken(result))
      syncToPlayer()
      return { autoLinked }
    } catch (err) {
      console.error('[EncounterStore] addTokenToEncounter:', err)
      return { autoLinked: false }
    }
  }

  async function addCreatureToEncounter(recordId: number, gridX: number, gridY: number) {
    if (!current.value) return
    try {
      const extracted = await extractAllFromRecord(recordId)
      const result = await dbApi.encounterTokens.add({
        encounterId: current.value.id,
        tokenId: null,
        gridX,
        gridY,
        size: 1,
        isVisible: 1,
        hpCurrent: extracted.hpCurrent,
        hpMax: extracted.hpMax,
        ac: extracted.ac,
        linkedRecordId: recordId,
        imageSource: extracted.imageSource,
        imageType: extracted.imageType,
      })
      current.value.tokens.push(normalizeToken(result))
      syncToPlayer()
    } catch (err) {
      console.error('[EncounterStore] addCreatureToEncounter:', err)
    }
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

    // ── Detect log-worthy changes before mutating ──────────────────────────
    const tokenName = token.label || token.name
    if ('hpCurrent' in updates && updates.hpCurrent !== null && token.hpCurrent !== null && token.hpCurrent !== undefined) {
      const diff = (updates.hpCurrent as number) - token.hpCurrent
      if (diff < 0) appendLogEntry({ tokenId: instanceId, tokenName, type: 'damage', value: Math.abs(diff) })
      else if (diff > 0) appendLogEntry({ tokenId: instanceId, tokenName, type: 'healing', value: diff })
    }
    if ('isDead' in updates) {
      if (updates.isDead && !token.isDead) appendLogEntry({ tokenId: instanceId, tokenName, type: 'death' })
      else if (!updates.isDead && token.isDead) appendLogEntry({ tokenId: instanceId, tokenName, type: 'revival' })
    }
    if ('conditions' in updates && updates.conditions) {
      const oldNames = new Set(token.conditions.map(c => c.name))
      const newNames = new Set(updates.conditions.map(c => c.name))
      for (const n of newNames) if (!oldNames.has(n)) appendLogEntry({ tokenId: instanceId, tokenName, type: 'condition-added', conditionName: n })
      for (const n of oldNames) if (!newNames.has(n)) appendLogEntry({ tokenId: instanceId, tokenName, type: 'condition-removed', conditionName: n })
    }

    Object.assign(token, updates)
    const dbUpdates: Record<string, any> = { id: instanceId }
    if ('isVisible' in updates) dbUpdates.isVisible = updates.isVisible ? 1 : 0
    if ('isDead' in updates) dbUpdates.isDead = updates.isDead ? 1 : 0
    if ('size' in updates) dbUpdates.size = updates.size
    if ('hpCurrent' in updates) dbUpdates.hpCurrent = updates.hpCurrent
    if ('hpMax' in updates) dbUpdates.hpMax = updates.hpMax
    if ('ac' in updates) dbUpdates.ac = updates.ac
    if ('initiative' in updates) dbUpdates.initiative = updates.initiative
    if ('label' in updates) dbUpdates.label = updates.label
    if ('notes' in updates) dbUpdates.notes = updates.notes
    if ('conditions' in updates) dbUpdates.conditions = JSON.stringify(updates.conditions)
    if ('linkedRecordId' in updates) dbUpdates.linkedRecordId = updates.linkedRecordId
    if ('visionRange' in updates) dbUpdates.visionRange = updates.visionRange
    if ('isPlayerToken' in updates) dbUpdates.isPlayerToken = updates.isPlayerToken ? 1 : 0
    await dbApi.encounterTokens.update(dbUpdates)
    if ('isPlayerToken' in updates && fovMode.value === 'group') {
      fovRecomputeTrigger.value++
    }
    syncToPlayer()
  }

  // ── Actions — Combat Log ──────────────────────────────────────────────────
  async function appendLogEntry(partial: Omit<CombatLogEntry, 'id' | 'round' | 'timestamp'>) {
    if (!current.value) return
    const log = current.value.combatLog
    const entry: CombatLogEntry = {
      id: log.length > 0 ? log[log.length - 1].id + 1 : 1,
      round: roundNumber.value,
      timestamp: Date.now(),
      ...partial,
    }
    log.push(entry)
    await persistCombatLog()
  }

  async function addLogNote(tokenId: number, note: string) {
    if (!current.value) return
    const token = current.value.tokens.find(t => t.id === tokenId)
    if (!token) return
    appendLogEntry({ tokenId, tokenName: token.label || token.name, type: 'note', note })
  }

  async function clearCombatLog() {
    if (!current.value) return
    current.value.combatLog = []
    await persistCombatLog()
  }

  async function persistCombatLog() {
    if (!current.value) return
    try {
      await dbApi.encounters.update({ id: current.value.id, combat_log: JSON.stringify(current.value.combatLog) })
    } catch (err) {
      console.error('[EncounterStore] persistCombatLog:', err)
    }
  }

  async function removeToken(instanceId: number) {
    if (!current.value) return
    try {
      current.value.tokens = current.value.tokens.filter(t => t.id !== instanceId)
      await dbApi.encounterTokens.remove(instanceId)
      syncToPlayer()
    } catch (err) {
      console.error('[EncounterStore] removeToken:', err)
    }
  }

  async function updateLibraryToken(id: number, name: string, imageSource: string | null, imageType: 'file' | 'url', linkedRecordId?: number | null, isPlayerCharacter?: boolean) {
    try {
      await dbApi.tokens.update(id, { name, imageSource, imageType, linkedRecordId, isPlayerCharacter })
      const token = tokenLibrary.value.find(t => t.id === id)
      if (token) Object.assign(token, { name, imageSource, imageType, linkedRecordId: linkedRecordId ?? token.linkedRecordId, isPlayerCharacter: isPlayerCharacter ?? token.isPlayerCharacter })
    } catch (err) {
      console.error('[EncounterStore] updateLibraryToken:', err)
    }
  }

  async function addToLibrary(name: string, imageSource: string | null, imageType: 'file' | 'url', linkedRecordId?: number | null, isPlayerCharacter?: boolean) {
    try {
      const token = await dbApi.tokens.create({ name, imageSource, imageType, linkedRecordId, isPlayerCharacter })
      tokenLibrary.value.push({
        id: token!.id!,
        name: token!.name,
        imageSource: token!.image_source,
        imageType: token!.image_type,
        linkedRecordId: token!.linked_record_id ?? null,
        isPlayerCharacter: Boolean(token!.is_player_character),
      })
      return token
    } catch (err) {
      console.error('[EncounterStore] addToLibrary:', err)
      return null
    }
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

  function setShapeOverlays(shapes: ShapeOverlay[]) {
    shapeOverlays.value = shapes
    syncToPlayer()
  }

  function nextTurn() {
    if (!initiativeOrder.value.length) return
    currentTurnIndex.value++
    if (currentTurnIndex.value >= initiativeOrder.value.length) {
      currentTurnIndex.value = 0
      roundNumber.value++
    }
    syncToPlayer()
    persistTurnState()
  }

  function prevTurn() {
    if (!initiativeOrder.value.length) return
    if (currentTurnIndex.value === 0) {
      if (roundNumber.value > 1) {
        roundNumber.value--
        currentTurnIndex.value = initiativeOrder.value.length - 1
      }
    } else {
      currentTurnIndex.value--
    }
    syncToPlayer()
    persistTurnState()
  }

  async function persistTurnState() {
    if (!current.value) return
    try {
      await dbApi.encounters.update({
        id: current.value.id,
        current_turn_index: currentTurnIndex.value,
        round_number: roundNumber.value,
      })
    } catch (err) {
      console.error('[EncounterStore] persistTurnState:', err)
    }
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
      currentTurnIndex: currentTurnIndex.value,
      roundNumber: roundNumber.value,
      wallDoorStates: walls.value.map(w => ({ id: w.id, isOpen: w.isOpen })),
    })
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function persistEncounter() {
    if (!current.value) return
    try {
      await dbApi.encounters.update({
        id: current.value.id,
        map_source: current.value.mapSource,
        map_type: current.value.mapType,
        grid_size: current.value.gridSize,
        grid_offset_x: current.value.gridOffsetX,
        grid_offset_y: current.value.gridOffsetY,
      })
    } catch (err) {
      console.error('[EncounterStore] persistEncounter:', err)
    }
  }

  // ── Actions — Walls ────────────────────────────────────────────────────────
  async function addWall(
    points: Array<{ x: number; y: number }>,
    coverType: DbEncounterWall['coverType']
  ): Promise<void> {
    if (!current.value) return
    const wallData = {
      encounter_id: current.value.id,
      points: JSON.stringify(points),
      coverType,
      isOpen: false,
    }
    const id = await dbApi.walls.add(wallData)
    walls.value.push({ id, ...wallData })
    wallUndoStack.value.push(id)
  }

  async function undoLastWall(): Promise<void> {
    const id = wallUndoStack.value.pop()
    if (id === undefined) return
    await dbApi.walls.delete(id)
    walls.value = walls.value.filter(w => w.id !== id)
  }

  async function updateWall(
    id: number,
    changes: Partial<Pick<DbEncounterWall, 'coverType' | 'isOpen' | 'points'>>
  ): Promise<void> {
    await dbApi.walls.update(id, changes)
    const idx = walls.value.findIndex(w => w.id === id)
    if (idx !== -1) Object.assign(walls.value[idx], changes)
  }

  async function deleteWall(id: number): Promise<void> {
    await dbApi.walls.delete(id)
    walls.value = walls.value.filter(w => w.id !== id)
    wallUndoStack.value = wallUndoStack.value.filter(uid => uid !== id)
  }

  async function toggleDoor(id: number): Promise<void> {
    const wall = walls.value.find(w => w.id === id)
    if (!wall || wall.coverType !== 'door') return
    await updateWall(id, { isOpen: !wall.isOpen })
    syncToPlayer()
  }

  async function setFovEnabled(enabled: boolean): Promise<void> {
    if (!current.value) return
    current.value.fovEnabled = enabled
    await dbApi.encounters.update({ id: current.value.id, fov_enabled: enabled })
  }

  async function setSoundPlaylistId(id: number | null): Promise<void> {
    if (!current.value) return
    current.value.soundPlaylistId = id ?? undefined
    await dbApi.encounters.update({ id: current.value.id, sound_playlist_id: id })
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
      tokenId: raw.token_id ?? null,
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
      ac: raw.ac ?? null,
      initiative: raw.initiative,
      notes: raw.notes,
      linkedRecordId: raw.linked_record_id ?? null,
      visionRange: raw.vision_range ?? null,
      isPlayerToken: Boolean(raw.is_player_token),
    }
  }

  return {
    current, tokenLibrary, isLoading, playerWindowOpen,
    currentTurnIndex, roundNumber, initiativeOrder,
    allTokens,
    walls, fovMode, wallUndoStack, fovRecomputeTrigger,
    loadEncounter, loadTokenLibrary,
    setMap, updateGrid, updateViewport, updateName,
    setFogCell, hideAllFog, clearAllFog,
    addWall, undoLastWall, updateWall, deleteWall, toggleDoor,
    setFovEnabled,
    setSoundPlaylistId,
    addTokenToEncounter, addCreatureToEncounter, moveToken, updateToken, removeToken, addToLibrary, updateLibraryToken,
    openPlayerWindow, closePlayerWindow, setShapeOverlays,
    nextTurn, prevTurn,
    addLogNote, clearCombatLog,
  }
})
