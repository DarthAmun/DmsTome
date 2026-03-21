<template>
  <div class="shell">
    <!-- Left rail -->
    <nav class="icon-rail">
      <div class="icon-rail-logo"><OhVueIcon name="gi-anvil-impact" /></div>
      <div class="rail-divider" />
      <button class="rail-icon-btn" :class="{ active: section === 'campaigns' }"
        title="Campaigns" @click="section = 'campaigns'">
        <OhVueIcon name="gi-broadsword" scale="1" />
      </button>
      <button class="rail-icon-btn" :class="{ active: section === 'systems' }"
        title="Systems" @click="section = 'systems'">
        <OhVueIcon name="gi-book-aura" scale="1" />
      </button>
      <button class="rail-icon-btn" :class="{ active: section === 'library' }"
        title="Library" @click="section = 'library'">
        <OhVueIcon name="gi-open-treasure-chest" scale="1" />
      </button>
      <div class="rail-spacer" />
      <button class="rail-fab" @click="createNew" :title="`New ${sectionLabel}`">+</button>
    </nav>

    <div class="shell-body">
      <!-- ── CAMPAIGNS ───────────────────────────────────────────────── -->
      <template v-if="section === 'campaigns'">
        <header class="top-bar">
          <span class="top-bar-title">Campaigns</span>
          <div class="top-bar-spacer" />
          <label class="nav-pill" style="cursor:pointer" title="Import backup">
            <OhVueIcon name="md-arrowback" scale="0.85" /> Import
            <input type="file" accept=".json" style="display:none" @change="importData" />
          </label>
        </header>
        <div class="main-canvas">
          <div class="section-grid">
            <div v-for="c in campaigns" :key="c.id" class="camp-card v6-card">
              <div class="camp-card-header">
                <span class="camp-initial">{{ c.name.charAt(0).toUpperCase() }}</span>
                <div class="camp-card-actions" @click.stop>
                  <button class="act-btn" @click.stop="exportData(c.id)" title="Export">
                    <OhVueIcon name="md-cloud" scale="0.8" />
                  </button>
                  <button class="act-btn act-btn--danger" @click.stop="deleteCampaign(c.id)" title="Delete">
                    <OhVueIcon name="md-delete" scale="0.8" />
                  </button>
                </div>
              </div>
              <div class="camp-card-body">
                <div class="camp-name">{{ c.name }}</div>
                <div v-if="c.description" class="camp-desc">{{ c.description }}</div>
                <div class="camp-system" v-if="systemName(c.system_id)">
                  <OhVueIcon name="gi-book-aura" scale="0.75" />
                  {{ systemName(c.system_id) }}
                </div>
                <div class="camp-date">{{ formatDate(c.updated_at) }}</div>
              </div>
              <div class="camp-modules" @click.stop>
                <NuxtLink :to="`/campaign/${c.id}/notes`" class="camp-module">Notes</NuxtLink>
                <NuxtLink :to="`/campaign/${c.id}/encounters`" class="camp-module">Encounters</NuxtLink>
                <NuxtLink :to="`/campaign/${c.id}/map`" class="camp-module">Map</NuxtLink>
              </div>
            </div>

            <div class="camp-card camp-card--new v6-card" @click="showNew = true">
              <OhVueIcon name="md-add" scale="2" style="opacity:0.2;margin-bottom:8px" />
              <span style="color:var(--secondary);font-size:13px;font-weight:500">New Campaign</span>
            </div>
          </div>
        </div>
      </template>

      <!-- ── SYSTEMS ────────────────────────────────────────────────── -->
      <template v-else-if="section === 'systems'">
        <header class="top-bar">
          <span class="top-bar-title">Systems</span>
          <div class="top-bar-spacer" />
          <label class="nav-pill" style="cursor:pointer" title="Import system schema">
            <OhVueIcon name="md-arrowback" scale="0.85" /> Import Schema
            <input type="file" accept=".json" style="display:none" @change="importSystem" />
          </label>
        </header>
        <div class="main-canvas">
          <div class="section-grid">
            <NuxtLink v-for="sys in systems" :key="sys.id!" :to="`/system/${sys.id}`"
              class="sys-card v6-card">
              <div class="sys-card-icon">
                <OhVueIcon name="gi-book-aura" scale="2.5" style="opacity:0.3" />
              </div>
              <div class="sys-card-body">
                <div class="sys-name">{{ sys.name }}</div>
                <div class="sys-version">v{{ sys.version }} · {{ sys.entityTypes.length }} types</div>
                <div v-if="sys.description" class="sys-desc">{{ sys.description }}</div>
              </div>
            </NuxtLink>
            <div class="sys-card sys-card--new v6-card" @click="showNewSystem = true">
              <OhVueIcon name="md-add" scale="2" style="opacity:0.2;margin-bottom:8px" />
              <span style="color:var(--secondary);font-size:13px;font-weight:500">New System</span>
            </div>
          </div>
        </div>
      </template>

      <!-- ── LIBRARY ────────────────────────────────────────────────── -->
      <template v-else>
        <header class="top-bar">
          <span class="top-bar-title">Library</span>
          <div class="top-bar-spacer" />
          <Select v-model="librarySystemFilter" :options="systemFilterOptions"
            option-label="label" option-value="value" style="width:180px" />
        </header>
        <div class="main-canvas">
          <div v-if="systems.length === 0" class="lib-empty">
            <p>No systems yet. Add a system first to create library content.</p>
          </div>
          <template v-else>
            <div v-for="sys in filteredSystems" :key="sys.id!" class="lib-system-section">
              <h2 class="lib-sys-name">{{ sys.name }}</h2>
              <div class="lib-types-row">
                <NuxtLink v-for="et in sys.entityTypes" :key="et.id"
                  :to="`/system/${sys.id}/${et.id}`"
                  class="lib-type-chip"
                  :style="{ borderColor: et.color + '55', color: et.color }">
                  <OhVueIcon :name="et.icon" scale="0.85" />
                  {{ et.plural }}
                </NuxtLink>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- New campaign dialog -->
    <div v-if="showNew" class="dialog-backdrop" @click.self="showNew = false">
      <div class="dialog-box">
        <h3 class="dialog-title">New Campaign</h3>
        <div class="dialog-field">
          <label class="f-label">Name</label>
          <input class="f-input" v-model="newCamp.name" placeholder="Curse of Strahd…"
            @keyup.enter="createCampaign" autofocus />
        </div>
        <div class="dialog-field">
          <label class="f-label">Description</label>
          <input class="f-input" v-model="newCamp.description" placeholder="Optional…" />
        </div>
        <div class="dialog-field">
          <label class="f-label">System</label>
          <Select v-model="newCamp.systemId" :options="systemOptions"
            option-label="label" option-value="value" placeholder="— optional —" />
        </div>
        <div class="dialog-actions">
          <button class="btn-primary-pill" @click="createCampaign">Create</button>
          <button class="btn-ghost-pill" @click="showNew = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- New system dialog -->
    <div v-if="showNewSystem" class="dialog-backdrop" @click.self="showNewSystem = false">
      <div class="dialog-box">
        <h3 class="dialog-title">New System</h3>
        <div class="dialog-field">
          <label class="f-label">Name</label>
          <input class="f-input" v-model="newSys.name" placeholder="Pathfinder 2e…" autofocus />
        </div>
        <div class="dialog-field">
          <label class="f-label">Short ID <span style="color:var(--muted);font-weight:400">(used internally)</span></label>
          <input class="f-input f-mono" v-model="newSys.shortId" placeholder="pf2e" />
        </div>
        <div class="dialog-field">
          <label class="f-label">Description</label>
          <input class="f-input" v-model="newSys.description" placeholder="Optional…" />
        </div>
        <div class="dialog-actions">
          <button class="btn-primary-pill" @click="createSystem">Create</button>
          <button class="btn-ghost-pill" @click="showNewSystem = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
import { getDb } from '~/composables/useDb'

const router = useRouter()
const systemsStore = useSystemsStore()

const section = ref<'campaigns' | 'systems' | 'library'>('campaigns')
const sectionLabel = computed(() => ({ campaigns: 'Campaign', systems: 'System', library: '' }[section.value]))

const campaigns = ref<any[]>([])
const showNew = ref(false)
const showNewSystem = ref(false)
const newCamp = ref({ name: '', description: '', systemId: null as number | null })
const newSys = ref({ name: '', shortId: '', description: '' })
const librarySystemFilter = ref<number | null>(null)

const systems = computed(() => systemsStore.systems)
const systemOptions = computed(() => [
  { label: '— none —', value: null },
  ...systemsStore.systems.map(s => ({ label: s.name, value: s.id! })),
])
const systemFilterOptions = computed(() => [
  { label: 'All systems', value: null },
  ...systemsStore.systems.map(s => ({ label: s.name, value: s.id! })),
])
const filteredSystems = computed(() =>
  librarySystemFilter.value
    ? systems.value.filter(s => s.id === librarySystemFilter.value)
    : systems.value
)

function systemName(id?: number | null) {
  if (!id) return null
  return systemsStore.getSystem(id)?.name ?? null
}

onMounted(async () => {
  await systemsStore.loadAll()
  campaigns.value = await window.dmforge.campaigns.list()
})

function createNew() {
  if (section.value === 'campaigns') showNew.value = true
  else if (section.value === 'systems') showNewSystem.value = true
}

async function createCampaign() {
  if (!newCamp.value.name.trim()) return
  const c = await window.dmforge.campaigns.create({ name: newCamp.value.name, description: newCamp.value.description })
  if (newCamp.value.systemId) {
    await getDb().campaigns.update(c.id, { system_id: newCamp.value.systemId })
    c.system_id = newCamp.value.systemId
  }
  campaigns.value.unshift(c)
  newCamp.value = { name: '', description: '', systemId: null }
  showNew.value = false
  openCampaign(c)
}

async function createSystem() {
  if (!newSys.value.name.trim()) return
  const sys = await systemsStore.createSystem(newSys.value)
  newSys.value = { name: '', shortId: '', description: '' }
  showNewSystem.value = false
  router.push(`/system/${sys.id}/builder`)
}

function openCampaign(c: any) {
  router.push(`/campaign/${c.id}`)
}

async function deleteCampaign(id: number) {
  if (!confirm('Delete this campaign and all its data?')) return
  await window.dmforge.campaigns.delete(id)
  campaigns.value = campaigns.value.filter(c => c.id !== id)
}

async function importSystem(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const sys = await systemsStore.importSystem(text)
  router.push(`/system/${sys.id}`)
}

async function exportData(campaignId: number) {
  const db = getDb()
  const camp = campaigns.value.find(c => c.id === campaignId)
  const encounters = await db.encounters.where('campaign_id').equals(campaignId).toArray()
  const encIds = encounters.map((e: any) => e.id as number)
  const encounterTokens = encIds.length ? await db.encounterTokens.where('encounter_id').anyOf(encIds).toArray() : []
  const entities = await db.entities.where('campaign_id').equals(campaignId).toArray()
  const entIds = entities.map((e: any) => e.id as number)
  const entityLinks = entIds.length ? await db.entityLinks.where('source_id').anyOf(entIds).toArray() : []
  const tokens = await db.tokens.toArray()
  const payload = { version: 1, exportedAt: new Date().toISOString(), campaign: camp, encounters, encounterTokens, entities, entityLinks, tokens }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dm-forge-${camp?.name?.replace(/\s+/g, '-') ?? campaignId}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!confirm('Import this backup? Existing data with matching IDs will be overwritten.')) return
  try {
    const text = await file.text()
    const payload = JSON.parse(text)
    if (!payload.version || !payload.campaign) { alert('Invalid backup file'); return }
    const db = getDb()
    const now = new Date().toISOString()
    await db.campaigns.put({ ...payload.campaign, updated_at: payload.campaign.updated_at ?? now, created_at: payload.campaign.created_at ?? now })
    for (const t of payload.tokens ?? []) await db.tokens.put(t)
    for (const enc of payload.encounters ?? []) await db.encounters.put(enc)
    for (const et of payload.encounterTokens ?? []) await db.encounterTokens.put(et)
    for (const ent of payload.entities ?? []) await db.entities.put(ent)
    for (const lnk of payload.entityLinks ?? []) await db.entityLinks.put(lnk)
    campaigns.value = await window.dmforge.campaigns.list()
    alert('Import successful!')
  } catch (err: any) {
    alert('Import failed: ' + err.message)
  }
}

function formatDate(dt: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.shell { display: flex; height: 100vh; overflow: hidden; }
.shell-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.rail-divider { width: 24px; height: 1px; background: var(--border); margin: 4px 0; }
.top-bar-spacer { flex: 1; }
.main-canvas { flex: 1; overflow-y: auto; padding: 28px 24px; }
.section-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }

/* Campaign cards */
.camp-card { display: flex; flex-direction: column; overflow: hidden; cursor: pointer; }
.camp-card-header { display: flex; align-items: center; padding: 20px 20px 12px; background: linear-gradient(135deg, var(--raised) 0%, var(--card) 100%); }
.camp-initial { font-family: var(--font-display); font-size: 32px; font-weight: 900; color: var(--gold); flex: 1; }
.camp-card-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
.camp-card:hover .camp-card-actions { opacity: 1; }
.camp-card-body { padding: 0 20px 12px; flex: 1; }
.camp-name { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
.camp-desc { font-size: 12px; color: var(--secondary); margin-bottom: 6px; }
.camp-system { font-size: 11px; color: var(--gold); display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.camp-date { font-size: 10px; color: var(--muted); }
.camp-modules { display: flex; gap: 4px; padding: 10px 20px; border-top: 1px solid var(--border); }
.camp-module { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; padding: 2px 8px; border-radius: 999px; background: var(--raised); color: var(--muted); text-decoration: none; transition: all 0.15s; }
.camp-module:hover { background: var(--hover); color: var(--text); }
.camp-card--new { align-items: center; justify-content: center; min-height: 160px; border: 2px dashed var(--border); box-shadow: none; background: transparent; }
.camp-card--new:hover { border-color: var(--border-l); background: var(--card); }

/* System cards */
.sys-card { display: flex; flex-direction: column; overflow: hidden; text-decoration: none; }
.sys-card-icon { height: 80px; display: flex; align-items: center; justify-content: center; background: var(--raised); }
.sys-card-body { padding: 14px 16px; }
.sys-name { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 3px; }
.sys-version { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
.sys-desc { font-size: 12px; color: var(--secondary); }
.sys-card--new { align-items: center; justify-content: center; min-height: 140px; border: 2px dashed var(--border); box-shadow: none; background: transparent; cursor: pointer; }
.sys-card--new:hover { border-color: var(--border-l); background: var(--card); }

/* Library */
.lib-system-section { margin-bottom: 28px; }
.lib-sys-name { font-family: var(--font-display); font-size: 18px; font-weight: 800; text-transform: uppercase; color: var(--text); margin-bottom: 12px; }
.lib-types-row { display: flex; flex-wrap: wrap; gap: 8px; }
.lib-type-chip { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 999px; background: var(--card); border: 1px solid; text-decoration: none; font-size: 13px; font-weight: 600; transition: all 0.15s; }
.lib-type-chip:hover { background: var(--raised); transform: translateY(-1px); }
.lib-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--secondary); font-size: 13px; }

/* Action buttons */
.act-btn { width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.5); border: none; color: var(--secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.act-btn:hover { color: var(--text); }
.act-btn--danger:hover { color: var(--danger); }

/* Dialogs */
.dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 500; display: flex; align-items: center; justify-content: center; }
.dialog-box { background: var(--card); border-radius: 18px; padding: 28px; width: 400px; max-width: 90vw; display: flex; flex-direction: column; gap: 16px; }
.dialog-title { font-family: var(--font-display); font-size: 20px; font-weight: 800; text-transform: uppercase; color: var(--text); }
.dialog-field { display: flex; flex-direction: column; gap: 5px; }
.dialog-actions { display: flex; gap: 10px; padding-top: 4px; }
.btn-primary-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 999px; background: var(--gold); color: #0d0d0d; font-size: 13px; font-weight: 700; border: none; cursor: pointer; text-decoration: none; transition: all 0.15s; }
.btn-primary-pill:hover { background: #f5cb4a; }
.btn-ghost-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 999px; background: var(--raised); border: 1px solid var(--border); color: var(--secondary); font-size: 13px; cursor: pointer; transition: all 0.15s; }
.btn-ghost-pill:hover { color: var(--text); }
.f-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
</style>
