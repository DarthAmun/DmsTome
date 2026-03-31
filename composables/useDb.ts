/**
 * Dexie (IndexedDB) database — replaces electron/main.js + better-sqlite3
 *
 * Schema mirrors the SQLite tables exactly so the store layer barely changes.
 * Images are stored as base64 data URLs instead of file paths.
 */
import Dexie, { type Table } from 'dexie'

// ── Types ──────────────────────────────────────────────────────────────────
export interface DbCampaign {
  id?: number
  name: string
  description: string
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
  initiative: number | null
  notes: string | null
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

// ── Database class ─────────────────────────────────────────────────────────
class DmForgeDb extends Dexie {
  campaigns!:      Table<DbCampaign>
  encounters!:     Table<DbEncounter>
  tokens!:         Table<DbToken>
  encounterTokens!:Table<DbEncounterToken>
  entities!:       Table<DbEntity>
  entityLinks!:    Table<DbEntityLink>
  systems!:        Table<DbSystem>
  records!:        Table<DbRecord>

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
      const id = await db.encounters.add({ campaign_id: data.campaignId, name: data.name, map_source: null, map_type: 'file', grid_size: 70, grid_offset_x: 0, grid_offset_y: 0, fog_data: '{}', viewport: '{"x":0,"y":0,"scale":1}', created_at: ts, updated_at: ts })
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

  // ── Entities ──────────────────────────────────────────────────────────
  entities: {
    async list(campaignId: number) {
      const db = getDb()
      return db.entities.where('campaign_id').equals(campaignId).toArray()
        .then(rows => rows.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)))
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
      this._getChannel().postMessage({ type: 'sync', data })
    },
    onPlayerClosed(cb: () => void): void {
      this._getChannel().addEventListener('message', (e: MessageEvent) => {
        if (e.data?.type === 'player-closed') cb()
      })
    },
    onEncounterSync(cb: (data: any) => void): void {
      this._getChannel().addEventListener('message', (e: MessageEvent) => {
        if (e.data?.type === 'sync') cb(e.data.data)
      })
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

  isElectron: false,
}
