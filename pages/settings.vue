<template>
  <div class="book-shell">
    <div class="tome-page page-enter">
      <div class="open-book">

        <!-- ── LEFT PAGE — Appearance ── -->
        <div class="book-stack book-stack--left">
          <div class="book-sheet-3" />
          <div class="book-sheet-2" />
          <div class="book-sheet-1" />
          <div class="book-leaf book-leaf--left">

            <div class="page-header">
              <div class="page-chapter-num">DM's Tome</div>
              <h1 class="page-title">Settings</h1>
              <div class="page-rule" />
            </div>

            <div class="leaf-inner">

              <!-- Appearance -->
              <section class="sett-section">
                <h2 class="sett-section-title">
                  <OhVueIcon name="md-brightness-4" scale="0.8" /> Appearance
                </h2>
                <div class="sett-group">
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Paper Texture</span>
                      <span class="sett-desc">Aged parchment effect on pages</span>
                    </div>
                    <button class="sett-toggle" :class="{ on: settings.paperTexture }"
                      @click="update('paperTexture', !settings.paperTexture)" />
                  </div>
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Page Animations</span>
                      <span class="sett-desc">Page flip and entrance transitions</span>
                    </div>
                    <button class="sett-toggle" :class="{ on: settings.pageAnimations }"
                      @click="update('pageAnimations', !settings.pageAnimations)" />
                  </div>
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Arcane Sparks</span>
                      <span class="sett-desc">Particle burst on button clicks</span>
                    </div>
                    <button class="sett-toggle" :class="{ on: settings.sparkEffects }"
                      @click="update('sparkEffects', !settings.sparkEffects)" />
                  </div>
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Ink Write Effect</span>
                      <span class="sett-desc">Animate headings letter by letter</span>
                    </div>
                    <button class="sett-toggle" :class="{ on: settings.inkWrite }"
                      @click="update('inkWrite', !settings.inkWrite)" />
                  </div>
                </div>
              </section>

              <!-- About -->
              <section class="sett-section sett-section--about">
                <h2 class="sett-section-title">
                  <OhVueIcon name="gi-book-cover" scale="0.8" /> About
                </h2>
                <div class="sett-about">
                  <img src="/icons/icon-512.png" class="sett-about-logo" alt="DM's Tome" />
                  <div class="sett-about-info">
                    <div class="sett-about-name">DM's Tome</div>
                    <div class="sett-about-version">Version {{ version }}</div>
                    <div class="sett-about-desc">Offline-first campaign manager for Dungeon Masters. All data lives in your browser.</div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>

        <div class="book-binding" />

        <!-- ── RIGHT PAGE — Data ── -->
        <div class="book-stack book-stack--right">
          <div class="book-sheet-3" />
          <div class="book-sheet-2" />
          <div class="book-sheet-1" />
          <div class="book-leaf book-leaf--right">

            <div class="page-header">
              <div class="page-chapter-num">Grimoire</div>
              <h1 class="page-title">Data &amp; Backups</h1>
              <div class="page-rule" />
            </div>

            <div class="leaf-inner">

              <!-- Data Management -->
              <section class="sett-section">
                <h2 class="sett-section-title">
                  <OhVueIcon name="md-storage" scale="0.8" /> Import &amp; Export
                </h2>
                <div class="sett-group">

                  <!-- Everything -->
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Everything</span>
                      <span class="sett-desc">All campaigns, systems, tokens and records</span>
                      <div v-if="stats" class="sett-pills">
                        <span class="sett-pill">{{ stats.campaigns }} campaigns</span>
                        <span class="sett-pill">{{ stats.entities }} notes</span>
                        <span class="sett-pill">{{ stats.systems }} systems</span>
                        <span class="sett-pill">{{ stats.records }} records</span>
                        <span class="sett-pill">{{ stats.tokens }} tokens</span>
                      </div>
                    </div>
                    <div class="sett-btn-pair">
                      <button class="sett-btn" @click="exportAll">
                        <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                      </button>
                      <label class="sett-btn">
                        <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                        <input type="file" accept=".json" style="display:none" @change="openImport($event, 'all')" />
                      </label>
                    </div>
                  </div>

                  <!-- Campaigns -->
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Campaigns</span>
                      <span class="sett-desc">Campaigns with encounters, notes and links</span>
                      <div v-if="stats" class="sett-pills">
                        <span class="sett-pill">{{ stats.campaigns }} campaigns</span>
                        <span class="sett-pill">{{ stats.encounters }} encounters</span>
                        <span class="sett-pill">{{ stats.entities }} notes</span>
                      </div>
                    </div>
                    <div class="sett-btn-pair">
                      <button class="sett-btn" @click="exportCampaigns">
                        <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                      </button>
                      <label class="sett-btn">
                        <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                        <input type="file" accept=".json" style="display:none" @change="openImport($event, 'campaigns')" />
                      </label>
                    </div>
                  </div>

                  <!-- Systems schema -->
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Systems</span>
                      <span class="sett-desc">Rule system schemas only, no records</span>
                      <div v-if="stats" class="sett-pills">
                        <span class="sett-pill">{{ stats.systems }} systems</span>
                      </div>
                    </div>
                    <div class="sett-btn-pair">
                      <button class="sett-btn" @click="exportSystems(false)">
                        <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                      </button>
                      <label class="sett-btn">
                        <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                        <input type="file" accept=".json" style="display:none" @change="openImport($event, 'systems')" />
                      </label>
                    </div>
                  </div>

                  <!-- Systems + records -->
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Systems + Records</span>
                      <span class="sett-desc">System schemas including all data records</span>
                      <div v-if="stats" class="sett-pills">
                        <span class="sett-pill">{{ stats.systems }} systems</span>
                        <span class="sett-pill">{{ stats.records }} records</span>
                      </div>
                    </div>
                    <div class="sett-btn-pair">
                      <button class="sett-btn" @click="exportSystems(true)">
                        <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                      </button>
                      <label class="sett-btn">
                        <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                        <input type="file" accept=".json" style="display:none" @change="openImport($event, 'systems-full')" />
                      </label>
                    </div>
                  </div>

                  <!-- Tokens -->
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Tokens</span>
                      <span class="sett-desc">Token templates and their images</span>
                      <div v-if="stats" class="sett-pills">
                        <span class="sett-pill">{{ stats.tokens }} tokens</span>
                      </div>
                    </div>
                    <div class="sett-btn-pair">
                      <button class="sett-btn" @click="exportTokens">
                        <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                      </button>
                      <label class="sett-btn">
                        <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                        <input type="file" accept=".json" style="display:none" @change="openImport($event, 'tokens')" />
                      </label>
                    </div>
                  </div>

                </div>
              </section>

              <!-- Danger Zone -->
              <section class="sett-section sett-section--danger">
                <h2 class="sett-section-title">
                  <OhVueIcon name="md-warning-amber" scale="0.8" /> Danger Zone
                </h2>
                <div class="sett-group">
                  <div class="sett-row">
                    <div class="sett-row-text">
                      <span class="sett-label">Wipe All Data</span>
                      <span class="sett-desc">Permanently delete every campaign, session, system and token. Cannot be undone.</span>
                    </div>
                    <button class="sett-btn sett-btn--danger" @click="clearAll">
                      <OhVueIcon name="md-delete-outlined" scale="0.8" /> Wipe
                    </button>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Spine -->
    <nav class="spine-tabs">
      <SpineSeal />
      <NuxtLink to="/" class="spine-tab" title="Home">
        <OhVueIcon name="md-arrowback" scale="0.85" />
      </NuxtLink>
      <NuxtLink to="/settings" class="spine-tab active" title="Settings">
        <OhVueIcon name="md-settings" scale="0.85" />
      </NuxtLink>
    </nav>
  </div>

  <!-- Import modal -->
  <ImportModal
    :open="modalOpen"
    :phase="modalPhase"
    :payload="modalPayload"
    :sections="importSections"
    :entity-type-rows="entityTypeRows"
    :log-lines="logLines"
    :progress-done="progressDone"
    :progress-total="progressTotal"
    @close="modalOpen = false"
    @run="runImport"
    @update:sections="importSections = $event"
    @update:entity-type-rows="entityTypeRows = $event"
  />
</template>

<script setup lang="ts">
import { getDb } from '~/composables/useDb'
import type { ImportSection, EntityTypeRow, LogLine } from '../components/ImportModal.vue'

const { public: { version } } = useRuntimeConfig()
const { settings, update } = useSettings()

// ── DB stats ───────────────────────────────────────────────────────
interface DbStats {
  campaigns: number; encounters: number; encounterTokens: number
  entities: number; entityLinks: number; tokens: number
  systems: number; records: number
}

const stats = ref<DbStats | null>(null)

async function loadStats() {
  const db = getDb()
  const [c, enc, et, ent, el, tok, sys, rec] = await Promise.all([
    db.campaigns.count(), db.encounters.count(), db.encounterTokens.count(),
    db.entities.count(), db.entityLinks.count(), db.tokens.count(),
    db.systems.count(), db.records.count(),
  ])
  stats.value = { campaigns: c, encounters: enc, encounterTokens: et, entities: ent, entityLinks: el, tokens: tok, systems: sys, records: rec }
}

onMounted(loadStats)

// ── Helpers ────────────────────────────────────────────────────────
function download(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function slug() { return new Date().toISOString().slice(0, 10) }

async function readJson(e: Event): Promise<any | null> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return null
  try { return JSON.parse(await file.text()) }
  catch (err: any) { alert('Invalid file: ' + err.message); return null }
  finally { (e.target as HTMLInputElement).value = '' }
}

// ── Export ─────────────────────────────────────────────────────────
async function exportAll() {
  const db = getDb()
  const [campaigns, encounters, encounterTokens, entities, entityLinks, tokens, systems, records] =
    await Promise.all([
      db.campaigns.toArray(), db.encounters.toArray(), db.encounterTokens.toArray(),
      db.entities.toArray(), db.entityLinks.toArray(), db.tokens.toArray(),
      db.systems.toArray(), db.records.toArray(),
    ])
  download({ version: 1, type: 'all', exportedAt: new Date().toISOString(), campaigns, encounters, encounterTokens, entities, entityLinks, tokens, systems, records }, `dmstome-all-${slug()}.json`)
}

async function exportCampaigns() {
  const db = getDb()
  const campaigns = await db.campaigns.toArray()
  const encounters = await db.encounters.toArray()
  const encIds = encounters.map(e => e.id as number)
  const encounterTokens = encIds.length ? await db.encounterTokens.where('encounter_id').anyOf(encIds).toArray() : []
  const entities = await db.entities.toArray()
  const entIds = entities.map(e => e.id as number)
  const entityLinks = entIds.length ? await db.entityLinks.where('source_id').anyOf(entIds).toArray() : []
  download({ version: 1, type: 'campaigns', exportedAt: new Date().toISOString(), campaigns, encounters, encounterTokens, entities, entityLinks }, `dmstome-campaigns-${slug()}.json`)
}

async function exportSystems(withRecords: boolean) {
  const db = getDb()
  const systems = await db.systems.toArray()
  const records = withRecords ? await db.records.toArray() : []
  download({ version: 1, type: withRecords ? 'systems-full' : 'systems', exportedAt: new Date().toISOString(), systems, records }, `dmstome-systems${withRecords ? '-full' : ''}-${slug()}.json`)
}

async function exportTokens() {
  const db = getDb()
  const tokens = await db.tokens.toArray()
  download({ version: 1, type: 'tokens', exportedAt: new Date().toISOString(), tokens }, `dmstome-tokens-${slug()}.json`)
}

// ── Import modal state ─────────────────────────────────────────────
const modalOpen    = ref(false)
const modalPhase   = ref<'configure' | 'running' | 'done'>('configure')
const modalPayload = ref<any>(null)
const importSections   = ref<ImportSection[]>([])
const entityTypeRows   = ref<EntityTypeRow[]>([])
const logLines         = ref<LogLine[]>([])
const progressDone     = ref(0)
const progressTotal    = ref(0)

async function openImport(e: Event, _expectedType: string) {
  const payload = await readJson(e)
  if (!payload) return
  // markRaw prevents Vue from wrapping the payload in a Proxy,
  // which would make it uncloneable by IndexedDB's structured clone algorithm
  modalPayload.value = markRaw(payload)
  buildImportSections(payload)
  modalPhase.value   = 'configure'
  logLines.value     = []
  progressDone.value = 0
  progressTotal.value = 0
  modalOpen.value    = true
}

function buildImportSections(payload: any) {
  const sections: ImportSection[] = []

  function addSection(key: string, label: string) {
    const arr: any[] | undefined = payload[key]
    if (arr && arr.length > 0) sections.push({ key, label, count: arr.length, enabled: true })
  }

  addSection('campaigns',       'Campaigns')
  addSection('encounters',      'Encounters')
  addSection('encounterTokens', 'Encounter Tokens')
  addSection('entities',        'Notes & Entities')
  addSection('entityLinks',     'Entity Links')
  addSection('tokens',          'Tokens')
  addSection('systems',         'System Schemas')

  importSections.value = sections

  // Records with per-entity-type rows
  const records: any[] = payload.records ?? []
  if (records.length > 0) {
    const byType = new Map<string, number>()
    for (const r of records) byType.set(r.entityTypeId, (byType.get(r.entityTypeId) ?? 0) + 1)

    // Resolve display names from system schemas in the same file
    const nameLookup = new Map<string, string>()
    for (const sys of payload.systems ?? []) {
      let etArr: any[] = []
      try { etArr = typeof sys.entityTypes === 'string' ? JSON.parse(sys.entityTypes) : sys.entityTypes ?? [] } catch {}
      for (const et of etArr) { if (!nameLookup.has(et.id)) nameLookup.set(et.id, et.name) }
    }

    entityTypeRows.value = [...byType.entries()].map(([id, count]) => ({
      id, name: nameLookup.get(id) ?? id, count, enabled: true,
    }))
  } else {
    entityTypeRows.value = []
  }
}

async function runImport() {
  if (!modalPayload.value) return
  const payload = modalPayload.value
  const db = getDb()

  modalPhase.value   = 'running'
  logLines.value     = []
  progressDone.value = 0

  const addLog = (ok: boolean, msg: string) => {
    logLines.value = [...logLines.value, { ok, msg }]
  }

  // ── Step 1: resolve system IDs ──────────────────────────────────────
  // Records link to systems via numeric systemId which is DB-local and may
  // differ between machines. We resolve the correct target ID by matching
  // on shortId (the stable human slug), then remap records before inserting.
  const systemIdRemap = new Map<number, number>() // exportedId → actualDbId
  const systemsSec = importSections.value.find(s => s.key === 'systems')
  const hasEnabledRecords = entityTypeRows.value.some(r => r.enabled) && (payload.records?.length > 0)

  for (const sys of (payload.systems ?? [])) {
    // Try to find the matching system in the current DB by its shortId
    const existing = sys.shortId
      ? await db.systems.where('shortId').equals(sys.shortId).first()
      : null

    if (systemsSec?.enabled) {
      // Importing schema: upsert and track where it landed
      try {
        if (existing) {
          // Update in place — keep the DB id the user already has
          await db.systems.put({ ...sys, id: existing.id })
          systemIdRemap.set(sys.id, existing.id)
          addLog(true, `System updated: ${sys.name}`)
        } else {
          // New system — put with the exported id (preserve link to records)
          await db.systems.put(sys)
          systemIdRemap.set(sys.id, sys.id)
          addLog(true, `System imported: ${sys.name}`)
        }
      } catch (err) {
        addLog(false, `System failed: ${sys.name} — ${err}`)
      }
      progressDone.value++
    } else if (hasEnabledRecords) {
      // Not importing schema but need to know where records should go
      if (existing) {
        systemIdRemap.set(sys.id, existing.id)
      } else {
        addLog(false, `Warning: No existing system found for "${sys.name}" (shortId: ${sys.shortId}). Records for this system will be skipped.`)
      }
    }
  }

  // ── Step 2: build general work queue ───────────────────────────────
  type WorkItem = { table: any; row: any }
  const work: WorkItem[] = []

  function queueSection(key: string, table: any) {
    if (key === 'systems') return // handled above
    const sec = importSections.value.find(s => s.key === key)
    if (!sec?.enabled) return
    for (const row of (payload[key] ?? [])) work.push({ table, row })
  }

  queueSection('campaigns',       db.campaigns)
  queueSection('encounters',      db.encounters)
  queueSection('encounterTokens', db.encounterTokens)
  queueSection('entities',        db.entities)
  queueSection('entityLinks',     db.entityLinks)
  queueSection('tokens',          db.tokens)

  // Records: filter by enabled entity types, remap systemId, normalise data to JSON string
  const enabledTypeIds = new Set(entityTypeRows.value.filter(r => r.enabled).map(r => r.id))
  for (const row of (payload.records ?? [])) {
    if (!enabledTypeIds.has(row.entityTypeId)) continue
    const targetSystemId = systemIdRemap.get(row.systemId)
    if (targetSystemId === undefined) continue // no matching system, skip
    const rec: any = { ...row, systemId: targetSystemId }
    // Normalise: import files may use 'attributes' or 'data' for the field values
    if (rec.attributes !== undefined && rec.data === undefined) {
      rec.data = typeof rec.attributes === 'string' ? rec.attributes : JSON.stringify(rec.attributes)
      delete rec.attributes
    }
    // Ensure `data` is stored as a JSON string regardless of how the import file encoded it
    if (typeof rec.data !== 'string') rec.data = JSON.stringify(rec.data ?? {})
    if (!rec.data) rec.data = '{}'
    work.push({ table: db.records, row: rec })
  }

  const systemCount = systemsSec?.enabled ? (payload.systems?.length ?? 0) : 0
  progressTotal.value = systemCount + work.length

  if (progressTotal.value === 0) {
    addLog(false, 'Nothing was selected to import.')
    modalPhase.value = 'done'
    return
  }

  // ── Step 3: batch insert ────────────────────────────────────────────
  const BATCH = 50
  for (let i = 0; i < work.length; i += BATCH) {
    const batch = work.slice(i, i + BATCH)
    const results = await Promise.allSettled(batch.map(item => item.table.put(item.row)))

    let batchOk = 0
    const newLines: LogLine[] = []
    for (let j = 0; j < batch.length; j++) {
      if (results[j].status === 'fulfilled') {
        batchOk++
      } else {
        newLines.push({ ok: false, msg: `Failed: ${(results[j] as PromiseRejectedResult).reason}` })
      }
      progressDone.value++
    }
    if (batchOk > 0) newLines.unshift({ ok: true, msg: `Imported ${batchOk} items (batch ${Math.floor(i / BATCH) + 1})` })
    logLines.value = [...logLines.value, ...newLines]

    await new Promise(resolve => setTimeout(resolve, 0))
  }

  await loadStats()
  modalPhase.value = 'done'
}

// ── Danger ─────────────────────────────────────────────────────────
async function clearAll() {
  if (!confirm('Permanently delete ALL data — campaigns, systems, tokens, everything?')) return
  if (!confirm('Last chance: this cannot be undone. Continue?')) return
  const db = getDb()
  await Promise.all([
    db.campaigns.clear(), db.encounters.clear(), db.encounterTokens.clear(),
    db.entities.clear(), db.entityLinks.clear(), db.tokens.clear(),
    db.systems.clear(), db.records.clear(),
  ])
  await loadStats()
  alert('All data has been wiped.')
}
</script>

<style scoped>
.book-shell {
  display: flex;
  height: 100vh;
  background: var(--leather);
}

.tome-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  margin: 20px 20px 20px 60px;
  border-radius: 2px;
  box-shadow: var(--page-shadow);
  overflow: visible;
}

/* Override leaf-inner default padding/overflow for settings */
.leaf-inner {
  padding: 16px 28px 24px;
}

/* ── Section ── */
.sett-section {
  padding: 16px 0 4px;
  border-bottom: 1px solid var(--parch-line);
}
.sett-section:last-child { border-bottom: none; }

.sett-section-title {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sett-section--danger .sett-section-title { color: #c05040; }

/* ── Rows ── */
.sett-group { display: flex; flex-direction: column; }

.sett-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid var(--parch-line);
}
.sett-row:last-child { border-bottom: none; }

.sett-row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.sett-label {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.sett-desc {
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--ink-ghost);
  line-height: 1.4;
}

/* ── Stat pills ── */
.sett-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 5px;
}
.sett-pill {
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  background: rgba(28,20,16,0.05);
  border: 1px solid var(--parch-line);
  border-radius: 999px;
  padding: 2px 7px;
}

/* ── Toggle ── */
.sett-toggle {
  flex-shrink: 0;
  width: 38px;
  height: 20px;
  border-radius: 10px;
  background: rgba(28, 20, 16, 0.12);
  border: 1px solid var(--parch-line);
  position: relative;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  margin-top: 2px;
}
.sett-toggle::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--ink-ghost);
  transition: transform 0.2s, background 0.2s;
}
.sett-toggle.on { background: rgba(184,134,11,0.25); border-color: rgba(184,134,11,0.5); }
.sett-toggle.on::after { transform: translateX(18px); background: var(--gold); }

/* ── Buttons ── */
.sett-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  color: var(--ink-faded);
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.sett-btn:hover { color: var(--ink); border-color: var(--gold); }

.sett-btn-pair { display: flex; gap: 5px; flex-shrink: 0; margin-top: 2px; }

.sett-btn--danger { color: #c05040; border-color: rgba(192,80,64,0.3); }
.sett-btn--danger:hover { border-color: #c05040; background: rgba(192,80,64,0.08); }

/* ── About ── */
.sett-section--about { border-bottom: none; }
.sett-about { display: flex; align-items: center; gap: 16px; padding: 12px 0; }
.sett-about-logo { width: 42px; height: 42px; border-radius: 6px; object-fit: cover; opacity: 0.85; }
.sett-about-name { font-family: var(--font-deco); font-size: 15px; color: var(--ink); margin-bottom: 2px; }
.sett-about-version {
  font-family: var(--font-head); font-size: 9px; font-weight: 600;
  letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); margin-bottom: 4px;
}
.sett-about-desc { font-family: var(--font-ui); font-size: 11px; color: var(--ink-ghost); line-height: 1.5; }
</style>
