<template>
  <div class="book-shell">
    <div class="tome-page page-enter">

      <!-- Page header -->
      <div class="page-header">
        <div class="page-chapter-num">DM's Tome</div>
        <h1 class="page-title">{{ chapterTitle }}</h1>
        <div class="page-rule" />
      </div>

      <!-- Open book spread -->
      <div class="open-book">

        <!-- LEFT PAGE — the list -->
        <div class="book-leaf book-leaf--left">
          <div class="leaf-inner">

            <!-- CAMPAIGNS -->
            <template v-if="section === 'campaigns'">
              <div class="leaf-header">
                <span class="leaf-type" style="color:var(--blood)">Campaigns</span>
                <span class="leaf-count">{{ campaigns.length }} entries</span>
              </div>
              <div v-for="c in campaigns" :key="c.id" class="entry" @click="openCampaign(c)">
                <div class="entry-icon">
                  <OhVueIcon name="gi-broadsword" scale="0.9" style="color:var(--blood)" />
                </div>
                <span class="entry-name">{{ c.name }}
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
              <div v-if="!campaigns.length" class="leaf-empty">
                <OhVueIcon name="gi-broadsword" scale="2.5" style="opacity:0.07;margin-bottom:10px" />
                <em>No campaigns yet. Write the first entry.</em>
              </div>
            </template>

            <!-- SYSTEMS -->
            <template v-else-if="section === 'systems'">
              <div class="leaf-header">
                <span class="leaf-type" style="color:var(--arcane-l)">Systems</span>
                <span class="leaf-count">{{ systems.length }} defined</span>
              </div>
              <NuxtLink v-for="sys in systems" :key="sys.id!" :to="`/system/${sys.id}`" class="entry">
                <div class="entry-icon">
                  <OhVueIcon name="gi-scroll-unfurled" scale="0.9" style="color:var(--arcane-l)" />
                </div>
                <span class="entry-name">{{ sys.name }}
                  <em v-if="sys.description">— {{ sys.description }}</em>
                </span>
                <span class="entry-dots" />
                <span class="entry-tag" style="color:var(--ink-faded);border-color:var(--ink-ghost)">
                  {{ sys.entityTypes.length }} types
                </span>
                <span class="entry-date">v{{ sys.version }}</span>
              </NuxtLink>
              <div v-if="!systems.length" class="leaf-empty">
                <OhVueIcon name="gi-scroll-unfurled" scale="2.5" style="opacity:0.07;margin-bottom:10px" />
                <em>No systems defined yet.</em>
              </div>
            </template>

            <!-- LIBRARY -->
            <template v-else>
              <div class="leaf-header">
                <span class="leaf-type" style="color:var(--gold)">Library</span>
                <span class="leaf-count">all records</span>
              </div>
              <div v-if="!systems.length" class="leaf-empty">
                <em>Define a system first to populate the library.</em>
              </div>
              <div v-for="sys in systems" :key="sys.id!" class="lib-system">
                <div class="lib-system-head">
                  <span class="lib-system-name">{{ sys.name }}</span>
                  <span class="lib-rule" />
                </div>
                <div class="lib-chips">
                  <NuxtLink v-for="et in sys.entityTypes" :key="et.id"
                    :to="`/system/${sys.id}/${et.id}`"
                    class="lib-chip" :style="{ '--chip-color': et.color }">
                    <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="0.85" />
                    {{ et.plural }}
                  </NuxtLink>
                </div>
              </div>
            </template>

          </div>

          <!-- Footer -->
          <div class="leaf-footer">
            <template v-if="section === 'campaigns'">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <button class="leaf-new" @click="showNew = true" style="flex:1">
                  <span class="leaf-new-line-l" />
                  <span class="leaf-new-label">✦ Begin New Campaign ✦</span>
                  <span class="leaf-new-line-r" />
                </button>
              </div>
              <div class="leaf-footnote">
                <label class="leaf-footnote-link">
                  ↑ Restore from backup
                  <input type="file" accept=".json" style="display:none" @change="importData" />
                </label>
              </div>
            </template>
            <template v-else-if="section === 'systems'">
              <button class="leaf-new" @click="showNewSystem = true">
                <span class="leaf-new-line-l" />
                <span class="leaf-new-label">✦ Define New System ✦</span>
                <span class="leaf-new-line-r" />
              </button>
              <div class="leaf-footnote">
                <label class="leaf-footnote-link">
                  ↑ Import system schema
                  <input type="file" accept=".json" style="display:none" @change="importSystem" />
                </label>
              </div>
            </template>
          </div>
        </div>

        <!-- BINDING -->
        <div class="book-binding" />

        <!-- RIGHT PAGE — decorative / hint -->
        <div class="book-leaf book-leaf--right">
          <div class="leaf-inner--right">
            <template v-if="section === 'campaigns'">
              <OhVueIcon name="gi-broadsword" scale="4" style="opacity:0.05;margin-bottom:24px" />
              <p class="right-hint">
                <em>Select a campaign to continue<br>your adventure.</em>
              </p>
            </template>
            <template v-else-if="section === 'systems'">
              <OhVueIcon name="gi-scroll-unfurled" scale="4" style="opacity:0.05;margin-bottom:24px" />
              <p class="right-hint">
                <em>Each system defines the entities<br>and fields for your campaigns.</em>
              </p>
            </template>
            <template v-else>
              <OhVueIcon name="gi-open-treasure-chest" scale="4" style="opacity:0.05;margin-bottom:24px" />
              <p class="right-hint">
                <em>Browse all records across<br>every system.</em>
              </p>
            </template>
          </div>
        </div>

      </div>
    </div>

    <!-- SPINE TABS -->
    <nav class="spine-tabs">
      <button class="spine-tab" :class="{ active: section === 'campaigns' }" @click="section = 'campaigns'">
        <OhVueIcon name="gi-broadsword" scale="0.85" />
        Campaigns
      </button>
      <button class="spine-tab" :class="{ active: section === 'systems' }" @click="section = 'systems'">
        <OhVueIcon name="gi-scroll-unfurled" scale="0.85" />
        Systems
      </button>
      <button class="spine-tab" :class="{ active: section === 'library' }" @click="section = 'library'">
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
            <button class="pv-dialog-close" @click="showNew = false"><OhVueIcon name="md-close" scale="0.85" /></button>
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
            <button class="pv-dialog-close" @click="showNewSystem = false"><OhVueIcon name="md-close" scale="0.85" /></button>
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

const section = ref<'campaigns' | 'systems' | 'library'>('campaigns')
const campaigns = ref<any[]>([])
const showNew = ref(false)
const showNewSystem = ref(false)
const newCamp = ref({ name: '', description: '', systemId: null as number | null })
const newSys = ref({ name: '', shortId: '', description: '' })

const chapterTitle = computed(() => ({ campaigns: 'The Chronicle', systems: 'The Codex', library: 'The Library' }[section.value]))
const systems = computed(() => store.systems)
const sysOptions = computed(() => [{ label: '— none —', value: null }, ...store.systems.map(s => ({ label: s.name, value: s.id! }))])
function systemName(id?: number | null) { return id ? store.getSystem(id)?.name ?? null : null }

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
  const encIds = encounters.map((e: any) => e.id as number)
  const encounterTokens = encIds.length ? await db.encounterTokens.where('encounter_id').anyOf(encIds).toArray() : []
  const entities = await db.entities.where('campaign_id').equals(campaignId).toArray()
  const entIds = entities.map((e: any) => e.id as number)
  const entityLinks = entIds.length ? await db.entityLinks.where('source_id').anyOf(entIds).toArray() : []
  const tokens = await db.tokens.toArray()
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), campaign: camp, encounters, encounterTokens, entities, entityLinks, tokens }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = `dmstome-${camp?.name?.replace(/\s+/g, '-') ?? campaignId}-${new Date().toISOString().slice(0, 10)}.json`
  a.click(); URL.revokeObjectURL(url)
}

async function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
  if (!confirm('Import this backup?')) return
  try {
    const payload = JSON.parse(await file.text())
    if (!payload.version || !payload.campaign) { alert('Invalid backup'); return }
    const db = getDb(); const now = new Date().toISOString()
    await db.campaigns.put({ ...payload.campaign, updated_at: payload.campaign.updated_at ?? now, created_at: payload.campaign.created_at ?? now })
    for (const t of payload.tokens ?? []) await db.tokens.put(t)
    for (const enc of payload.encounters ?? []) await db.encounters.put(enc)
    for (const et of payload.encounterTokens ?? []) await db.encounterTokens.put(et)
    for (const ent of payload.entities ?? []) await db.entities.put(ent)
    for (const lnk of payload.entityLinks ?? []) await db.entityLinks.put(lnk)
    campaigns.value = await window.dmforge.campaigns.list()
    alert('Import successful!')
  } catch (err: any) { alert('Import failed: ' + err.message) }
}

function formatDate(dt: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.book-shell { display: flex; height: 100vh; background: var(--leather); }
.tome-page { flex: 1; display: flex; flex-direction: column; background: var(--parch); margin: 16px 56px 16px 16px; border-radius: 2px; box-shadow: var(--page-shadow); overflow: hidden; position: relative; z-index: 1; }

/* Open book */
.open-book { flex: 1; display: flex; overflow: hidden; background: var(--leather); }
.book-leaf { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--parch); overflow: hidden; }
.book-leaf--left  { box-shadow:  4px 0 16px rgba(0,0,0,0.2); }
.book-leaf--right { box-shadow: -4px 0 16px rgba(0,0,0,0.12); }
.book-binding { width: 10px; flex-shrink: 0; background: linear-gradient(to right, rgba(0,0,0,0.22), rgba(0,0,0,0.06) 40%, rgba(0,0,0,0.06) 60%, rgba(0,0,0,0.22)); position: relative; }
.book-binding::before { content: ''; position: absolute; top:0; bottom:0; left:3px; right:3px; background: var(--leather); opacity: 0.85; }
.leaf-inner { flex: 1; overflow-y: auto; padding: 20px 28px 12px; background: var(--parch); }
.leaf-inner--right { flex: 1; overflow-y: auto; padding: 20px 28px 12px; background: var(--parch); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.leaf-footer { padding: 10px 28px 16px; border-top: 1px dashed var(--parch-line); background: var(--parch); }

.leaf-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--parch-line); }
.leaf-type  { font-family: var(--font-head); font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; }
.leaf-count { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); }
.leaf-empty { display: flex; flex-direction: column; align-items: center; padding: 32px 0; color: var(--ink-ghost); font-family: var(--font-body); font-size: 14px; font-style: italic; gap: 0; }

/* Entries */
.entry-icon { width: 26px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.entry-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; }
.entry:hover .entry-actions { opacity: 1; }
.entry-act { width: 20px; height: 20px; border-radius: 2px; background: rgba(28,20,16,0.06); border: 1px solid transparent; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.entry-act:hover { background: rgba(28,20,16,0.12); }
.entry-act--del:hover { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }

/* Footer new entry */
.leaf-new { display: flex; align-items: center; gap: 12px; width: 100%; background: none; border: none; cursor: pointer; padding: 4px 0; margin-bottom: 8px; }
.leaf-new-line-l { flex: 1; height: 1px; background: linear-gradient(to right, transparent, var(--ink-ghost)); }
.leaf-new-line-r { flex: 1; height: 1px; background: linear-gradient(to left, transparent, var(--ink-ghost)); }
.leaf-new-label { font-family: var(--font-head); font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-ghost); white-space: nowrap; flex-shrink: 0; transition: color 0.2s; }
.leaf-new:hover .leaf-new-label { color: var(--blood); }
.leaf-new:hover .leaf-new-line-l { background: linear-gradient(to right, transparent, var(--blood)); }
.leaf-new:hover .leaf-new-line-r { background: linear-gradient(to left, transparent, var(--blood)); }

.leaf-footnote { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); margin-top: 4px; }
.leaf-footnote-link { color: var(--ink-ghost); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; letter-spacing: 0.12em; text-transform: uppercase; transition: color 0.15s; }
.leaf-footnote-link:hover { color: var(--gold); }

/* Right page */
.right-hint { font-family: var(--font-body); font-size: 15px; color: var(--ink-ghost); font-style: italic; text-align: center; line-height: 1.8; }

/* Library */
.lib-system { margin-bottom: 24px; }
.lib-system-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.lib-system-name { font-family: var(--font-head); font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-faded); flex-shrink: 0; }
.lib-rule { flex: 1; height: 1px; background: var(--parch-line); }
.lib-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.lib-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--parch-dark); border: 1px solid var(--ink-ghost); border-radius: 2px; text-decoration: none; font-family: var(--font-head); font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--chip-color, var(--ink-faded)); transition: all 0.18s; }
.lib-chip:hover { background: var(--ink); color: var(--parch); border-color: var(--ink); }
</style>
