<template>
  <div class="book-shell">
    <div class="tome-page page-enter">

      <div class="open-book">

        <!-- LEFT PAGE -->
        <div class="book-stack book-stack--left">
          <div class="book-sheet-3"></div>
          <div class="book-sheet-2"></div>
          <div class="book-sheet-1"></div>
          <div class="book-leaf book-leaf--left">
            <div class="page-header">
              <div class="page-chapter-num">DM's Tome</div>
              <h1 class="page-title">{{ chapterTitle }}</h1>
              <div class="page-rule" />
            </div>
            <div class="leaf-inner">

              <!-- CAMPAIGNS -->
              <template v-if="section === 'campaigns'">
                <div class="leaf-header">
                  <span class="leaf-type" style="color:var(--blood)">Campaigns</span>
                  <span class="leaf-count">{{ campaigns.length }} entries</span>
                </div>
                <div v-for="(c, i) in leftEntries" :key="c.id" class="entry"
                  style="--et-color: var(--blood)" @click="openCampaign(c)">
                  <span class="entry-num">{{ spreadPage * PAGE_HALF * 2 + i + 1 }}</span>
                  <div class="entry-icon"><div class="entry-badge">
                    <OhVueIcon name="gi-broadsword" scale="0.75" style="color:var(--blood)" />
                  </div></div>
                  <div class="entry-body">
                    <div class="entry-top">
                      <span class="entry-name">{{ c.name }}</span>
                      <span class="entry-leader" />
                      <span class="entry-date">{{ formatDate(c.updated_at) }}</span>
                      <div class="entry-actions" @click.stop>
                        <button class="entry-act entry-act--del" @click.stop="deleteCampaign(c.id)">
                          <OhVueIcon name="md-delete" scale="0.75" />
                        </button>
                      </div>
                    </div>
                    <div v-if="c.description || systemName(c.system_id)" class="entry-attrs">
                      <span v-if="systemName(c.system_id)" class="ea-pill"
                        style="color:var(--gold);border-color:var(--gold);background:color-mix(in srgb,var(--gold) 10%,transparent)">
                        {{ systemName(c.system_id) }}
                      </span>
                      <span v-if="c.description" class="ea-text">{{ c.description }}</span>
                    </div>
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
                <NuxtLink v-for="(sys, i) in leftEntries" :key="sys.id!" :to="`/system/${sys.id}`"
                  class="entry" style="--et-color: var(--arcane-l); text-decoration: none">
                  <span class="entry-num">{{ spreadPage * PAGE_HALF * 2 + i + 1 }}</span>
                  <div class="entry-icon"><div class="entry-badge">
                    <OhVueIcon name="gi-scroll-unfurled" scale="0.75" style="color:var(--arcane-l)" />
                  </div></div>
                  <div class="entry-body">
                    <div class="entry-top">
                      <span class="entry-name">{{ sys.name }}</span>
                      <span class="entry-leader" />
                      <span class="entry-date">v{{ sys.version }}</span>
                    </div>
                    <div class="entry-attrs">
                      <span class="ea-pill" style="color:var(--arcane-l);border-color:var(--arcane-l);background:color-mix(in srgb,var(--arcane-l) 10%,transparent)">
                        {{ sys.entityTypes.length }} types
                      </span>
                      <span v-if="sys.description" class="ea-text">{{ sys.description }}</span>
                    </div>
                  </div>
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
                    <NuxtLink v-for="et in sys.entityTypes" :key="et.id" :to="`/system/${sys.id}/${et.id}`"
                      class="lib-chip" :style="{ '--chip-color': et.color }">
                      <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="0.85" />
                      {{ et.plural }}
                    </NuxtLink>
                  </div>
                </div>
              </template>

            </div>
            <div v-if="section !== 'library'" class="leaf-footer">
              <button class="leaf-nav-btn" :disabled="!hasPrevSpread" @click="prevSpread">
                <OhVueIcon name="md-chevronleft" scale="0.9" />
              </button>
              <button v-if="section === 'campaigns'" class="leaf-new" @click="showNew = true">
                <span class="leaf-new-line-l"></span>
                <span class="leaf-new-label">✦ Begin New Campaign ✦</span>
                <span class="leaf-new-line-r"></span>
              </button>
              <button v-else class="leaf-new" @click="showNewSystem = true">
                <span class="leaf-new-line-l"></span>
                <span class="leaf-new-label">✦ Define New System ✦</span>
                <span class="leaf-new-line-r"></span>
              </button>
              <span class="leaf-folio-num">{{ spreadPage + 1 }} / {{ totalSpreads }}</span>
            </div>
          </div>
        </div>

        <div class="book-binding"></div>

        <!-- RIGHT PAGE -->
        <div class="book-stack book-stack--right">
          <div class="book-sheet-3"></div>
          <div class="book-sheet-2"></div>
          <div class="book-sheet-1"></div>
          <div class="book-leaf book-leaf--right">
            <template v-if="section !== 'library' && rightEntries.length > 0">
              <div class="leaf-inner">

                <!-- CAMPAIGNS right -->
                <template v-if="section === 'campaigns'">
                  <div class="leaf-header">
                    <span class="leaf-type" style="color:var(--blood)">Campaigns</span>
                    <span class="leaf-count">continued</span>
                  </div>
                  <div v-for="(c, i) in rightEntries" :key="c.id" class="entry"
                    style="--et-color: var(--blood)" @click="openCampaign(c)">
                    <span class="entry-num">{{ spreadPage * PAGE_HALF * 2 + PAGE_HALF + i + 1 }}</span>
                    <div class="entry-icon"><div class="entry-badge">
                      <OhVueIcon name="gi-broadsword" scale="0.75" style="color:var(--blood)" />
                    </div></div>
                    <div class="entry-body">
                      <div class="entry-top">
                        <span class="entry-name">{{ c.name }}</span>
                        <span class="entry-leader" />
                        <span class="entry-date">{{ formatDate(c.updated_at) }}</span>
                        <div class="entry-actions" @click.stop>
                          <button class="entry-act entry-act--del" @click.stop="deleteCampaign(c.id)">
                            <OhVueIcon name="md-delete" scale="0.75" />
                          </button>
                        </div>
                      </div>
                      <div v-if="c.description || systemName(c.system_id)" class="entry-attrs">
                        <span v-if="systemName(c.system_id)" class="ea-pill"
                          style="color:var(--gold);border-color:var(--gold);background:color-mix(in srgb,var(--gold) 10%,transparent)">
                          {{ systemName(c.system_id) }}
                        </span>
                        <span v-if="c.description" class="ea-text">{{ c.description }}</span>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- SYSTEMS right -->
                <template v-else-if="section === 'systems'">
                  <div class="leaf-header">
                    <span class="leaf-type" style="color:var(--arcane-l)">Systems</span>
                    <span class="leaf-count">continued</span>
                  </div>
                  <NuxtLink v-for="(sys, i) in rightEntries" :key="sys.id!" :to="`/system/${sys.id}`"
                    class="entry" style="--et-color: var(--arcane-l); text-decoration: none">
                    <span class="entry-num">{{ spreadPage * PAGE_HALF * 2 + PAGE_HALF + i + 1 }}</span>
                    <div class="entry-icon"><div class="entry-badge">
                      <OhVueIcon name="gi-scroll-unfurled" scale="0.75" style="color:var(--arcane-l)" />
                    </div></div>
                    <div class="entry-body">
                      <div class="entry-top">
                        <span class="entry-name">{{ sys.name }}</span>
                        <span class="entry-leader" />
                        <span class="entry-date">v{{ sys.version }}</span>
                      </div>
                      <div class="entry-attrs">
                        <span class="ea-pill" style="color:var(--arcane-l);border-color:var(--arcane-l);background:color-mix(in srgb,var(--arcane-l) 10%,transparent)">
                          {{ sys.entityTypes.length }} types
                        </span>
                        <span v-if="sys.description" class="ea-text">{{ sys.description }}</span>
                      </div>
                    </div>
                  </NuxtLink>
                </template>

              </div>
              <div class="leaf-footer--right">
                <span class="leaf-folio-num">{{ spreadPage + 1 }} / {{ totalSpreads }}</span>
                <button class="leaf-nav-btn" :disabled="!hasNextSpread" @click="nextSpread">
                  <OhVueIcon name="md-chevronright" scale="0.9" />
                </button>
              </div>
            </template>

            <!-- PLACEHOLDER when right page is empty -->
            <template v-else>
              <div class="leaf-inner--right">
                <template v-if="section === 'campaigns'">
                  <OhVueIcon name="gi-broadsword" scale="4" style="opacity:0.13;margin-bottom:24px" />
                  <p class="right-hint"><em>Select a campaign to continue<br>your adventure.</em></p>
                </template>
                <template v-else-if="section === 'systems'">
                  <OhVueIcon name="gi-scroll-unfurled" scale="4" style="opacity:0.13;margin-bottom:24px" />
                  <p class="right-hint"><em>Each system defines the entities<br>and fields for your campaigns.</em></p>
                </template>
                <template v-else>
                  <OhVueIcon name="gi-open-treasure-chest" scale="4" style="opacity:0.13;margin-bottom:24px" />
                  <p class="right-hint"><em>Browse all records across<br>every system.</em></p>
                </template>
              </div>
            </template>
          </div>
        </div>

      </div>
    </div>

    <!-- SPINE TABS -->
    <nav class="spine-tabs">
      <SpineSeal />
      <button class="spine-tab" title="Campaigns" :class="{ active: section === 'campaigns' }" @click="section = 'campaigns'">
        <OhVueIcon name="gi-broadsword" scale="0.85" />
      </button>
      <button class="spine-tab" title="Systems" :class="{ active: section === 'systems' }" @click="section = 'systems'">
        <OhVueIcon name="gi-scroll-unfurled" scale="0.85" />
      </button>
      <button class="spine-tab" title="Library" :class="{ active: section === 'library' }" @click="section = 'library'">
        <OhVueIcon name="gi-open-treasure-chest" scale="0.85" />
      </button>
      <NuxtLink to="/settings" class="spine-tab" title="Settings">
        <OhVueIcon name="md-settings" scale="0.85" />
      </NuxtLink>
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
              <input class="f-input-box" v-model="newCamp.name" placeholder="Curse of Strahd…"
                @keyup.enter="createCampaign" autofocus />
            </div>
            <div style="margin-bottom:16px">
              <label class="f-label">Chronicle</label>
              <input class="f-input-box" v-model="newCamp.description" placeholder="A dark tale of…" />
            </div>
            <div>
              <label class="f-label">System</label>
              <Select v-model="newCamp.systemId" :options="sysOptions" option-label="label" option-value="value"
                placeholder="— none —" />
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
              <input class="f-input-box" style="font-family:var(--font-mono);font-size:12px" v-model="newSys.shortId"
                placeholder="pf2e" />
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

const PAGE_HALF = 8
const spreadPage = ref<number>(0)
const activeList = computed(() => section.value === 'campaigns' ? campaigns.value : (systems.value as any[]))
const hasPrevSpread = computed(() => spreadPage.value > 0)
const hasNextSpread = computed(() => (spreadPage.value + 1) * PAGE_HALF * 2 < activeList.value.length)
const totalSpreads = computed(() => Math.max(1, Math.ceil(activeList.value.length / (PAGE_HALF * 2))))
const leftEntries = computed(() => activeList.value.slice(spreadPage.value * PAGE_HALF * 2, spreadPage.value * PAGE_HALF * 2 + PAGE_HALF))
const rightEntries = computed(() => activeList.value.slice(spreadPage.value * PAGE_HALF * 2 + PAGE_HALF, (spreadPage.value + 1) * PAGE_HALF * 2))
function prevSpread() { if (hasPrevSpread.value) spreadPage.value-- }
function nextSpread() { if (hasNextSpread.value) spreadPage.value++ }
watch(section, () => { spreadPage.value = 0 })
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


function formatDate(dt: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  display: flex;
  flex-direction: column;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  margin: 20px 20px 20px 60px;
  border-radius: 2px;
  box-shadow: var(--page-shadow);
  overflow: visible;
  position: relative;
  z-index: 1;
}

/* Open book */

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}


.leaf-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--parch-line);
}

.leaf-type {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.leaf-count {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
}

.leaf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  color: var(--ink-ghost);
  font-family: var(--font-body);
  font-size: 14px;
  font-style: italic;
  gap: 0;
}

/* Entries */
.entry { align-items: flex-start; border-left: 2px solid transparent; transition: border-color 0.15s, background 0.15s; }
.entry:hover { border-left-color: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 40%, transparent); background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 4%, transparent); }
.entry-num { font-family: var(--font-mono); font-size: 9px; color: var(--ink-ghost); opacity: 0.4; width: 18px; flex-shrink: 0; text-align: right; padding-top: 2px; line-height: 1; }
.entry-icon { width: 32px; height: 26px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.entry-badge { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 13%, transparent); border: 1px solid color-mix(in srgb, var(--et-color, var(--ink-ghost)) 30%, transparent); flex-shrink: 0; }
.entry-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.entry-top { display: flex; align-items: center; gap: 6px; }
.entry-name { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.entry-leader { flex: 1; min-width: 8px; border-bottom: 1px dotted var(--ink-ghost); opacity: 0.3; align-self: center; position: relative; top: 1px; }
.entry-date { font-family: var(--font-head); font-size: 8px; color: var(--ink-ghost); letter-spacing: 0.05em; flex-shrink: 0; white-space: nowrap; }
.entry-attrs { display: flex; flex-wrap: nowrap; align-items: center; gap: 5px; padding-bottom: 3px; overflow: hidden; }
.ea-pill { display: inline-flex; align-items: center; font-family: var(--font-head); font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 7px 2px 5px; border: 1px solid currentColor; border-radius: 2px; flex-shrink: 0; white-space: nowrap; }
.ea-text { display: inline-flex; align-items: center; font-family: var(--font-ui); font-size: 11px; color: var(--ink-ghost); font-style: italic; flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.entry-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
.entry:hover .entry-actions { opacity: 1; }
.entry-act { width: 20px; height: 20px; border-radius: 2px; background: rgba(28,20,16,0.06); border: 1px solid transparent; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.entry-act:hover { background: rgba(28,20,16,0.12); }
.entry-act--del:hover { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }

/* Footer pagination */
.leaf-nav-btn { width: 26px; height: 26px; border-radius: 2px; background: none; border: 1px solid var(--parch-line); color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
.leaf-nav-btn:hover:not(:disabled) { border-color: var(--ink-faded); color: var(--ink); }
.leaf-nav-btn:disabled { opacity: 0.25; cursor: default; }
.leaf-folio-num { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); letter-spacing: 0.12em; white-space: nowrap; }

/* Footer new entry */
.leaf-new {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 8px;
}

.leaf-new-line-l {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--ink-ghost));
}

.leaf-new-line-r {
  flex: 1;
  height: 1px;
  background: linear-gradient(to left, transparent, var(--ink-ghost));
}

.leaf-new-label {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.2s;
}

.leaf-new:hover .leaf-new-label {
  color: var(--blood);
}

.leaf-new:hover .leaf-new-line-l {
  background: linear-gradient(to right, transparent, var(--blood));
}

.leaf-new:hover .leaf-new-line-r {
  background: linear-gradient(to left, transparent, var(--blood));
}

.leaf-footer {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px 12px;
  border-top: 1px dashed var(--parch-line);
  flex-shrink: 0;
}
.leaf-footer .leaf-new { flex: 1; width: auto; margin-bottom: 0; }
.leaf-footer--right {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 8px 16px 12px;
  border-top: 1px dashed var(--parch-line);
  flex-shrink: 0;
}

.leaf-footnote-bar {
  padding: 4px 16px 8px;
  flex-shrink: 0;
}

.leaf-footnote {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
  margin-top: 4px;
}

.leaf-footnote-link {
  color: var(--ink-ghost);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: color 0.15s;
}

.leaf-footnote-link:hover {
  color: var(--gold);
}


/* Library */
.lib-system {
  margin-bottom: 24px;
}

.lib-system-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.lib-system-name {
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-faded);
  flex-shrink: 0;
}

.lib-rule {
  flex: 1;
  height: 1px;
  background: var(--parch-line);
}

.lib-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lib-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--parch-dark);
  border: 1px solid var(--ink-ghost);
  border-radius: 2px;
  text-decoration: none;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--chip-color, var(--ink-faded));
  transition: all 0.18s;
}

.lib-chip:hover {
  background: var(--ink);
  color: var(--parch);
  border-color: var(--ink);
}

</style>
