<template>
  <div class="settings-shell screen-in">

    <!-- Left nav -->
    <nav class="settings-nav">
      <div class="settings-nav-group">
        <div class="settings-nav-label">Preferences</div>
        <button
          v-for="s in NAV_SECTIONS"
          :key="s.id"
          class="settings-nav-item"
          :class="{ active: activeSection === s.id }"
          @click="activeSection = s.id"
        >
          <span class="settings-nav-icon">{{ s.icon }}</span>
          {{ s.label }}
        </button>
      </div>

      <div class="settings-nav-group">
        <div class="settings-nav-label">Data</div>
        <button
          class="settings-nav-item"
          :class="{ active: activeSection === 'data' }"
          @click="activeSection = 'data'"
        >
          <span class="settings-nav-icon">⬡</span>
          Import &amp; Export
        </button>
        <button
          class="settings-nav-item settings-nav-item--danger"
          :class="{ active: activeSection === 'danger' }"
          @click="activeSection = 'danger'"
        >
          <span class="settings-nav-icon">⚠</span>
          Danger Zone
        </button>
      </div>

      <div class="settings-nav-group">
        <div class="settings-nav-label">Info</div>
        <button
          class="settings-nav-item"
          :class="{ active: activeSection === 'about' }"
          @click="activeSection = 'about'"
        >
          <span class="settings-nav-icon">◎</span>
          About
        </button>
      </div>
    </nav>

    <!-- Body -->
    <div class="settings-body">

      <!-- Appearance -->
      <section v-if="activeSection === 'appearance'" class="sett-section">
        <div class="sett-section-title">Appearance</div>
        <div class="sett-group">
          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Theme</span>
              <span class="sett-desc">Light or dark interface</span>
            </div>
            <div class="sett-theme-pills">
              <button class="sett-pill-btn" :class="{ active: settings.theme === 'dark' }"
                @click="update('theme', 'dark')">Dark</button>
              <button class="sett-pill-btn" :class="{ active: settings.theme === 'light' }"
                @click="update('theme', 'light')">Light</button>
            </div>
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Page Animations</span>
              <span class="sett-desc">Entrance transitions on navigation</span>
            </div>
            <button class="sett-toggle" :class="{ on: settings.pageAnimations }"
              @click="update('pageAnimations', !settings.pageAnimations)" />
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Arcane Sparks</span>
              <span class="sett-desc">Particle burst on clicks</span>
            </div>
            <button class="sett-toggle" :class="{ on: settings.sparkEffects }"
              @click="update('sparkEffects', !settings.sparkEffects)" />
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Ink Write Effect</span>
              <span class="sett-desc">Animate headings letter by letter on page load</span>
            </div>
            <button class="sett-toggle" :class="{ on: settings.inkWrite }"
              @click="update('inkWrite', !settings.inkWrite)" />
          </div>
        </div>
      </section>

      <!-- Import & Export -->
      <section v-else-if="activeSection === 'data'" class="sett-section">
        <div class="sett-section-title">Import &amp; Export</div>
        <div class="sett-group">

          <div v-if="stats" class="sett-stats-row">
            <span class="sett-stat">{{ stats.campaigns }} campaigns</span>
            <span class="sett-stat">{{ stats.entities }} notes</span>
            <span class="sett-stat">{{ stats.systems }} systems</span>
            <span class="sett-stat">{{ stats.records }} records</span>
            <span class="sett-stat">{{ stats.tokens }} tokens</span>
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Everything</span>
              <span class="sett-desc">All campaigns, systems, tokens and records</span>
            </div>
            <div class="sett-btn-pair">
              <button class="sett-btn" @click="exportAll">↓ Export</button>
              <label class="sett-btn">↑ Import
                <input type="file" accept=".json" style="display:none" @change="openImport($event, 'all')" />
              </label>
            </div>
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Campaigns</span>
              <span class="sett-desc">Campaigns with encounters, notes and links</span>
            </div>
            <div class="sett-btn-pair">
              <button class="sett-btn" @click="exportCampaigns">↓ Export</button>
              <label class="sett-btn">↑ Import
                <input type="file" accept=".json" style="display:none" @change="openImport($event, 'campaigns')" />
              </label>
            </div>
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Systems</span>
              <span class="sett-desc">Rule system schemas only</span>
            </div>
            <div class="sett-btn-pair">
              <button class="sett-btn" @click="exportSystems(false)">↓ Export</button>
              <label class="sett-btn">↑ Import
                <input type="file" accept=".json" style="display:none" @change="openImport($event, 'systems')" />
              </label>
            </div>
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Systems + Records</span>
              <span class="sett-desc">System schemas with all data records</span>
            </div>
            <div class="sett-btn-pair">
              <button class="sett-btn" @click="exportSystems(true)">↓ Export</button>
              <label class="sett-btn">↑ Import
                <input type="file" accept=".json" style="display:none" @change="openImport($event, 'systems-full')" />
              </label>
            </div>
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Tokens</span>
              <span class="sett-desc">Token templates and their images</span>
            </div>
            <div class="sett-btn-pair">
              <button class="sett-btn" @click="exportTokens">↓ Export</button>
              <label class="sett-btn">↑ Import
                <input type="file" accept=".json" style="display:none" @change="openImport($event, 'tokens')" />
              </label>
            </div>
          </div>

          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Export as Markdown</span>
              <span class="sett-desc">Download a campaign's notes as a Markdown zip</span>
              <select v-if="campaigns.length" v-model="mdExportCampaignId" class="sett-md-select">
                <option :value="null">— choose campaign —</option>
                <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <button class="sett-btn" :disabled="!mdExportCampaignId || mdExporting" @click="exportCampaignMarkdown">
              {{ mdExporting ? 'Exporting…' : '↓ Export' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Danger Zone -->
      <section v-else-if="activeSection === 'danger'" class="sett-section sett-section--danger">
        <div class="sett-section-title">Danger Zone</div>
        <div class="sett-group">
          <div class="sett-row">
            <div class="sett-row-text">
              <span class="sett-label">Wipe All Data</span>
              <span class="sett-desc">Permanently delete every campaign, system and token. This cannot be undone.</span>
            </div>
            <button class="sett-btn sett-btn--danger" @click="clearAll">Wipe</button>
          </div>
        </div>
      </section>

      <!-- About -->
      <section v-else-if="activeSection === 'about'" class="sett-section">
        <div class="sett-section-title">About</div>
        <div class="sett-about">
          <img src="/icons/icon-512.png" class="sett-about-logo" alt="DM's Tome"
            @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
          <div class="sett-about-info">
            <div class="sett-about-name">DM's Tome</div>
            <div class="sett-about-version">Version {{ version }}</div>
            <div class="sett-about-desc">Offline-first D&amp;D campaign manager. All data lives in your browser — no account required.</div>
          </div>
        </div>
      </section>

    </div>
  </div>

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
import JSZip from 'jszip'
import { getDb, dbApi } from '~/composables/useDb'
import type { ImportSection, EntityTypeRow, LogLine } from '../components/ImportModal.vue'

const { public: { version } } = useRuntimeConfig()
const { settings, update } = useSettings()

const NAV_SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: '◐' },
]

const activeSection = ref('appearance')

interface DbStats {
  campaigns: number; encounters: number; encounterTokens: number
  entities: number; entityLinks: number; tokens: number
  systems: number; records: number
}

const stats = ref<DbStats | null>(null)
const campaigns = ref<{ id: number; name: string }[]>([])
const mdExportCampaignId = ref<number | null>(null)
const mdExporting = ref(false)

async function loadCampaigns() {
  campaigns.value = (await dbApi.campaigns.list()).map((c: any) => ({ id: c.id, name: c.name }))
}

async function loadStats() {
  const db = getDb()
  const [c, enc, et, ent, el, tok, sys, rec] = await Promise.all([
    db.campaigns.count(), db.encounters.count(), db.encounterTokens.count(),
    db.entities.count(), db.entityLinks.count(), db.tokens.count(),
    db.systems.count(), db.records.count(),
  ])
  stats.value = { campaigns: c, encounters: enc, encounterTokens: et, entities: ent, entityLinks: el, tokens: tok, systems: sys, records: rec }
}

onMounted(() => { loadStats(); loadCampaigns() })

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

function wikilinkify(text: string): string {
  if (!text) return ''
  return text.replace(/\{\{(\w+):\s*([^}]+)\}\}/g, (_m, _type, name) => `[[${name.trim()}]]`)
}

function entityFrontmatter(e: any): string {
  const lines = ['---', `name: "${(e.name ?? '').replace(/"/g, '\\"')}"`, `type: "${e.type ?? ''}"`]
  if (e.tags?.length) lines.push(`tags: [${e.tags.map((t: string) => `"${t}"`).join(', ')}]`)
  lines.push('---')
  return lines.join('\n')
}

async function exportCampaignMarkdown() {
  if (!mdExportCampaignId.value) return
  mdExporting.value = true
  try {
    const db = getDb()
    const campaignId = mdExportCampaignId.value
    const campaign = (await dbApi.campaigns.list()).find((c: any) => c.id === campaignId)
    if (!campaign) { alert('Campaign not found.'); return }
    const entities = (await dbApi.entities.list(campaignId)) as any[]
    const encounters = await db.encounters.where('campaign_id').equals(campaignId).toArray()
    const zip = new JSZip()
    const root = zip.folder(campaign.name.replace(/[/\\:*?"<>|]/g, '_'))!
    root.file('_index.md', [`---`, `name: "${campaign.name.replace(/"/g, '\\"')}"`, `---`, ``, `# ${campaign.name}`, ``, campaign.description ? wikilinkify(campaign.description) : '_No description._'].join('\n'))
    const notesFolder = root.folder('notes')!
    for (const e of entities) {
      const folder = notesFolder.folder((e.type ?? 'misc').replace(/[/\\:*?"<>|]/g, '_'))!
      const safeName = (e.name ?? 'Unnamed').replace(/[/\\:*?"<>|]/g, '_')
      folder.file(`${safeName}.md`, [entityFrontmatter(e), '', `# ${e.name ?? 'Unnamed'}`, '', wikilinkify(e.content ?? e.notes ?? '') || '_No content._'].join('\n'))
    }
    if (encounters.length) {
      const encFolder = root.folder('encounters')!
      encFolder.file('_index.md', [`# Encounters — ${campaign.name}`, '', ...encounters.map(enc => `- **${enc.name ?? 'Unnamed'}**`)].join('\n'))
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${campaign.name.replace(/[/\\:*?"<>|]/g, '_')}-${slug()}.zip`; a.click()
    URL.revokeObjectURL(url)
  } finally { mdExporting.value = false }
}

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
  modalPayload.value = markRaw(payload)
  buildImportSections(payload)
  modalPhase.value = 'configure'; logLines.value = []; progressDone.value = 0; progressTotal.value = 0
  modalOpen.value = true
}

function buildImportSections(payload: any) {
  const sections: ImportSection[] = []
  function addSection(key: string, label: string) {
    const arr: any[] | undefined = payload[key]
    if (arr && arr.length > 0) sections.push({ key, label, count: arr.length, enabled: true })
  }
  addSection('campaigns', 'Campaigns'); addSection('encounters', 'Encounters')
  addSection('encounterTokens', 'Encounter Tokens'); addSection('entities', 'Notes & Entities')
  addSection('entityLinks', 'Entity Links'); addSection('tokens', 'Tokens')
  addSection('systems', 'System Schemas')
  importSections.value = sections
  const records: any[] = payload.records ?? []
  if (records.length > 0) {
    const byType = new Map<string, number>()
    for (const r of records) byType.set(r.entityTypeId, (byType.get(r.entityTypeId) ?? 0) + 1)
    const nameLookup = new Map<string, string>()
    for (const sys of payload.systems ?? []) {
      let etArr: any[] = []
      try { etArr = typeof sys.entityTypes === 'string' ? JSON.parse(sys.entityTypes) : sys.entityTypes ?? [] } catch {}
      for (const et of etArr) { if (!nameLookup.has(et.id)) nameLookup.set(et.id, et.name) }
    }
    entityTypeRows.value = [...byType.entries()].map(([id, count]) => ({ id, name: nameLookup.get(id) ?? id, count, enabled: true }))
  } else { entityTypeRows.value = [] }
}

async function runImport() {
  if (!modalPayload.value) return
  const payload = modalPayload.value
  const db = getDb()
  modalPhase.value = 'running'; logLines.value = []; progressDone.value = 0
  const addLog = (ok: boolean, msg: string) => { logLines.value = [...logLines.value, { ok, msg }] }
  const systemIdRemap = new Map<number, number>()
  const systemsSec = importSections.value.find(s => s.key === 'systems')
  const hasEnabledRecords = entityTypeRows.value.some(r => r.enabled) && (payload.records?.length > 0)
  for (const sys of (payload.systems ?? [])) {
    const existing = sys.shortId ? await db.systems.where('shortId').equals(sys.shortId).first() : null
    if (systemsSec?.enabled) {
      try {
        if (existing) { await db.systems.put({ ...sys, id: existing.id }); systemIdRemap.set(sys.id, existing.id); addLog(true, `System updated: ${sys.name}`) }
        else { await db.systems.put(sys); systemIdRemap.set(sys.id, sys.id); addLog(true, `System imported: ${sys.name}`) }
      } catch (err) { addLog(false, `System failed: ${sys.name} — ${err}`) }
      progressDone.value++
    } else if (hasEnabledRecords) {
      if (existing) systemIdRemap.set(sys.id, existing.id)
      else addLog(false, `Warning: No existing system found for "${sys.name}" (shortId: ${sys.shortId}). Records for this system will be skipped.`)
    }
  }
  type WorkItem = { table: any; row: any }
  const work: WorkItem[] = []
  function queueSection(key: string, table: any) {
    if (key === 'systems') return
    const sec = importSections.value.find(s => s.key === key)
    if (!sec?.enabled) return
    for (const row of (payload[key] ?? [])) work.push({ table, row })
  }
  queueSection('campaigns', db.campaigns); queueSection('encounters', db.encounters)
  queueSection('encounterTokens', db.encounterTokens); queueSection('entities', db.entities)
  queueSection('entityLinks', db.entityLinks); queueSection('tokens', db.tokens)
  const enabledTypeIds = new Set(entityTypeRows.value.filter(r => r.enabled).map(r => r.id))
  for (const row of (payload.records ?? [])) {
    if (!enabledTypeIds.has(row.entityTypeId)) continue
    const targetSystemId = systemIdRemap.get(row.systemId)
    if (targetSystemId === undefined) continue
    const rec: any = { ...row, systemId: targetSystemId }
    if (rec.attributes !== undefined && rec.data === undefined) { rec.data = typeof rec.attributes === 'string' ? rec.attributes : JSON.stringify(rec.attributes); delete rec.attributes }
    if (typeof rec.data !== 'string') rec.data = JSON.stringify(rec.data ?? {})
    if (!rec.data) rec.data = '{}'
    work.push({ table: db.records, row: rec })
  }
  const systemCount = systemsSec?.enabled ? (payload.systems?.length ?? 0) : 0
  progressTotal.value = systemCount + work.length
  if (progressTotal.value === 0) { addLog(false, 'Nothing was selected to import.'); modalPhase.value = 'done'; return }
  const BATCH = 50
  for (let i = 0; i < work.length; i += BATCH) {
    const batch = work.slice(i, i + BATCH)
    const results = await Promise.allSettled(batch.map(item => item.table.put(item.row)))
    let batchOk = 0
    const newLines: LogLine[] = []
    for (let j = 0; j < batch.length; j++) {
      if (results[j].status === 'fulfilled') batchOk++
      else newLines.push({ ok: false, msg: `Failed: ${(results[j] as PromiseRejectedResult).reason}` })
      progressDone.value++
    }
    if (batchOk > 0) newLines.unshift({ ok: true, msg: `Imported ${batchOk} items (batch ${Math.floor(i / BATCH) + 1})` })
    logLines.value = [...logLines.value, ...newLines]
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  await loadStats()
  modalPhase.value = 'done'
}

async function clearAll() {
  if (!confirm('Permanently delete ALL data — campaigns, systems, tokens, everything?')) return
  if (!confirm('Last chance: this cannot be undone. Continue?')) return
  const db = getDb()
  await Promise.all([db.campaigns.clear(), db.encounters.clear(), db.encounterTokens.clear(), db.entities.clear(), db.entityLinks.clear(), db.tokens.clear(), db.systems.clear(), db.records.clear()])
  await loadStats()
  alert('All data has been wiped.')
}
</script>

<style scoped>
.settings-shell {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-width: 0;
  background: var(--bg);
}

/* Left nav */
.settings-nav {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 16px 8px;
  overflow-y: auto;
}

.settings-nav-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.settings-nav-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text3);
  padding: 4px 10px 6px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--r1);
  border: none;
  background: none;
  color: var(--text2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  font-family: var(--fu);
}
.settings-nav-item:hover { background: var(--surface-hi); color: var(--text); }
.settings-nav-item.active { background: var(--accent-bg); color: var(--accent); }
.settings-nav-item--danger { color: var(--danger); }
.settings-nav-item--danger:hover { background: var(--danger-bg); color: var(--danger); }
.settings-nav-item--danger.active { background: var(--danger-bg); color: var(--danger); }
.settings-nav-icon { font-size: 14px; flex-shrink: 0; opacity: 0.7; }

/* Body */
.settings-body {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 28px 32px;
}

/* Section */
.sett-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r3);
  overflow: hidden;
  max-width: 640px;
}

.sett-section-title {
  font-family: var(--fh);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text2);
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
}
.sett-section--danger .sett-section-title { color: var(--danger); }

.sett-group { display: flex; flex-direction: column; }

.sett-stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.sett-stat {
  font-family: var(--fm);
  font-size: 11px;
  color: var(--text3);
  background: var(--surface-hi);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 9px;
}

.sett-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.sett-row:last-child { border-bottom: none; }

.sett-row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.sett-label { font-size: 13px; font-weight: 500; color: var(--text); }
.sett-desc { font-size: 11px; color: var(--text3); line-height: 1.4; }

.sett-theme-pills { display: flex; gap: 4px; flex-shrink: 0; margin-top: 2px; }
.sett-pill-btn {
  padding: 4px 12px;
  border-radius: var(--r1);
  border: 1px solid var(--border);
  background: none;
  color: var(--text2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
  font-family: var(--fu);
}
.sett-pill-btn:hover { border-color: var(--border-hi); color: var(--text); }
.sett-pill-btn.active { background: var(--accent-bg); border-color: oklch(58% 0.24 295 / 0.4); color: var(--accent); font-weight: 500; }

.sett-toggle {
  flex-shrink: 0;
  width: 38px;
  height: 20px;
  border-radius: 10px;
  background: var(--surface-hi);
  border: 1px solid var(--border);
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
  background: var(--text3);
  transition: transform 0.2s, background 0.2s;
}
.sett-toggle.on { background: var(--accent-bg); border-color: oklch(58% 0.24 295 / 0.4); }
.sett-toggle.on::after { transform: translateX(18px); background: var(--accent); }

.sett-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: var(--r1);
  background: var(--surface-hi);
  border: 1px solid var(--border);
  color: var(--text2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
  margin-top: 2px;
  font-family: var(--fu);
}
.sett-btn:hover { border-color: var(--border-hi); color: var(--text); }
.sett-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.sett-btn--danger { color: var(--danger); border-color: oklch(54% 0.22 22 / 0.3); }
.sett-btn--danger:hover { background: var(--danger-bg); border-color: var(--danger); }

.sett-btn-pair { display: flex; gap: 4px; flex-shrink: 0; margin-top: 2px; }

.sett-md-select {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text);
  background: var(--surface-hi);
  border: 1px solid var(--border);
  border-radius: var(--r1);
  padding: 4px 8px;
  max-width: 220px;
  cursor: pointer;
  outline: none;
  font-family: var(--fu);
}
.sett-md-select:focus { border-color: oklch(58% 0.24 295 / 0.5); }

.sett-about { display: flex; align-items: center; gap: 16px; padding: 20px 16px; }
.sett-about-logo { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; opacity: 0.85; flex-shrink: 0; }
.sett-about-name { font-family: var(--fh); font-size: 16px; color: var(--text); margin-bottom: 3px; }
.sett-about-version { font-family: var(--fm); font-size: 11px; color: var(--accent); margin-bottom: 6px; }
.sett-about-desc { font-size: 12px; color: var(--text3); line-height: 1.5; }
</style>
