<template>
  <div class="book-shell">
    <!-- THE OPEN BOOK -->
    <div class="tome-page page-enter">

      <!-- Page header -->
      <div class="page-header">
        <div class="page-chapter-num">DM's Tome</div>
        <h1 class="page-title">{{ chapterTitle }}</h1>
        <div class="page-rule" />
      </div>

      <!-- Page content -->
      <div class="page-content" :data-page="currentPage">

        <!-- ── CAMPAIGNS ─────────────────────────────────────── -->
        <template v-if="section === 'campaigns'">
          <div class="campaigns-index ink-drop">
            <!-- Intro blurb -->
            <p class="tome-intro">
              <em>A record of all campaigns undertaken. Select a volume to continue the chronicle, or begin a new one.</em>
            </p>

            <!-- Campaign entries — like an index -->
            <div class="index-list">
              <div v-for="c in campaigns" :key="c.id"
                class="entry" @click="openCampaign(c)">
                <div class="entry-icon">
                  <OhVueIcon :name="'gi-broadsword'" scale="0.9" style="color:var(--blood)" />
                </div>
                <span class="entry-name">
                  {{ c.name }}
                  <em v-if="c.description">— {{ c.description }}</em>
                </span>
                <span class="entry-dots" />
                <span v-if="systemName(c.system_id)" class="entry-tag" style="color:var(--gold);border-color:var(--gold)">
                  {{ systemName(c.system_id) }}
                </span>
                <span class="entry-date">{{ formatDate(c.updated_at) }}</span>
                <div class="entry-actions" @click.stop>
                  <button class="entry-act" @click.stop="exportData(c.id)" title="Export">
                    <OhVueIcon name="md-cloud" scale="0.75" />
                  </button>
                  <button class="entry-act entry-act--del" @click.stop="deleteCampaign(c.id)">
                    <OhVueIcon name="md-delete" scale="0.75" />
                  </button>
                </div>
              </div>

              <div v-if="!campaigns.length" class="tome-empty-inline">
                <em>No campaigns yet. Write the first entry.</em>
              </div>
            </div>

            <!-- New campaign button — quill flourish style -->
            <div class="new-entry-row">
              <button class="new-entry-btn" @click="showNew = true">
                <span class="new-entry-line" />
                <span class="new-entry-label">✦ Begin New Campaign ✦</span>
                <span class="new-entry-line" />
              </button>
            </div>

            <!-- Import -->
            <div class="tome-footnote">
              <label class="tome-footnote-link">
                ↑ Restore from backup
                <input type="file" accept=".json" style="display:none" @change="importData" />
              </label>
            </div>
          </div>
        </template>

        <!-- ── SYSTEMS ──────────────────────────────────────── -->
        <template v-else-if="section === 'systems'">
          <div class="ink-drop">
            <p class="tome-intro">
              <em>The rule compendium. Each system defines the entities and attributes used within its campaigns.</em>
            </p>

            <div class="index-list">
              <NuxtLink v-for="sys in systems" :key="sys.id!" :to="`/system/${sys.id}`" class="entry">
                <div class="entry-icon">
                  <OhVueIcon name="gi-scroll-unfurled" scale="0.9" style="color:var(--arcane)" />
                </div>
                <span class="entry-name">
                  {{ sys.name }}
                  <em v-if="sys.description">— {{ sys.description }}</em>
                </span>
                <span class="entry-dots" />
                <span class="entry-tag" style="color:var(--ink-faded);border-color:var(--ink-ghost)">
                  {{ sys.entityTypes.length }} types
                </span>
                <span class="entry-date">v{{ sys.version }}</span>
              </NuxtLink>

              <div v-if="!systems.length" class="tome-empty-inline">
                <em>No systems defined. Add one to begin building your codex.</em>
              </div>
            </div>

            <div class="new-entry-row">
              <button class="new-entry-btn" @click="showNewSystem = true">
                <span class="new-entry-line" />
                <span class="new-entry-label">✦ Define New System ✦</span>
                <span class="new-entry-line" />
              </button>
            </div>

            <div class="tome-footnote">
              <label class="tome-footnote-link">
                ↑ Import system schema
                <input type="file" accept=".json" style="display:none" @change="importSystem" />
              </label>
            </div>
          </div>
        </template>

        <!-- ── LIBRARY ──────────────────────────────────────── -->
        <template v-else>
          <div class="ink-drop">
            <p class="tome-intro">
              <em>The great library. All records across all systems.</em>
            </p>

            <div v-if="!systems.length" class="tome-empty-inline">
              <em>Define a system first to populate the library.</em>
            </div>

            <div v-for="sys in systems" :key="sys.id!" class="library-chapter">
              <div class="library-chapter-head">
                <span class="library-chapter-name">{{ sys.name }}</span>
                <span class="library-rule-line" />
              </div>
              <div class="library-entries">
                <NuxtLink v-for="et in sys.entityTypes" :key="et.id"
                  :to="`/system/${sys.id}/${et.id}`"
                  class="library-entry"
                  :style="{ '--type-color': et.color }">
                  <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="0.9" />
                  <span>{{ et.plural }}</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- SPINE TABS -->
    <nav class="spine-tabs">
      <button class="spine-tab" :class="{ active: section === 'campaigns' }"
        @click="section = 'campaigns'">
        <OhVueIcon name="gi-broadsword" scale="0.85" />
        Campaigns
      </button>
      <button class="spine-tab" :class="{ active: section === 'systems' }"
        @click="section = 'systems'">
        <OhVueIcon name="gi-scroll-unfurled" scale="0.85" />
        Systems
      </button>
      <button class="spine-tab" :class="{ active: section === 'library' }"
        @click="section = 'library'">
        <OhVueIcon name="gi-open-treasure-chest" scale="0.85" />
        Library
      </button>
    </nav>

    <!-- DIALOGS -->
    <Teleport to="body">
      <div v-if="showNew" class="pv-dialog-mask" @click.self="showNew = false">
        <div class="pv-dialog">
          <div class="pv-dialog-header">
            <span class="pv-dialog-title">Begin a New Campaign</span>
            <button class="pv-dialog-close" @click="showNew = false">
              <OhVueIcon name="md-close" scale="0.85" />
            </button>
          </div>
          <div class="pv-dialog-content">
            <div style="margin-bottom:16px">
              <label class="f-label">Title</label>
              <input class="f-input-box" v-model="newCamp.name" placeholder="Curse of Strahd…" @keyup.enter="createCampaign" autofocus />
            </div>
            <div style="margin-bottom:16px">
              <label class="f-label">Chronicle</label>
              <input class="f-input-box" v-model="newCamp.description" placeholder="A dark tale of…" />
            </div>
            <div>
              <label class="f-label">System</label>
              <Select v-model="newCamp.systemId" :options="sysOptions" option-label="label" option-value="value" placeholder="— none —" />
            </div>
          </div>
          <div class="pv-dialog-footer">
            <button class="ghost-btn" @click="showNew = false">Cancel</button>
            <button class="seal-btn" @click="createCampaign">Begin</button>
          </div>
        </div>
      </div>

      <div v-if="showNewSystem" class="pv-dialog-mask" @click.self="showNewSystem = false">
        <div class="pv-dialog">
          <div class="pv-dialog-header">
            <span class="pv-dialog-title">Define a New System</span>
            <button class="pv-dialog-close" @click="showNewSystem = false">
              <OhVueIcon name="md-close" scale="0.85" />
            </button>
          </div>
          <div class="pv-dialog-content">
            <div style="margin-bottom:16px">
              <label class="f-label">Name</label>
              <input class="f-input-box" v-model="newSys.name" placeholder="Pathfinder 2e…" autofocus />
            </div>
            <div style="margin-bottom:16px">
              <label class="f-label">Short ID</label>
              <input class="f-input-box" style="font-family:var(--font-mono);font-size:12px" v-model="newSys.shortId" placeholder="pf2e" />
            </div>
            <div>
              <label class="f-label">Description</label>
              <input class="f-input-box" v-model="newSys.description" placeholder="Optional…" />
            </div>
          </div>
          <div class="pv-dialog-footer">
            <button class="ghost-btn" @click="showNewSystem = false">Cancel</button>
            <button class="seal-btn" @click="createSystem">Create</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
import { getDb } from '~/composables/useDb'

const router = useRouter()
const store = useSystemsStore()

const section = ref<'campaigns'|'systems'|'library'>('campaigns')
const campaigns = ref<any[]>([])
const showNew = ref(false)
const showNewSystem = ref(false)
const newCamp = ref({ name: '', description: '', systemId: null as number|null })
const newSys = ref({ name: '', shortId: '', description: '' })

const chapterTitle = computed(() => ({ campaigns: 'The Chronicle', systems: 'The Codex', library: 'The Library' }[section.value]))
const currentPage = computed(() => ({ campaigns: 'I', systems: 'II', library: 'III' }[section.value]))
const systems = computed(() => store.systems)
const sysOptions = computed(() => [{ label:'— none —', value:null }, ...store.systems.map(s => ({ label:s.name, value:s.id! }))])

function systemName(id?: number|null) { return id ? store.getSystem(id)?.name ?? null : null }

onMounted(async () => {
  await store.loadAll()
  campaigns.value = await window.dmforge.campaigns.list()
})

function openCampaign(c: any) { router.push(`/campaign/${c.id}`) }

async function createCampaign() {
  if (!newCamp.value.name.trim()) return
  const c = await window.dmforge.campaigns.create({ name: newCamp.value.name, description: newCamp.value.description })
  if (newCamp.value.systemId) { await getDb().campaigns.update(c.id, { system_id: newCamp.value.systemId }); c.system_id = newCamp.value.systemId }
  campaigns.value.unshift(c)
  newCamp.value = { name: '', description: '', systemId: null }
  showNew.value = false
  openCampaign(c)
}

async function createSystem() {
  if (!newSys.value.name.trim()) return
  const sys = await store.createSystem(newSys.value)
  newSys.value = { name: '', shortId: '', description: '' }
  showNewSystem.value = false
  router.push(`/system/${sys.id}/builder`)
}

async function deleteCampaign(id: number) {
  if (!confirm('Delete this campaign?')) return
  await window.dmforge.campaigns.delete(id)
  campaigns.value = campaigns.value.filter(c => c.id !== id)
}

async function importSystem(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
  const sys = await store.importSystem(await file.text())
  router.push(`/system/${sys.id}`)
}

async function exportData(campaignId: number) {
  const db = getDb(); const camp = campaigns.value.find(c => c.id === campaignId)
  const encounters = await db.encounters.where('campaign_id').equals(campaignId).toArray()
  const encIds = encounters.map((e:any) => e.id as number)
  const encounterTokens = encIds.length ? await db.encounterTokens.where('encounter_id').anyOf(encIds).toArray() : []
  const entities = await db.entities.where('campaign_id').equals(campaignId).toArray()
  const entIds = entities.map((e:any) => e.id as number)
  const entityLinks = entIds.length ? await db.entityLinks.where('source_id').anyOf(entIds).toArray() : []
  const tokens = await db.tokens.toArray()
  const blob = new Blob([JSON.stringify({ version:1, exportedAt:new Date().toISOString(), campaign:camp, encounters, encounterTokens, entities, entityLinks, tokens }, null, 2)], { type:'application/json' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = `dmstome-${camp?.name?.replace(/\s+/g,'-')??campaignId}-${new Date().toISOString().slice(0,10)}.json`
  a.click(); URL.revokeObjectURL(url)
}

async function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
  if (!confirm('Import this backup?')) return
  try {
    const payload = JSON.parse(await file.text())
    if (!payload.version || !payload.campaign) { alert('Invalid backup'); return }
    const db = getDb(); const now = new Date().toISOString()
    await db.campaigns.put({ ...payload.campaign, updated_at: payload.campaign.updated_at??now, created_at: payload.campaign.created_at??now })
    for (const t of payload.tokens??[]) await db.tokens.put(t)
    for (const enc of payload.encounters??[]) await db.encounters.put(enc)
    for (const et of payload.encounterTokens??[]) await db.encounterTokens.put(et)
    for (const ent of payload.entities??[]) await db.entities.put(ent)
    for (const lnk of payload.entityLinks??[]) await db.entityLinks.put(lnk)
    campaigns.value = await window.dmforge.campaigns.list()
    alert('Import successful!')
  } catch(err:any) { alert('Import failed: ' + err.message) }
}

function formatDate(dt: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}
</script>

<style scoped>
/* Index layout */
.campaigns-index { padding-bottom: 20px; }

.tome-intro {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--ink-faded);
  margin-bottom: 28px;
  line-height: 1.7;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--parch-line);
}

.index-list { display: flex; flex-direction: column; margin-bottom: 28px; }

/* Entry actions — hidden until hover */
.entry-actions {
  display: flex; gap: 3px;
  opacity: 0; transition: opacity 0.15s;
}
.entry:hover .entry-actions { opacity: 1; }

.entry-act {
  width: 22px; height: 22px; border-radius: 3px;
  background: rgba(28,20,16,0.08); border: 1px solid transparent;
  color: var(--ink-ghost); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.entry-act:hover { background: rgba(28,20,16,0.15); color: var(--ink-faded); }
.entry-act--del:hover { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }

/* New entry row — the ornamental divider */
.new-entry-row { display: flex; align-items: center; margin-bottom: 20px; }

.new-entry-btn {
  display: flex; align-items: center; gap: 16px; width: 100%;
  background: none; border: none; cursor: pointer;
  transition: all 0.2s; padding: 8px 0;
}

.new-entry-line {
  flex: 1; height: 1px;
  background: linear-gradient(to right, transparent, var(--ink-ghost));
}
.new-entry-btn:nth-child(1) .new-entry-line:last-child {
  background: linear-gradient(to left, transparent, var(--ink-ghost));
}

.new-entry-label {
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  white-space: nowrap;
  transition: color 0.2s;
  flex-shrink: 0;
}
.new-entry-btn:hover .new-entry-label { color: var(--blood); }
.new-entry-btn:hover .new-entry-line { background: linear-gradient(to right, transparent, var(--blood)); }

.tome-empty-inline {
  padding: 24px 0;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--ink-ghost);
  text-align: center;
}

.tome-footnote {
  font-family: var(--font-head);
  font-size: 9px;
  letter-spacing: 0.12em;
  color: var(--ink-ghost);
}

.tome-footnote-link {
  color: var(--ink-ghost);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: color 0.15s;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 9px;
}
.tome-footnote-link:hover { color: var(--gold); }

/* Library */
.library-chapter { margin-bottom: 28px; }
.library-chapter-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.library-chapter-name { font-family: var(--font-head); font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-faded); flex-shrink: 0; }
.library-rule-line { flex: 1; height: 1px; background: var(--parch-line); }

.library-entries { display: flex; flex-wrap: wrap; gap: 8px; }

.library-entry {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: var(--parch-dark);
  border: 1px solid var(--ink-ghost);
  border-radius: 2px;
  text-decoration: none;
  font-family: var(--font-head);
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--type-color, var(--ink-faded));
  transition: all 0.18s;
}
.library-entry:hover {
  background: var(--ink);
  color: var(--parch);
  border-color: var(--ink);
  transform: translateY(-1px);
}
</style>
