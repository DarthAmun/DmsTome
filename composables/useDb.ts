/**
 * Dexie (IndexedDB) database — replaces electron/main.js + better-sqlite3
 *
 * Schema mirrors the SQLite tables exactly so the store layer barely changes.
 * Images are stored as base64 data URLs instead of file paths.
 */

/**
 * DATA MODEL NOTE — Two parallel record systems exist:
 *
 * 1. DbEntity (entities table) — Campaign-scoped notes and lore.
 *    Used by: composables/useEntities.ts, pages/campaign/[id]/notes.vue
 *    Fields: campaign_id, type (note/npc/item/location/faction/quest/event/session),
 *            name, content (markdown), attributes (JSON)
 *    Linked by: DbEntityLink (entityLinks table) for the knowledge graph
 *
 * 2. DbRecord (records table) — System-scoped structured records.
 *    Used by: composables/useSystems.ts, pages/system/[id]/[typeId].vue
 *    Fields: systemId, entityTypeId (spell/creature/etc), name, data (JSON)
 *    These are the "library" entries created via the system builder.
 *
 * They are intentionally separate: DbEntity is campaign narrative (freeform markdown + typed attributes).
 * DbRecord is rules library data (structured fields defined by EntityTypeSchema).
 * A future 'entity-link' field type in DbRecord can reference DbRecords by name.
 */
import Dexie, { type Table } from 'dexie'

// ── Types ──────────────────────────────────────────────────────────────────
export interface DbCampaign {
  id?: number
  name: string
  description: string
  banner_source?: string | null  // base64 data URL or http URL
  banner_type?: 'file' | 'url'
  created_at: string
  updated_at: string
}

export interface DbEncounter {
  id?: number
  campaign_id: number
  name: string
  map_source: string | null   // base64 data URL or http URL
  map_type: 'file' | 'url'
  grid_size: number
  grid_offset_x: number
  grid_offset_y: number
  fog_data: string            // JSON
  viewport: string            // JSON
  combat_log: string          // JSON: CombatLogEntry[]
  status?: string             // 'prepared' | 'active'
  current_turn_index?: number
  round_number?: number
  fov_enabled?: boolean
  created_at: string
  updated_at: string
}

export interface DbToken {
  id?: number
  name: string
  image_source: string | null // base64 data URL or http URL
  image_type: 'file' | 'url'
  is_template: number
  created_at: string
}

export interface DbEncounterToken {
  id?: number
  encounter_id: number
  token_id: number
  grid_x: number
  grid_y: number
  size: number
  is_visible: number
  is_dead: number
  label: string | null
  conditions: string          // JSON
  hp_current: number | null
  hp_max: number | null
  ac: number | null
  initiative: number | null
  notes: string | null
  linked_record_id: number | null
  vision_range: number | null // tiles, null = infinite
  is_player_token: number     // 0 | 1
}

export interface DbEncounterWall {
  id?: number
  encounter_id: number
  points: string              // JSON: Array<{x: number, y: number}>
  coverType: 'full' | 'three-quarter' | 'half' | 'quarter' | 'door'
  isOpen: boolean
}

export interface DbEntity {
  id?: number
  campaign_id: number
  type: string
  name: string
  content: string
  attributes: string          // JSON
  created_at: string
  updated_at: string
}

export interface DbEntityLink {
  id?: number
  source_id: number
  target_type: string
  target_name: string
  metadata: string            // JSON
}

export interface DbEntitySnapshot {
  id?: number
  entity_id: number        // FK to entities table
  label: string            // GM-typed label: "Before Ascension", "Session 12"
  note: string             // optional short note about why this snapshot was taken
  content: string          // full markdown content at time of snapshot
  attributes: string       // JSON string of all attributes at time of snapshot
  name: string             // name of the entity at time of snapshot
  created_at: string       // ISO timestamp
  // linked event (optional)
  event_id: number | null  // FK to entities table where type='event'
  event_name: string | null
}

export interface DbSystem {
  id?: number
  name: string
  shortId: string          // e.g. "pf2e" — used in type namespacing
  description: string
  version: string
  entityTypes: string      // JSON: EntityTypeSchema[]
  createdAt: string
  updatedAt: string
}

export interface DbRecord {
  id?: number
  systemId: number
  entityTypeId: string     // e.g. "spell"
  name: string
  data: string             // JSON: field values keyed by field.key
  createdAt: string
  updatedAt: string
}

export interface DbEntityConnection {
  id?: number
  campaign_id: number
  source_entity_id: number
  target_entity_id: number
  label: string            // empty string = no label
  direction: 'one-way' | 'two-way' | 'none'
  color: string | null     // null = default edge color
  edgeType?: 'default' | 'straight' | 'step' | 'smoothstep'
}

export interface DbGraphLayout {
  id?: number
  campaign_id: number
  name: string              // user-visible graph name
  positions: string         // JSON: Record<entityId, {x, y}>
  hidden_nodes: string      // JSON: number[] (legacy, no longer used for GM)
  player_hidden_nodes?: string // JSON: number[] — hidden from player view
  zoom: number
  pan_x: number
  pan_y: number
}

export interface DbSoundTrack {
  id?: number
  name: string
  type: 'file' | 'url' | 'spotify'
  src: string           // URL for 'url'/'spotify'; empty for 'file'
  fileHandle?: any      // FileSystemFileHandle, stored as IDB structured clone
  duration?: number     // seconds, for display
  createdAt: string
  updatedAt: string
}

export interface DbSoundPlaylist {
  id?: number
  name: string
  description?: string
  color?: string        // theme color hex
  trackIds: string      // JSON: number[]
  loop: number          // 0 | 1
  shuffle: number       // 0 | 1
  createdAt: string
  updatedAt: string
}

// ── Database class ─────────────────────────────────────────────────────────
class DmForgeDb extends Dexie {
  campaigns!:         Table<DbCampaign>
  encounters!:        Table<DbEncounter>
  tokens!:            Table<DbToken>
  encounterTokens!:   Table<DbEncounterToken>
  entities!:          Table<DbEntity>
  entityLinks!:       Table<DbEntityLink>
  systems!:           Table<DbSystem>
  records!:           Table<DbRecord>
  encounterWalls!:    Table<DbEncounterWall>
  entitySnapshots!:   Table<DbEntitySnapshot>
  entityConnections!: Table<DbEntityConnection>
  graphLayouts!:      Table<DbGraphLayout>
  soundTracks!:       Table<DbSoundTrack>
  soundPlaylists!:    Table<DbSoundPlaylist>

  constructor() {
    super('dmforge')
    this.version(1).stores({
      campaigns:      '++id, updated_at',
      encounters:     '++id, campaign_id, created_at',
      tokens:         '++id, is_template, name',
      encounterTokens:'++id, encounter_id, token_id',
      entities:       '++id, campaign_id, type, name',
      entityLinks:    '++id, source_id, target_type, target_name',
    })
    // v2: add systems + records tables, add system_id to campaigns
    this.version(2).stores({
      campaigns:      '++id, updated_at, system_id',
      encounters:     '++id, campaign_id, created_at',
      tokens:         '++id, is_template, name',
      encounterTokens:'++id, encounter_id, token_id',
      entities:       '++id, campaign_id, type, name',
      entityLinks:    '++id, source_id, target_type, target_name',
      systems:        '++id, shortId, updatedAt',
      records:        '++id, systemId, entityTypeId, name, updatedAt',
    })
    // v3: index linked_record_id on encounterTokens for stat-block linking
    this.version(3).stores({
      campaigns:      '++id, updated_at, system_id',
      encounters:     '++id, campaign_id, created_at',
      tokens:         '++id, is_template, name',
      encounterTokens:'++id, encounter_id, token_id, linked_record_id',
      entities:       '++id, campaign_id, type, name',
      entityLinks:    '++id, source_id, target_type, target_name',
      systems:        '++id, shortId, updatedAt',
      records:        '++id, systemId, entityTypeId, name, updatedAt',
    })
    // v4: no store changes — combat_log is a non-indexed JSON column; schema unchanged
    this.version(4).stores({
      campaigns:      '++id, updated_at, system_id',
      encounters:     '++id, campaign_id, created_at',
      tokens:         '++id, is_template, name',
      encounterTokens:'++id, encounter_id, token_id, linked_record_id',
      entities:       '++id, campaign_id, type, name',
      entityLinks:    '++id, source_id, target_type, target_name',
      systems:        '++id, shortId, updatedAt',
      records:        '++id, systemId, entityTypeId, name, updatedAt',
    })
    // v5: add encounterWalls table; fov_enabled/vision_range/is_player_token are non-indexed columns
    this.version(5).stores({
      campaigns:      '++id, updated_at, system_id',
      encounters:     '++id, campaign_id, created_at',
      tokens:         '++id, is_template, name',
      encounterTokens:'++id, encounter_id, token_id, linked_record_id',
      entities:       '++id, campaign_id, type, name',
      entityLinks:    '++id, source_id, target_type, target_name',
      systems:        '++id, shortId, updatedAt',
      records:        '++id, systemId, entityTypeId, name, updatedAt',
      encounterWalls: '++id, encounter_id',
    })
    // v6: banner_source/banner_type added to campaigns — non-indexed columns, no store change needed
    this.version(6).stores({
      campaigns:      '++id, updated_at, system_id',
      encounters:     '++id, campaign_id, created_at',
      tokens:         '++id, is_template, name',
      encounterTokens:'++id, encounter_id, token_id, linked_record_id',
      entities:       '++id, campaign_id, type, name',
      entityLinks:    '++id, source_id, target_type, target_name',
      systems:        '++id, shortId, updatedAt',
      records:        '++id, systemId, entityTypeId, name, updatedAt',
      encounterWalls: '++id, encounter_id',
    })
    // v7: add entitySnapshots table for historical states of npcs/locations/factions/quests
    this.version(7).stores({
      campaigns:        '++id, updated_at, system_id',
      encounters:       '++id, campaign_id, created_at',
      tokens:           '++id, is_template, name',
      encounterTokens:  '++id, encounter_id, token_id, linked_record_id',
      entities:         '++id, campaign_id, type, name',
      entityLinks:      '++id, source_id, target_type, target_name',
      systems:          '++id, shortId, updatedAt',
      records:          '++id, systemId, entityTypeId, name, updatedAt',
      encounterWalls:   '++id, encounter_id',
      entitySnapshots:  '++id, entity_id, event_id, created_at',
    })
    // v8: add event_id index to entitySnapshots for efficient event→snapshot queries
    this.version(8).stores({
      campaigns:        '++id, updated_at, system_id',
      encounters:       '++id, campaign_id, created_at',
      tokens:           '++id, is_template, name',
      encounterTokens:  '++id, encounter_id, token_id, linked_record_id',
      entities:         '++id, campaign_id, type, name',
      entityLinks:      '++id, source_id, target_type, target_name',
      systems:          '++id, shortId, updatedAt',
      records:          '++id, systemId, entityTypeId, name, updatedAt',
      encounterWalls:   '++id, encounter_id',
      entitySnapshots:  '++id, entity_id, event_id, created_at',
    })
    // v9: add entityConnections and graphLayouts tables for graph overhaul
    this.version(9).stores({
      campaigns:          '++id, updated_at, system_id',
      encounters:         '++id, campaign_id, created_at',
      tokens:             '++id, is_template, name',
      encounterTokens:    '++id, encounter_id, token_id, linked_record_id',
      entities:           '++id, campaign_id, type, name',
      entityLinks:        '++id, source_id, target_type, target_name',
      systems:            '++id, shortId, updatedAt',
      records:            '++id, systemId, entityTypeId, name, updatedAt',
      encounterWalls:     '++id, encounter_id',
      entitySnapshots:    '++id, entity_id, event_id, created_at',
      entityConnections:  '++id, campaign_id, source_entity_id, target_entity_id',
      graphLayouts:       '++id, campaign_id',
    })
    // v10: add name field to graphLayouts; migrate single layouts to named "Default"
    this.version(10).stores({
      campaigns:          '++id, updated_at, system_id',
      encounters:         '++id, campaign_id, created_at',
      tokens:             '++id, is_template, name',
      encounterTokens:    '++id, encounter_id, token_id, linked_record_id',
      entities:           '++id, campaign_id, type, name',
      entityLinks:        '++id, source_id, target_type, target_name',
      systems:            '++id, shortId, updatedAt',
      records:            '++id, systemId, entityTypeId, name, updatedAt',
      encounterWalls:     '++id, encounter_id',
      entitySnapshots:    '++id, entity_id, event_id, created_at',
      entityConnections:  '++id, campaign_id, source_entity_id, target_entity_id',
      graphLayouts:       '++id, campaign_id, name',
    }).upgrade(async tx => {
      await tx.table('graphLayouts').toCollection().modify((layout: any) => {
        if (!layout.name) layout.name = 'Default'
      })
    })
    // v11: add global sound library — tracks + playlists
    this.version(11).stores({
      campaigns:          '++id, updated_at, system_id',
      encounters:         '++id, campaign_id, created_at',
      tokens:             '++id, is_template, name',
      encounterTokens:    '++id, encounter_id, token_id, linked_record_id',
      entities:           '++id, campaign_id, type, name',
      entityLinks:        '++id, source_id, target_type, target_name',
      systems:            '++id, shortId, updatedAt',
      records:            '++id, systemId, entityTypeId, name, updatedAt',
      encounterWalls:     '++id, encounter_id',
      entitySnapshots:    '++id, entity_id, event_id, created_at',
      entityConnections:  '++id, campaign_id, source_entity_id, target_entity_id',
      graphLayouts:       '++id, campaign_id, name',
      soundTracks:        '++id, name, type',
      soundPlaylists:     '++id, name',
    })
  }
}

// Singleton
let _db: DmForgeDb | null = null
export function getDb(): DmForgeDb {
  if (!_db) _db = new DmForgeDb()
  return _db
}

// ── Timestamp helper ───────────────────────────────────────────────────────
function now() { return new Date().toISOString() }

// ── Image helper — reads a File into a base64 data URL ────────────────────
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── API — mirrors window.dmforge from electron/preload.js ─────────────────

export const dbApi = {

  // ── Campaigns ─────────────────────────────────────────────────────────
  campaigns: {
    async list() {
      const db = getDb()
      return db.campaigns.orderBy('updated_at').reverse().toArray()
    },
    async get(id: number) {
      return getDb().campaigns.get(id)
    },
    async create(data: { name: string; description?: string }) {
      const db = getDb()
      const ts = now()
      const id = await db.campaigns.add({ name: data.name, description: data.description ?? '', created_at: ts, updated_at: ts })
      return db.campaigns.get(id)
    },
    async update(id: number, data: { name?: string; description?: string; system_id?: number | null }) {
      const db = getDb()
      await db.campaigns.update(id, { ...data, updated_at: now() })
      return db.campaigns.get(id)
    },
    async delete(id: number) {
      const db = getDb()
      // Cascade: delete encounters, entities
      const encIds = await db.encounters.where('campaign_id').equals(id).primaryKeys()
      for (const eid of encIds) {
        await db.encounterTokens.where('encounter_id').equals(eid).delete()
      }
      await db.encounters.where('campaign_id').equals(id).delete()
      const entIds = await db.entities.where('campaign_id').equals(id).primaryKeys()
      for (const eid of entIds) {
        await db.entityLinks.where('source_id').equals(eid).delete()
      }
      await db.entities.where('campaign_id').equals(id).delete()
      await db.campaigns.delete(id)
    },
  },

  // ── Encounters ────────────────────────────────────────────────────────
  encounters: {
    async list(campaignId: number) {
      const db = getDb()
      return db.encounters.where('campaign_id').equals(campaignId).reverse().sortBy('created_at')
    },
    async get(id: number) {
      const db = getDb()
      const enc = await db.encounters.get(id)
      if (!enc) return null
      // Join tokens
      const etRows = await db.encounterTokens.where('encounter_id').equals(id).toArray()
      const tokens = await Promise.all(etRows.map(async et => {
        const tok = await db.tokens.get(et.token_id)
        return { ...et, name: tok?.name ?? '', image_source: tok?.image_source ?? null, image_type: tok?.image_type ?? 'file' }
      }))
      return { ...enc, tokens }
    },
    async create(data: { campaignId: number; name: string }) {
      const db = getDb()
      const ts = now()
      const id = await db.encounters.add({ campaign_id: data.campaignId, name: data.name, map_source: null, map_type: 'file', grid_size: 70, grid_offset_x: 0, grid_offset_y: 0, fog_data: '{}', viewport: '{"x":0,"y":0,"scale":1}', combat_log: '[]', created_at: ts, updated_at: ts })
      return db.encounters.get(id)
    },
    async update(data: { id: number; [key: string]: any }) {
      const db = getDb()
      const { id, ...rest } = data
      await db.encounters.update(id, { ...rest, updated_at: now() })
      return db.encounters.get(id)
    },
    async delete(id: number) {
      const db = getDb()
      await db.encounterTokens.where('encounter_id').equals(id).delete()
      await db.encounters.delete(id)
    },
    async search(q: string, limit: number) {
      const db = getDb()
      const lq = q.toLowerCase()
      return db.encounters.filter(e => e.name.toLowerCase().includes(lq)).limit(limit).toArray()
    },
  },

  // ── Tokens ────────────────────────────────────────────────────────────
  tokens: {
    async list() {
      const db = getDb()
      return db.tokens.where('is_template').equals(1).sortBy('name')
    },
    async create(data: { name: string; imageSource?: string | null; imageType?: string }) {
      const db = getDb()
      const id = await db.tokens.add({ name: data.name, image_source: data.imageSource ?? null, image_type: (data.imageType ?? 'file') as any, is_template: 1, created_at: now() })
      return db.tokens.get(id)
    },
    async update(id: number, data: { name?: string; imageSource?: string | null; imageType?: 'file' | 'url' }) {
      const db = getDb()
      const changes: Record<string, any> = {}
      if (data.name !== undefined) changes.name = data.name
      if (data.imageSource !== undefined) changes.image_source = data.imageSource
      if (data.imageType !== undefined) changes.image_type = data.imageType
      await db.tokens.update(id, changes)
    },
    async delete(id: number) {
      const db = getDb()
      await db.tokens.delete(id)
    },
  },

  // ── Encounter tokens ──────────────────────────────────────────────────
  encounterTokens: {
    async add(data: any) {
      const db = getDb()
      const id = await db.encounterTokens.add({
        encounter_id: data.encounterId, token_id: data.tokenId,
        grid_x: data.gridX ?? 0, grid_y: data.gridY ?? 0,
        size: data.size ?? 1, is_visible: data.isVisible ?? 1, is_dead: 0,
        label: data.label ?? null, conditions: '[]',
        hp_current: data.hpCurrent ?? null, hp_max: data.hpMax ?? null,
        initiative: data.initiative ?? null, notes: null,
        linked_record_id: null,
      })
      const et = await db.encounterTokens.get(id)
      const tok = await db.tokens.get(et!.token_id)
      return { ...et, name: tok?.name ?? '', image_source: tok?.image_source ?? null, image_type: tok?.image_type ?? 'file' }
    },
    async update(data: { id: number; [key: string]: any }) {
      const db = getDb()
      const { id, ...rest } = data
      // Convert camelCase keys to snake_case
      const mapped: Record<string, any> = {}
      const toSnake = (s: string) => s.replace(/[A-Z]/g, m => '_' + m.toLowerCase())
      for (const [k, v] of Object.entries(rest)) {
        mapped[toSnake(k)] = v
      }
      await db.encounterTokens.update(id, mapped)
    },
    async remove(id: number) {
      const db = getDb()
      await db.encounterTokens.delete(id)
    },
  },

  // ── Walls ─────────────────────────────────────────────────────────────
  walls: {
    async list(encounterId: number): Promise<DbEncounterWall[]> {
      return getDb().encounterWalls
        .where('encounter_id').equals(encounterId).toArray()
    },
    async add(wall: Omit<DbEncounterWall, 'id'>): Promise<number> {
      return getDb().encounterWalls.add(wall as DbEncounterWall)
    },
    async update(id: number, changes: Partial<DbEncounterWall>): Promise<void> {
      await getDb().encounterWalls.update(id, changes)
    },
    async delete(id: number): Promise<void> {
      await getDb().encounterWalls.delete(id)
    },
    async deleteByEncounter(encounterId: number): Promise<void> {
      await getDb().encounterWalls
        .where('encounter_id').equals(encounterId).delete()
    },
  },

  // ── Entities ──────────────────────────────────────────────────────────
  entities: {
    async list(campaignId: number) {
      const db = getDb()
      return db.entities.where('campaign_id').equals(campaignId).toArray()
        .then(rows => rows.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)))
    },
    async search(query: string, limit = 5) {
      const lq = query.toLowerCase()
      return getDb().entities.filter(e => e.name.toLowerCase().includes(lq) || e.type.toLowerCase().includes(lq)).limit(limit).toArray()
    },
    async get(id: number) {
      const db = getDb()
      return db.entities.get(id)
    },
    async create(data: { campaignId: number; type: string; name: string; content?: string; attributes?: string }) {
      const db = getDb()
      const ts = now()
      const id = await db.entities.add({ campaign_id: data.campaignId, type: data.type, name: data.name, content: data.content ?? '', attributes: data.attributes ?? '{}', created_at: ts, updated_at: ts })
      return db.entities.get(id)
    },
    async update(data: { id: number; [key: string]: any }) {
      const db = getDb()
      const { id, ...rest } = data
      await db.entities.update(id, { ...rest, updated_at: now() })
      return db.entities.get(id)
    },
    async delete(id: number) {
      const db = getDb()
      await db.entityLinks.where('source_id').equals(id).delete()
      await db.entities.delete(id)
    },
    async listLinks(campaignId: number) {
      const db = getDb()
      const entityIds = await db.entities.where('campaign_id').equals(campaignId).primaryKeys() as number[]
      if (!entityIds.length) return []
      return db.entityLinks.where('source_id').anyOf(entityIds).toArray()
    },
    async createLink(data: { sourceId: number; targetType: string; targetName: string; metadata?: string }) {
      const db = getDb()
      const id = await db.entityLinks.add({ source_id: data.sourceId, target_type: data.targetType, target_name: data.targetName, metadata: data.metadata ?? '{}' })
      return db.entityLinks.get(id)
    },
    async deleteLinks(sourceId: number) {
      const db = getDb()
      await db.entityLinks.where('source_id').equals(sourceId).delete()
    },
  },

  // ── System — replaces Electron dialog + fs ───────────────────────────
  system: {
    /**
     * Opens a file picker and returns a base64 data URL.
     * Replaces: openFileDialog() + readImage()
     */
    openFileDialog(): Promise<string | null> {
      return new Promise(resolve => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) { resolve(null); return }
          const dataUrl = await fileToDataUrl(file)
          resolve(dataUrl)
        }
        input.oncancel = () => resolve(null)
        input.click()
      })
    },
    /** Already a data URL — just return it */
    readImage(src: string): Promise<string | null> {
      return Promise.resolve(src.startsWith('data:') ? src : null)
    },
  },

  // ── Window — replaces Electron IPC window management ─────────────────
  window: {
    _channel: null as BroadcastChannel | null,
    _syncHandler: null as ((e: MessageEvent) => void) | null,
    _closedHandler: null as ((e: MessageEvent) => void) | null,
    _getChannel() {
      if (!this._channel) this._channel = new BroadcastChannel('dmforge-player')
      return this._channel
    },
    openPlayer(encounterId: number): Promise<void> {
      // Hash mode routing: strip any existing hash from pathname, then append the player route
      const base = location.origin + location.pathname.replace(/\/+$/, '')
      const url = `${base}/#/encounter/${encounterId}/player`
      window.open(url, 'dmforge-player', 'width=1280,height=800')
      return Promise.resolve()
    },
    closePlayer(): Promise<void> {
      this._getChannel().postMessage({ type: 'close' })
      return Promise.resolve()
    },
    syncEncounter(data: any): void {
      // JSON round-trip strips Vue reactive Proxies, which postMessage cannot clone
      this._getChannel().postMessage({ type: 'sync', data: JSON.parse(JSON.stringify(data)) })
    },
    onPlayerClosed(cb: () => void): void {
      const ch = this._getChannel()
      if (this._closedHandler) ch.removeEventListener('message', this._closedHandler)
      this._closedHandler = (e: MessageEvent) => {
        if (e.data?.type === 'player-closed') cb()
      }
      ch.addEventListener('message', this._closedHandler)
    },
    offPlayerClosed(): void {
      if (this._closedHandler) {
        this._getChannel().removeEventListener('message', this._closedHandler)
        this._closedHandler = null
      }
    },
    onEncounterSync(cb: (data: any) => void): void {
      const ch = this._getChannel()
      if (this._syncHandler) ch.removeEventListener('message', this._syncHandler)
      this._syncHandler = (e: MessageEvent) => {
        if (e.data?.type === 'sync') cb(e.data.data)
      }
      ch.addEventListener('message', this._syncHandler)
    },
    offEncounterSync(): void {
      if (this._syncHandler) {
        this._getChannel().removeEventListener('message', this._syncHandler)
        this._syncHandler = null
      }
    },
    // ── Map player ───────────────────────────────────────────────────────
    _mapChannel: null as BroadcastChannel | null,
    _mapSyncHandler: null as ((e: MessageEvent) => void) | null,
    _getMapChannel() {
      if (!this._mapChannel) this._mapChannel = new BroadcastChannel('dmforge-map')
      return this._mapChannel
    },
    openMapPlayer(campaignId: number, locationId: number): Promise<void> {
      const base = location.origin + location.pathname.replace(/\/+$/, '')
      const url = `${base}/#/campaign/${campaignId}/map-player?locationId=${locationId}`
      window.open(url, 'dmforge-map-player', 'width=1280,height=900')
      return Promise.resolve()
    },
    syncMap(locationId: number | null): void {
      this._getMapChannel().postMessage({ type: 'map-sync', locationId })
    },
    onMapSync(cb: (locationId: number | null) => void): void {
      const ch = this._getMapChannel()
      if (this._mapSyncHandler) ch.removeEventListener('message', this._mapSyncHandler)
      this._mapSyncHandler = (e: MessageEvent) => {
        if (e.data?.type === 'map-sync') cb(e.data.locationId)
      }
      ch.addEventListener('message', this._mapSyncHandler)
    },
    offMapSync(): void {
      if (this._mapSyncHandler) {
        this._getMapChannel().removeEventListener('message', this._mapSyncHandler)
        this._mapSyncHandler = null
      }
    },
  },

  // ── Systems ───────────────────────────────────────────────────────────
  systems: {
    async list() {
      return getDb().systems.orderBy('updatedAt').reverse().toArray()
    },
    async get(id: number) {
      return getDb().systems.get(id)
    },
    async create(data: Omit<DbSystem, 'id'>) {
      const ts = now()
      const id = await getDb().systems.add({ ...data, createdAt: ts, updatedAt: ts })
      return getDb().systems.get(id)
    },
    async update(id: number, data: Partial<DbSystem>) {
      await getDb().systems.update(id, { ...data, updatedAt: now() })
      return getDb().systems.get(id)
    },
    async delete(id: number) {
      const db = getDb()
      await db.records.where('systemId').equals(id).delete()
      await db.systems.delete(id)
    },
  },

  // ── Records ────────────────────────────────────────────────────────────
  records: {
    async list(systemId: number, entityTypeId?: string) {
      const db = getDb()
      let q = db.records.where('systemId').equals(systemId)
      const all = await q.toArray()
      return entityTypeId ? all.filter(r => r.entityTypeId === entityTypeId) : all
    },
    async search(query: string, limit = 5) {
      const lq = query.toLowerCase()
      return getDb().records.filter(r => r.name.toLowerCase().includes(lq)).limit(limit).toArray()
    },
    async get(id: number) {
      return getDb().records.get(id)
    },
    async create(data: { systemId: number; entityTypeId: string; name: string; data?: string }) {
      const ts = now()
      const id = await getDb().records.add({
        systemId: data.systemId,
        entityTypeId: data.entityTypeId,
        name: data.name,
        data: data.data ?? '{}',
        createdAt: ts,
        updatedAt: ts,
      })
      return getDb().records.get(id)
    },
    async update(id: number, data: Partial<DbRecord>) {
      await getDb().records.update(id, { ...data, updatedAt: now() })
      return getDb().records.get(id)
    },
    async delete(id: number) {
      await getDb().records.delete(id)
    },
  },

  // ── Entity snapshots ──────────────────────────────────────────────────
  snapshots: {
    async list(entityId: number): Promise<DbEntitySnapshot[]> {
      return getDb().entitySnapshots
        .where('entity_id').equals(entityId)
        .sortBy('created_at')
    },

    async create(snapshot: Omit<DbEntitySnapshot, 'id'>): Promise<DbEntitySnapshot> {
      const id = await getDb().entitySnapshots.add(snapshot)
      return { ...snapshot, id }
    },

    async update(id: number, changes: Partial<Pick<DbEntitySnapshot, 'label' | 'note' | 'event_id' | 'event_name'>>): Promise<void> {
      await getDb().entitySnapshots.update(id, changes)
    },

    async delete(id: number): Promise<void> {
      await getDb().entitySnapshots.delete(id)
    },

    async deleteByEntity(entityId: number): Promise<void> {
      await getDb().entitySnapshots
        .where('entity_id').equals(entityId).delete()
    },
  },

  // ── Entity connections (explicit graph edges) ─────────────────────────
  connections: {
    async list(campaignId: number): Promise<DbEntityConnection[]> {
      return getDb().entityConnections
        .where('campaign_id').equals(campaignId).toArray()
    },
    async add(conn: Omit<DbEntityConnection, 'id'>): Promise<DbEntityConnection> {
      const id = await getDb().entityConnections.add(conn as DbEntityConnection)
      return { ...conn, id }
    },
    async update(id: number, changes: Partial<DbEntityConnection>): Promise<void> {
      await getDb().entityConnections.update(id, changes)
    },
    async delete(id: number): Promise<void> {
      await getDb().entityConnections.delete(id)
    },
    async deleteByEntity(entityId: number): Promise<void> {
      const db = getDb()
      await db.entityConnections.where('source_entity_id').equals(entityId).delete()
      await db.entityConnections.where('target_entity_id').equals(entityId).delete()
    },
  },

  // ── Graph layouts (multiple named graphs per campaign) ───────────────
  graphLayout: {
    async list(campaignId: number): Promise<DbGraphLayout[]> {
      const all = await getDb().graphLayouts.where('campaign_id').equals(campaignId).toArray()
      return all.map(g => ({ ...g, name: g.name ?? 'Default' }))
    },
    async get(id: number): Promise<DbGraphLayout | undefined> {
      return getDb().graphLayouts.get(id)
    },
    async create(campaignId: number, name: string): Promise<number> {
      return getDb().graphLayouts.add({
        campaign_id: campaignId,
        name,
        positions: '{}',
        hidden_nodes: '[]',
        zoom: 1,
        pan_x: 0,
        pan_y: 0,
      } as DbGraphLayout) as Promise<number>
    },
    async save(id: number, data: Pick<DbGraphLayout, 'positions' | 'hidden_nodes' | 'player_hidden_nodes' | 'zoom' | 'pan_x' | 'pan_y'>): Promise<void> {
      await getDb().graphLayouts.update(id, data)
    },
    async rename(id: number, name: string): Promise<void> {
      await getDb().graphLayouts.update(id, { name })
    },
    async delete(id: number): Promise<void> {
      await getDb().graphLayouts.delete(id)
    },
    async searchAll(query: string, limit = 5): Promise<DbGraphLayout[]> {
      const lq = query.toLowerCase()
      const all = await getDb().graphLayouts.toArray()
      return all
        .filter(g => (g.name ?? 'Default').toLowerCase().includes(lq))
        .slice(0, limit)
        .map(g => ({ ...g, name: g.name ?? 'Default' }))
    },
  },

  isElectron: false,
}
