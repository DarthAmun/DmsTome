<template>
  <div class="home-page page-enter">

    <!-- Header -->
    <div class="home-header">
      <div class="home-header-text">
        <h1 class="home-title">DM's Tome</h1>
        <p class="home-sub">Your campaigns, chronicles &amp; systems</p>
      </div>
    </div>

    <!-- Campaigns section -->
    <div class="home-content">
      <div v-if="campaigns.length" class="home-section">
        <div class="home-section-head">
          <span class="home-section-label">Campaigns</span>
          <button class="home-new-btn" @click="showNewCampaign = true">+ New</button>
        </div>
        <div class="home-grid">
          <div
            v-for="c in campaigns"
            :key="c.id"
            class="home-card"
            :style="{ '--card-color': campaignColor(c.id!) }"
            @click="openCampaign(c)"
          >
            <div class="home-card-stripe" />
            <div class="home-card-body">
              <div class="home-card-name">{{ c.name }}</div>
              <div v-if="c.description" class="home-card-desc">{{ c.description }}</div>
              <div class="home-card-meta">
                <span v-if="systemName(c.system_id)" class="home-card-pill">{{ systemName(c.system_id) }}</span>
                <span class="home-card-date">{{ formatDate(c.updated_at) }}</span>
              </div>
            </div>
            <div class="home-card-actions" @click.stop>
              <button class="home-card-act" title="Edit" @click.stop="startEditCampaign(c)">
                <OhVueIcon name="md-editnote" scale="0.75" />
              </button>
              <button class="home-card-act home-card-act--del" title="Delete" @click.stop="deleteCampaign(c.id!)">
                <OhVueIcon name="md-delete" scale="0.75" />
              </button>
            </div>
          </div>
          <button class="home-card home-card--add" @click="showNewCampaign = true">
            <span class="home-card-add-icon">+</span>
            <span class="home-card-add-label">New Campaign</span>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="home-empty">
        <div class="home-empty-icon">
          <OhVueIcon name="gi-broadsword" scale="3" />
        </div>
        <h2 class="home-empty-title">No campaigns yet</h2>
        <p class="home-empty-sub">Create your first campaign to begin your chronicle.</p>
        <button class="home-empty-btn" @click="showNewCampaign = true">Begin a Campaign</button>
      </div>

      <!-- Systems section -->
      <div v-if="systems.length" class="home-section" style="margin-top: 32px">
        <div class="home-section-head">
          <span class="home-section-label">Systems</span>
          <button class="home-new-btn" @click="showNewSystem = true">+ New</button>
        </div>
        <div class="home-sys-list">
          <NuxtLink
            v-for="sys in systems"
            :key="sys.id!"
            :to="`/system/${sys.id}/library`"
            class="home-sys-row"
          >
            <div class="home-sys-icon">{{ (sys.shortId || sys.name).slice(0, 2).toUpperCase() }}</div>
            <div class="home-sys-body">
              <div class="home-sys-name">{{ sys.name }}</div>
              <div class="home-sys-meta">v{{ sys.version }} · {{ sys.entityTypes.length }} entity types</div>
            </div>
            <div class="home-sys-actions" @click.stop>
              <button class="home-card-act" title="Edit" @click.stop="startEditSystem(sys)">
                <OhVueIcon name="md-editnote" scale="0.75" />
              </button>
              <button class="home-card-act home-card-act--del" title="Delete" @click.stop="deleteSystem(sys.id!)">
                <OhVueIcon name="md-delete" scale="0.75" />
              </button>
            </div>
            <OhVueIcon name="md-chevronright" scale="0.85" class="home-sys-arrow" />
          </NuxtLink>
          <button class="home-sys-row home-sys-row--add" @click="showNewSystem = true">
            <div class="home-sys-icon home-sys-icon--add">+</div>
            <span style="color: var(--text2)">Define a new system</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Campaign Dialog -->
    <Teleport to="body">
      <div v-if="editingCamp" class="pv-dialog-mask" @click.self="editingCamp = null">
        <div class="pv-dialog">
          <div class="pv-dialog-header">
            <span class="pv-dialog-title">Edit Campaign</span>
            <button class="pv-dialog-close" @click="editingCamp = null">
              <OhVueIcon name="md-close" scale="0.85" />
            </button>
          </div>
          <div class="pv-dialog-content">
            <div class="dlg-field">
              <label class="f-label">Title</label>
              <input class="f-input-box" v-model="editCampForm.name" @keyup.enter="saveEditCampaign" autofocus />
            </div>
            <div class="dlg-field">
              <label class="f-label">Description</label>
              <textarea class="f-input-box f-textarea" v-model="editCampForm.description" rows="3" />
            </div>
            <div class="dlg-field">
              <label class="f-label">System</label>
              <select class="f-input-box f-select" v-model="editCampForm.systemId">
                <option :value="null">— none —</option>
                <option v-for="s in systems" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <div class="pv-dialog-footer">
            <button class="ghost-btn" @click="editingCamp = null">Cancel</button>
            <button class="seal-btn" @click="saveEditCampaign">Save</button>
          </div>
        </div>
      </div>

      <!-- Edit System Dialog -->
      <div v-if="editingSys" class="pv-dialog-mask" @click.self="editingSys = null">
        <div class="pv-dialog">
          <div class="pv-dialog-header">
            <span class="pv-dialog-title">Edit System</span>
            <button class="pv-dialog-close" @click="editingSys = null">
              <OhVueIcon name="md-close" scale="0.85" />
            </button>
          </div>
          <div class="pv-dialog-content">
            <div class="dlg-field">
              <label class="f-label">Name</label>
              <input class="f-input-box" v-model="editSysForm.name" @keyup.enter="saveEditSystem" autofocus />
            </div>
            <div class="dlg-field">
              <label class="f-label">Short ID</label>
              <input class="f-input-box" style="font-family:var(--fm);font-size:12px" v-model="editSysForm.shortId" />
            </div>
            <div class="dlg-field">
              <label class="f-label">Description</label>
              <textarea class="f-input-box f-textarea" v-model="editSysForm.description" rows="3" />
            </div>
          </div>
          <div class="pv-dialog-footer">
            <button class="ghost-btn" @click="editingSys = null">Cancel</button>
            <button class="seal-btn" @click="saveEditSystem">Save</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
import { dbApi } from '~/composables/useDb'
import { useFormatters } from '~/composables/useFormatters'
import { useAppDialogs } from '~/composables/useAppDialogs'

const { showNewCampaign, showNewSystem } = useAppDialogs()

const { formatDate } = useFormatters()
const router = useRouter()
const store = useSystemsStore()
const systems = computed(() => store.systems)

const campaigns = ref<any[]>([])

onMounted(async () => {
  await store.loadAll()
  campaigns.value = await dbApi.campaigns.list()
})

function systemName(id?: number | null) {
  return id ? store.getSystem(id)?.name ?? null : null
}

function openCampaign(c: any) {
  router.push(`/campaign/${c.id}/sessions`)
}

async function deleteCampaign(id: number) {
  if (!confirm('Delete this campaign and all its data?')) return
  await dbApi.campaigns.delete(id)
  campaigns.value = campaigns.value.filter(c => c.id !== id)
}

// Edit campaign
const editingCamp = ref<any>(null)
const editCampForm = ref({ name: '', description: '', systemId: null as number | null })

function startEditCampaign(c: any) {
  editingCamp.value = c
  editCampForm.value = { name: c.name, description: c.description ?? '', systemId: c.system_id ?? null }
}

async function saveEditCampaign() {
  if (!editingCamp.value || !editCampForm.value.name.trim()) return
  const updated = await dbApi.campaigns.update(editingCamp.value.id, {
    name: editCampForm.value.name,
    description: editCampForm.value.description,
    system_id: editCampForm.value.systemId ?? undefined,
  })
  const idx = campaigns.value.findIndex(c => c.id === editingCamp.value.id)
  if (idx !== -1 && updated) campaigns.value[idx] = updated
  editingCamp.value = null
}

// Edit system
const editingSys = ref<any>(null)
const editSysForm = ref({ name: '', shortId: '', description: '' })

function startEditSystem(sys: any) {
  editingSys.value = sys
  editSysForm.value = { name: sys.name, shortId: sys.shortId, description: sys.description ?? '' }
}

async function saveEditSystem() {
  if (!editingSys.value || !editSysForm.value.name.trim()) return
  await store.updateSystem(editingSys.value.id, editSysForm.value)
  editingSys.value = null
}

async function deleteSystem(id: number) {
  if (!confirm('Delete this system and all its records?')) return
  await store.deleteSystem(id)
}

// Campaign colors
const CAMPAIGN_COLORS = [
  '#7c6fe8', '#e87c6f', '#6fe8c0', '#e8c46f', '#6fa8e8',
  '#e86fa8', '#a8e86f', '#e86f6f', '#6fe8a8', '#c46fe8',
]
function campaignColor(id: number): string {
  return CAMPAIGN_COLORS[id % CAMPAIGN_COLORS.length]
}
</script>

<style scoped>
.home-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.home-header {
  padding: 28px 32px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.home-title {
  font-family: var(--fh);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.02em;
}

.home-sub {
  font-size: 13px;
  color: var(--text2);
  margin-top: 3px;
}

.home-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 40px;
}

/* Section */
.home-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.home-section-label {
  font-family: var(--fh);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text2);
}

.home-new-btn {
  padding: 3px 10px;
  border-radius: var(--r1);
  border: 1px solid var(--border);
  background: none;
  color: var(--text2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}
.home-new-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg);
}

/* Campaign grid */
.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.home-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r2);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
}
.home-card:hover {
  border-color: var(--border-hi);
  box-shadow: var(--sh);
}

.home-card-stripe {
  height: 3px;
  background: var(--card-color, var(--accent));
  flex-shrink: 0;
}

.home-card-body {
  padding: 14px 14px 10px;
  flex: 1;
}

.home-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-card-desc {
  font-size: 12px;
  color: var(--text2);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}

.home-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.home-card-pill {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--accent-bg);
  color: var(--accent);
  border: 1px solid oklch(58% 0.24 295 / 0.2);
}

.home-card-date {
  font-family: var(--fm);
  font-size: 10px;
  color: var(--text3);
  margin-left: auto;
}

.home-card-actions {
  display: flex;
  gap: 4px;
  padding: 6px 10px 8px;
  opacity: 0;
  transition: opacity 0.15s;
}
.home-card:hover .home-card-actions { opacity: 1; }

.home-card-act {
  width: 24px;
  height: 24px;
  border-radius: var(--r1);
  border: 1px solid var(--border);
  background: var(--surface-hi);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
}
.home-card-act:hover { color: var(--text); border-color: var(--border-hi); }
.home-card-act--del:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-bg); }

.home-card--add {
  border-style: dashed;
  background: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 100px;
  cursor: pointer;
  color: var(--text3);
  transition: all 0.15s;
}
.home-card--add:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }

.home-card-add-icon { font-size: 24px; line-height: 1; }
.home-card-add-label { font-size: 12px; font-weight: 500; }

/* Empty state */
.home-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text2);
}

.home-empty-icon {
  opacity: 0.12;
  margin-bottom: 20px;
  color: var(--text);
}

.home-empty-title {
  font-family: var(--fh);
  font-size: 18px;
  color: var(--text);
  margin-bottom: 8px;
}

.home-empty-sub {
  font-size: 13px;
  color: var(--text2);
  margin-bottom: 20px;
}

.home-empty-btn {
  padding: 10px 24px;
  border-radius: var(--r2);
  background: var(--accent);
  color: #fff;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.home-empty-btn:hover { opacity: 0.85; }

/* Systems list */
.home-sys-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.home-sys-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--r2);
  background: var(--surface);
  border: 1px solid var(--border);
  cursor: pointer;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.12s, background 0.12s;
}
.home-sys-row:hover { border-color: var(--border-hi); background: var(--surface-hi); }

.home-sys-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--accent-bg);
  border: 1px solid oklch(58% 0.24 295 / 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--fh);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  flex-shrink: 0;
}

.home-sys-icon--add { background: none; border-style: dashed; color: var(--text3); font-size: 18px; }

.home-sys-body { flex: 1; min-width: 0; }

.home-sys-name { font-size: 14px; font-weight: 500; color: var(--text); }

.home-sys-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }

.home-sys-arrow { color: var(--text3); flex-shrink: 0; }

.home-sys-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.home-sys-row:hover .home-sys-actions { opacity: 1; }

.home-sys-row--add {
  border-style: dashed;
  background: none;
  color: var(--text3);
  font-size: 13px;
}
.home-sys-row--add:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-bg); }
.home-sys-row--add:hover .home-sys-icon--add { color: var(--accent); border-color: var(--accent); }
</style>
