<template>
  <div class="migrate-page">
    <div class="header">
      <NuxtLink to="/" class="back-link">← Back to DM Forge</NuxtLink>
      <h1>⚔ Migration Tool</h1>
      <p>Import your SQLite data from the Electron version</p>
    </div>

    <!-- Steps -->
    <div class="card">
      <div class="card-title">How it works</div>
      <div class="step" v-for="(s, i) in steps" :key="i">
        <div class="step-num" :class="{ done: currentStep > i + 1, active: currentStep === i + 1 }">
          {{ currentStep > i + 1 ? '✓' : i + 1 }}
        </div>
        <div class="step-text" v-html="s" />
      </div>
    </div>

    <!-- File picker -->
    <div class="card" v-if="!migrationDone">
      <div class="card-title">Select Database File</div>
      <div class="warning-box">
        <strong>Images stored as file paths</strong> cannot be transferred — only URL images carry over.
        Re-add portraits and map images manually after migration.
      </div>

      <div class="drop-zone" :class="{ 'drag-over': dragging }" @click="fileInput?.click()"
        @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
        <div class="drop-icon">🗄</div>
        <p>Drop <strong>dmforge.db</strong> here or <strong>click to browse</strong></p>
        <p class="drop-hint">Linux: ~/.config/dm-forge/dmforge.db</p>
      </div>
      <input ref="fileInput" type="file" accept=".db,.sqlite,.sqlite3" style="display:none" @change="onFileChange" />

      <div v-if="loadedFile" class="file-info">
        <span class="file-ok">✓</span>
        <span>{{ loadedFile.name }}</span>
        <span class="file-size">{{ (loadedFile.size / 1024).toFixed(1) }} KB</span>
      </div>

      <div v-if="stats" class="stats-grid">
        <div class="stat" v-for="(val, key) in stats" :key="key">
          <div class="stat-num">{{ val }}</div>
          <div class="stat-label">{{ key }}</div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" :disabled="!sqlDb || migrating" @click="startMigration">
          {{ migrating ? 'Migrating…' : 'Migrate to IndexedDB' }}
        </button>
        <button class="btn btn-ghost" @click="clearDb">Clear existing data</button>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="log.length > 0" class="card">
      <div class="card-title">Progress</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }" />
      </div>
      <div class="log-box" ref="logBox">
        <div v-for="(entry, i) in log" :key="i" class="log-entry" :class="entry.type">
          <span class="log-tag">[{{ entry.type.toUpperCase() }}]</span>
          <span class="log-msg">{{ entry.msg }}</span>
        </div>
      </div>
      <div v-if="migrationDone" class="success-box">
        <h3>✓ Migration Complete</h3>
        <p>Your data is now in IndexedDB. <NuxtLink to="/">Open DM Forge →</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Dexie from 'dexie'

const fileInput = ref<HTMLInputElement | null>(null)
const logBox = ref<HTMLElement | null>(null)
const dragging = ref(false)
const loadedFile = ref<File | null>(null)
const sqlDb = ref<any>(null)
const stats = ref<Record<string, number> | null>(null)
const log = ref<{ type: string; msg: string }[]>([])
const progress = ref(0)
const migrating = ref(false)
const migrationDone = ref(false)
const currentStep = ref(1)

const steps = [
  'This tool runs on the <strong>same domain as DM Forge</strong> so it writes directly to the correct IndexedDB.',
  'Find your database at <code>~/.config/dm-forge/dmforge.db</code> and drop it below.',
  'Click <strong>Migrate</strong> — all your campaigns, encounters, notes and tokens will be imported.',
  'Done — <a href="/">open DM Forge</a> and your data will be there.',
]

function addLog(type: string, msg: string) {
  log.value.push({ type, msg })
  nextTick(() => { if (logBox.value) logBox.value.scrollTop = logBox.value.scrollHeight })
}

async function loadSqlJs() {
  // Load sql.js from CDN
  return new Promise<any>((resolve, reject) => {
    if ((window as any).initSqlJs) { resolve((window as any).initSqlJs); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js'
    script.onload = () => resolve((window as any).initSqlJs)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function loadFile(file: File) {
  loadedFile.value = file
  const initSqlJs = await loadSqlJs()
  const SQL = await initSqlJs({
    locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${f}`
  })
  const buf = await file.arrayBuffer()
  sqlDb.value = new SQL.Database(new Uint8Array(buf))

  const count = (table: string) => {
    try { return sqlDb.value.exec(`SELECT COUNT(*) FROM ${table}`)[0]?.values[0][0] ?? 0 } catch { return 0 }
  }
  stats.value = {
    Campaigns: count('campaigns'),
    Encounters: count('encounters'),
    Entities: count('entities'),
    Tokens: count('tokens'),
    Links: count('entity_links'),
  }
  currentStep.value = 3
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) loadFile(file)
}
function onFileChange() {
  const file = fileInput.value?.files?.[0]
  if (file) loadFile(file)
}

function openDexie() {
  const db = new Dexie('dmforge')
  db.version(1).stores({
    campaigns: '++id, updated_at',
    encounters: '++id, campaign_id, created_at',
    tokens: '++id, is_template, name',
    encounterTokens: '++id, encounter_id, token_id',
    entities: '++id, campaign_id, type, name',
    entityLinks: '++id, source_id, target_type, target_name',
  })
  return db
}

function select(sql: string) {
  const result = sqlDb.value.exec(sql)
  if (!result.length) return []
  const cols = result[0].columns
  return result[0].values.map((row: any[]) => {
    const obj: any = {}
    cols.forEach((c: string, i: number) => obj[c] = row[i])
    return obj
  })
}

async function startMigration() {
  if (!sqlDb.value) return
  migrating.value = true
  currentStep.value = 3
  const now = () => new Date().toISOString()
  const dexie = openDexie()

  try {
    addLog('info', 'Starting migration…')
    progress.value = 5

    // Campaigns
    const campaigns = select('SELECT * FROM campaigns ORDER BY id')
    addLog('info', `${campaigns.length} campaigns found`)
    const campaignIdMap: Record<number, number> = {}
    for (const c of campaigns) {
      const id = await dexie.table('campaigns').add({ name: c.name, description: c.description ?? '', created_at: c.created_at ?? now(), updated_at: c.updated_at ?? now() })
      campaignIdMap[c.id] = id as number
      addLog('ok', `Campaign: "${c.name}"`)
    }
    progress.value = 20

    // Tokens
    const tokens = select('SELECT * FROM tokens')
    addLog('info', `${tokens.length} tokens found`)
    const tokenIdMap: Record<number, number> = {}
    let imgSkipped = 0
    for (const t of tokens) {
      const imgSource = t.image_type === 'url' ? t.image_source : null
      if (t.image_source && t.image_type !== 'url') imgSkipped++
      const id = await dexie.table('tokens').add({ name: t.name, image_source: imgSource, image_type: t.image_type ?? 'file', is_template: t.is_template ?? 1, created_at: t.created_at ?? now() })
      tokenIdMap[t.id] = id as number
    }
    addLog('ok', `Tokens: ${tokens.length}${imgSkipped ? `, ${imgSkipped} images skipped` : ''}`)
    progress.value = 35

    // Encounters
    const encounters = select('SELECT * FROM encounters')
    addLog('info', `${encounters.length} encounters found`)
    const encounterIdMap: Record<number, number> = {}
    for (const e of encounters) {
      const newCampaignId = campaignIdMap[e.campaign_id]
      if (!newCampaignId) { addLog('warn', `Skipped encounter "${e.name}"`); continue }
      const mapSource = e.map_type === 'url' ? e.map_source : null
      if (e.map_source && e.map_type !== 'url') addLog('warn', `"${e.name}": map image cleared (file path)`)
      const id = await dexie.table('encounters').add({ campaign_id: newCampaignId, name: e.name, map_source: mapSource, map_type: e.map_type ?? 'file', grid_size: e.grid_size ?? 70, grid_offset_x: e.grid_offset_x ?? 0, grid_offset_y: e.grid_offset_y ?? 0, fog_data: e.fog_data ?? '{}', viewport: e.viewport ?? '{"x":0,"y":0,"scale":1}', created_at: e.created_at ?? now(), updated_at: e.updated_at ?? now() })
      encounterIdMap[e.id] = id as number
      addLog('ok', `Encounter: "${e.name}"`)
    }
    progress.value = 52

    // Encounter tokens
    const etokens = select('SELECT * FROM encounter_tokens')
    let etOk = 0, etSkip = 0
    for (const et of etokens) {
      const eid = encounterIdMap[et.encounter_id], tid = tokenIdMap[et.token_id]
      if (!eid || !tid) { etSkip++; continue }
      await dexie.table('encounterTokens').add({ encounter_id: eid, token_id: tid, grid_x: et.grid_x ?? 0, grid_y: et.grid_y ?? 0, size: et.size ?? 1, is_visible: et.is_visible ?? 1, is_dead: et.is_dead ?? 0, label: et.label ?? null, conditions: et.conditions ?? '[]', hp_current: et.hp_current ?? null, hp_max: et.hp_max ?? null, initiative: et.initiative ?? null, notes: et.notes ?? null })
      etOk++
    }
    addLog('ok', `Placed tokens: ${etOk}${etSkip ? `, ${etSkip} skipped` : ''}`)
    progress.value = 68

    // Entities
    const entities = select('SELECT * FROM entities')
    addLog('info', `${entities.length} entities found`)
    const entityIdMap: Record<number, number> = {}
    let attrImgSkipped = 0
    for (const e of entities) {
      const newCampaignId = campaignIdMap[e.campaign_id]
      if (!newCampaignId) continue
      let attrs: any = {}
      try { attrs = JSON.parse(e.attributes || '{}') } catch { }
      for (const key of ['portraitSource', 'imageSource', 'logoSource']) {
        if (attrs[key] && !attrs[key].startsWith('http') && !attrs[key].startsWith('data:')) {
          attrs[key] = null; attrImgSkipped++
        }
      }
      const id = await dexie.table('entities').add({ campaign_id: newCampaignId, type: e.type, name: e.name, content: e.content ?? '', attributes: JSON.stringify(attrs), created_at: e.created_at ?? now(), updated_at: e.updated_at ?? now() })
      entityIdMap[e.id] = id as number
    }
    addLog('ok', `Entities: ${entities.length}${attrImgSkipped ? `, ${attrImgSkipped} images cleared` : ''}`)
    progress.value = 85

    // Entity links
    const links = select('SELECT * FROM entity_links')
    let lOk = 0, lSkip = 0
    for (const l of links) {
      const sourceId = entityIdMap[l.source_id]
      if (!sourceId) { lSkip++; continue }
      await dexie.table('entityLinks').add({ source_id: sourceId, target_type: l.target_type, target_name: l.target_name, metadata: l.metadata ?? '{}' })
      lOk++
    }
    addLog('ok', `Links: ${lOk}${lSkip ? `, ${lSkip} skipped` : ''}`)
    progress.value = 100

    addLog('ok', '── Migration complete! ──')
    migrationDone.value = true
    currentStep.value = 4
  } catch (err: any) {
    addLog('error', err.message)
  } finally {
    migrating.value = false
  }
}

async function clearDb() {
  if (!confirm('Delete ALL existing DM Forge data from this browser?')) return
  await Dexie.delete('dmforge')
  addLog('warn', 'IndexedDB cleared')
}
</script>

<style scoped>
.migrate-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  text-align: center;
  margin-bottom: 8px;
}

.back-link {
  font-size: 13px;
  color: var(--gold);
  text-decoration: none;
  display: block;
  margin-bottom: 16px;
}

.back-link:hover {
  opacity: 0.8;
}

.header h1 {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 6px;
}

.header p {
  color: var(--secondary);
  font-size: 13px;
}

.card {
  background: var(--card);
  border-radius: 18px;
  padding: 24px;
}

.card-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 16px;
}

.step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--raised);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  flex-shrink: 0;
  margin-top: 1px;
}

.step-num.done {
  background: var(--forge-green, #7cc44e);
  border-color: var(--forge-green, #7cc44e);
  color: #0d0d0d;
}

.step-num.active {
  background: var(--gold);
  border-color: var(--gold);
  color: #0d0d0d;
}

.step-text {
  font-size: 13px;
  color: var(--secondary);
  line-height: 1.5;
}

.step-text :deep(strong) {
  color: var(--text);
}

.step-text :deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  background: var(--raised);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--gold);
}

.step-text :deep(a) {
  color: var(--gold);
}

.warning-box {
  background: rgba(235, 189, 52, 0.08);
  border: 1px solid rgba(235, 189, 52, 0.2);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 12px;
  color: var(--secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.warning-box strong {
  color: var(--gold);
}

.drop-zone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: var(--gold);
  background: rgba(235, 189, 52, 0.04);
}

.drop-icon {
  font-size: 28px;
  opacity: 0.35;
  margin-bottom: 8px;
}

.drop-zone p {
  font-size: 13px;
  color: var(--secondary);
}

.drop-zone strong {
  color: var(--gold);
}

.drop-hint {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px !important;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--raised);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--secondary);
  margin-bottom: 12px;
}

.file-ok {
  color: #7cc44e;
}

.file-size {
  margin-left: auto;
  color: var(--muted);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.stat {
  background: var(--raised);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.stat-num {
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: var(--gold);
}

.stat-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--gold);
  color: #0d0d0d;
}

.btn-primary:hover:not(:disabled) {
  background: #f5cb4a;
}

.btn-ghost {
  background: var(--raised);
  color: var(--secondary);
  margin-left: auto;
}

.btn-ghost:hover {
  background: var(--hover);
  color: var(--text);
}

.progress-bar {
  height: 4px;
  background: var(--raised);
  border-radius: 999px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gold);
  border-radius: 999px;
  transition: width 0.3s;
}

.log-box {
  background: var(--raised);
  border-radius: 8px;
  padding: 12px;
  max-height: 260px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.7;
}

.log-entry {
  display: flex;
  gap: 10px;
}

.log-entry.info .log-tag {
  color: #6b9fe8;
}

.log-entry.ok .log-tag {
  color: #7cc44e;
}

.log-entry.warn .log-tag {
  color: var(--gold);
}

.log-entry.error .log-tag {
  color: #e05555;
}

.log-tag {
  flex-shrink: 0;
  width: 52px;
}

.log-msg {
  color: var(--secondary);
}

.success-box {
  background: rgba(124, 196, 78, 0.1);
  border: 1px solid rgba(124, 196, 78, 0.3);
  border-radius: 10px;
  padding: 18px;
  text-align: center;
  margin-top: 14px;
}

.success-box h3 {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: #7cc44e;
  margin-bottom: 4px;
}

.success-box p {
  font-size: 13px;
  color: var(--secondary);
}

.success-box a {
  color: var(--gold);
}
</style>