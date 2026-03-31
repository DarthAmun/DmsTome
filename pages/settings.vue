<template>
  <div class="book-shell">
    <div class="tome-page">

      <div class="page-header">
        <div class="page-chapter-num">DM's Tome</div>
        <h1 class="page-title">Settings &amp; Preferences</h1>
        <div class="page-rule" />
      </div>

      <div class="sett-body">

        <!-- ── Appearance ──────────────────────────────────────── -->
        <section class="sett-section">
          <h2 class="sett-section-title">
            <OhVueIcon name="md-brightness-4" scale="0.85" /> Appearance
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
                <span class="sett-desc">Page flip and entrance transitions when navigating</span>
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
                <span class="sett-desc">Animate headings letter by letter on page load</span>
              </div>
              <button class="sett-toggle" :class="{ on: settings.inkWrite }"
                @click="update('inkWrite', !settings.inkWrite)" />
            </div>
          </div>
        </section>

        <!-- ── Data Management ────────────────────────────────── -->
        <section class="sett-section">
          <h2 class="sett-section-title">
            <OhVueIcon name="md-storage" scale="0.85" /> Data Management
          </h2>
          <div class="sett-group">

            <!-- All -->
            <div class="sett-row">
              <div class="sett-row-text">
                <span class="sett-label">Everything</span>
                <span class="sett-desc">All campaigns, systems, tokens and records in one file</span>
              </div>
              <div class="sett-btn-pair">
                <button class="sett-btn" @click="exportAll">
                  <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                </button>
                <label class="sett-btn">
                  <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                  <input type="file" accept=".json" style="display:none" @change="importAll" />
                </label>
              </div>
            </div>

            <!-- Campaigns -->
            <div class="sett-row">
              <div class="sett-row-text">
                <span class="sett-label">Campaigns</span>
                <span class="sett-desc">All campaigns with their encounters, notes and entity links</span>
              </div>
              <div class="sett-btn-pair">
                <button class="sett-btn" @click="exportCampaigns">
                  <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                </button>
                <label class="sett-btn">
                  <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                  <input type="file" accept=".json" style="display:none" @change="importCampaigns" />
                </label>
              </div>
            </div>

            <!-- Systems (schema only) -->
            <div class="sett-row">
              <div class="sett-row-text">
                <span class="sett-label">Systems</span>
                <span class="sett-desc">Rule system schemas without records</span>
              </div>
              <div class="sett-btn-pair">
                <button class="sett-btn" @click="exportSystems(false)">
                  <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                </button>
                <label class="sett-btn">
                  <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                  <input type="file" accept=".json" style="display:none" @change="importSystems" />
                </label>
              </div>
            </div>

            <!-- Systems + records -->
            <div class="sett-row">
              <div class="sett-row-text">
                <span class="sett-label">Systems + Records</span>
                <span class="sett-desc">Rule system schemas including all their data records</span>
              </div>
              <div class="sett-btn-pair">
                <button class="sett-btn" @click="exportSystems(true)">
                  <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                </button>
                <label class="sett-btn">
                  <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                  <input type="file" accept=".json" style="display:none" @change="importSystemsWithRecords" />
                </label>
              </div>
            </div>

            <!-- Tokens -->
            <div class="sett-row">
              <div class="sett-row-text">
                <span class="sett-label">Tokens</span>
                <span class="sett-desc">All token templates and their images</span>
              </div>
              <div class="sett-btn-pair">
                <button class="sett-btn" @click="exportTokens">
                  <OhVueIcon name="md-filedownload" scale="0.8" /> Export
                </button>
                <label class="sett-btn">
                  <OhVueIcon name="md-fileupload" scale="0.8" /> Import
                  <input type="file" accept=".json" style="display:none" @change="importTokens" />
                </label>
              </div>
            </div>

          </div>
        </section>

        <!-- ── Danger Zone ─────────────────────────────────────── -->
        <section class="sett-section sett-section--danger">
          <h2 class="sett-section-title">
            <OhVueIcon name="md-warning-amber" scale="0.85" /> Danger Zone
          </h2>
          <div class="sett-group">
            <div class="sett-row">
              <div class="sett-row-text">
                <span class="sett-label">Wipe All Data</span>
                <span class="sett-desc">Permanently delete every campaign, session, system and token. This cannot be undone.</span>
              </div>
              <button class="sett-btn sett-btn--danger" @click="clearAll">
                <OhVueIcon name="md-delete-outlined" scale="0.8" /> Wipe
              </button>
            </div>
          </div>
        </section>

        <!-- ── About ──────────────────────────────────────────── -->
        <section class="sett-section sett-section--about">
          <div class="sett-about">
            <img src="/icons/icon-512.png" class="sett-about-logo" alt="DM's Tome" />
            <div class="sett-about-info">
              <div class="sett-about-name">DM's Tome</div>
              <div class="sett-about-version">Version {{ version }}</div>
              <div class="sett-about-desc">An offline-first campaign manager for Dungeon Masters. All data lives in your browser.</div>
            </div>
          </div>
        </section>

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
</template>

<script setup lang="ts">
import { getDb } from '~/composables/useDb'

const { public: { version } } = useRuntimeConfig()
const { settings, update } = useSettings()

// ── Helpers ────────────────────────────────────────────────────────
function download(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
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

// ── Import ─────────────────────────────────────────────────────────
async function importAll(e: Event) {
  const payload = await readJson(e)
  if (!payload) return
  if (!confirm('Import everything? Existing entries with the same ID will be overwritten.')) return
  const db = getDb()
  for (const item of payload.campaigns ?? [])       await db.campaigns.put(item)
  for (const item of payload.encounters ?? [])      await db.encounters.put(item)
  for (const item of payload.encounterTokens ?? []) await db.encounterTokens.put(item)
  for (const item of payload.entities ?? [])        await db.entities.put(item)
  for (const item of payload.entityLinks ?? [])     await db.entityLinks.put(item)
  for (const item of payload.tokens ?? [])          await db.tokens.put(item)
  for (const item of payload.systems ?? [])         await db.systems.put(item)
  for (const item of payload.records ?? [])         await db.records.put(item)
  alert('Import successful!')
}

async function importCampaigns(e: Event) {
  const payload = await readJson(e)
  if (!payload) return
  if (!confirm('Import campaigns? Existing entries with the same ID will be overwritten.')) return
  const db = getDb()
  for (const item of payload.campaigns ?? [])       await db.campaigns.put(item)
  for (const item of payload.encounters ?? [])      await db.encounters.put(item)
  for (const item of payload.encounterTokens ?? []) await db.encounterTokens.put(item)
  for (const item of payload.entities ?? [])        await db.entities.put(item)
  for (const item of payload.entityLinks ?? [])     await db.entityLinks.put(item)
  alert('Campaigns imported successfully!')
}

async function importSystems(e: Event) {
  const payload = await readJson(e)
  if (!payload) return
  if (!confirm('Import system schemas? Existing entries with the same ID will be overwritten.')) return
  const db = getDb()
  for (const item of payload.systems ?? []) await db.systems.put(item)
  alert('Systems imported successfully!')
}

async function importSystemsWithRecords(e: Event) {
  const payload = await readJson(e)
  if (!payload) return
  if (!confirm('Import systems and records? Existing entries with the same ID will be overwritten.')) return
  const db = getDb()
  for (const item of payload.systems ?? []) await db.systems.put(item)
  for (const item of payload.records ?? []) await db.records.put(item)
  alert('Systems and records imported successfully!')
}

async function importTokens(e: Event) {
  const payload = await readJson(e)
  if (!payload) return
  if (!confirm('Import tokens? Existing entries with the same ID will be overwritten.')) return
  const db = getDb()
  for (const item of payload.tokens ?? []) await db.tokens.put(item)
  alert('Tokens imported successfully!')
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
  overflow: hidden;
}

/* ── Scrollable body ── */
.sett-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 36px 40px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Section ── */
.sett-section {
  padding: 20px 0 4px;
  border-bottom: 1px solid var(--parch-line);
}
.sett-section:last-child { border-bottom: none; }

.sett-section-title {
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.sett-section--danger .sett-section-title { color: #c05040; }

/* ── Row ── */
.sett-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sett-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 10px 0;
  border-bottom: 1px solid var(--parch-line);
}
.sett-row:last-child { border-bottom: none; }

.sett-row-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.sett-label {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
}

.sett-desc {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--ink-ghost);
  line-height: 1.4;
}

/* ── Toggle switch ── */
.sett-toggle {
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: rgba(28, 20, 16, 0.12);
  border: 1px solid var(--parch-line);
  position: relative;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.sett-toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ink-ghost);
  transition: transform 0.2s, background 0.2s;
}
.sett-toggle.on {
  background: rgba(184, 134, 11, 0.25);
  border-color: rgba(184, 134, 11, 0.5);
}
.sett-toggle.on::after {
  transform: translateX(18px);
  background: var(--gold);
}

/* ── Action button ── */
.sett-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--r-pill, 999px);
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  color: var(--ink-faded);
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.sett-btn:hover {
  color: var(--ink);
  border-color: var(--gold);
}
.sett-btn-pair {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.sett-btn--danger {
  color: #c05040;
  border-color: rgba(192, 80, 64, 0.3);
}
.sett-btn--danger:hover {
  border-color: #c05040;
  background: rgba(192, 80, 64, 0.08);
}

/* ── About ── */
.sett-section--about { border-bottom: none; padding-top: 24px; }

.sett-about {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 0;
}
.sett-about-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  opacity: 0.85;
}
.sett-about-name {
  font-family: var(--font-deco);
  font-size: 16px;
  color: var(--ink);
  margin-bottom: 3px;
}
.sett-about-version {
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 5px;
}
.sett-about-desc {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--ink-ghost);
  line-height: 1.5;
}
</style>
