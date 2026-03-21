<template>
  <div class="shell">
    <!-- Left icon rail -->
    <nav class="icon-rail">
      <div class="icon-rail-logo">
        <OhVueIcon name="gi-anvil-impact" />
      </div>
      <button v-for="c in campaigns" :key="c.id" class="rail-icon-btn"
        :class="{ active: selectedCampaign?.id === c.id }" :title="c.name" @click="selectCampaign(c)">
        <span style="font-weight:800;font-size:14px">
          {{ c.name.charAt(0).toUpperCase() }}
        </span>
      </button>
      <div class="rail-spacer" />
      <button class="rail-fab" title="New Campaign" @click="showNew = true">+</button>
    </nav>

    <!-- Main area -->
    <div class="shell-body">
      <!-- Top bar -->
      <header class="top-bar">
        <span class="top-bar-title">DM FORGE</span>
        <NuxtLink v-if="selectedCampaign" :to="`/campaign/${selectedCampaign.id}/encounters`" class="nav-pill">
          <OhVueIcon name="gi-broadsword" scale="0.9" /> Encounters
        </NuxtLink>
        <NuxtLink v-if="selectedCampaign" :to="`/campaign/${selectedCampaign.id}/notes`" class="nav-pill">
          <OhVueIcon name="gi-scroll-unfurled" scale="0.9" /> Notes
        </NuxtLink>
        <div class="top-bar-spacer" />
        <label v-if="selectedCampaign" class="nav-pill" style="cursor:pointer" title="Import backup">
          <OhVueIcon name="md-arrowback" scale="0.85" /> Import
          <input type="file" accept=".json" style="display:none" @change="importData" />
        </label>
        <button v-if="selectedCampaign" class="nav-pill" @click="exportData(selectedCampaign.id)" title="Export backup">
          <OhVueIcon name="md-cloud" scale="0.85" /> Export
        </button>
        <Button v-if="selectedCampaign" severity="danger" size="small" @click="deleteCampaign(selectedCampaign.id)">
          <template #icon>
            <OhVueIcon name="md-delete" scale="0.85" />
          </template>
        </Button>
      </header>

      <!-- Content -->
      <div v-if="selectedCampaign" class="main-canvas">
        <h1 class="section-eyebrow">{{ selectedCampaign.name }}</h1>
        <p v-if="selectedCampaign.description" class="campaign-desc">{{ selectedCampaign.description }}</p>

        <!-- Module cards -->
        <div class="module-grid">
          <NuxtLink v-for="mod in modules" :key="mod.id" :to="mod.available ? moduleRoute(mod.id) : '#'"
            class="module-card v6-card"
            :class="{ 'module-card--on': mod.available, 'module-card--off': !mod.available }">
            <div class="module-card-inner">
              <div class="module-icon-wrap" :class="mod.available ? 'icon-wrap--on' : ''">
                <OhVueIcon :name="mod.icon" scale="1.6" />
              </div>
              <div class="module-info">
                <div class="module-name">{{ mod.name }}</div>
                <div class="module-sub">{{ mod.available ? 'Available' : 'Coming soon' }}</div>
              </div>
              <span v-if="mod.available" class="module-arrow">→</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Recent encounters -->
        <div class="recent-block">
          <div class="recent-head">
            <span class="v6-card-label">Recent Encounters</span>
            <NuxtLink :to="`/campaign/${selectedCampaign.id}/encounters`" class="text-link">See all →</NuxtLink>
          </div>
          <div class="recent-list">
            <NuxtLink v-for="enc in recentEncounters" :key="enc.id" :to="`/encounter/${enc.id}`" class="recent-row">
              <div class="recent-dot">
                <OhVueIcon name="gi-broadsword" scale="0.85" />
              </div>
              <span class="recent-name">{{ enc.name }}</span>
              <span class="recent-date">{{ formatDate(enc.updated_at) }}</span>
            </NuxtLink>
            <p v-if="recentEncounters.length === 0" class="empty-hint">No encounters yet</p>
          </div>
        </div>
      </div>

      <div v-else class="main-canvas empty-canvas">
        <div class="empty-icon">⚔</div>
        <h2 class="empty-title">Select a Campaign</h2>
        <p class="empty-sub">Pick one from the sidebar or create a new one</p>
        <button class="pill-btn pill-btn--accent" @click="showNew = true">
          <OhVueIcon name="md-add" scale="0.9" /> New Campaign
        </button>
      </div>
    </div>

    <!-- New Campaign Dialog -->
    <Dialog v-model:visible="showNew" modal :draggable="false">
      <template #header>New Campaign</template>
      <div class="dialog-fields">
        <label class="f-label">Campaign Name</label>
        <InputText v-model="newCampaign.name" placeholder="The Lost Mines…" autofocus @keyup.enter="create" />
        <label class="f-label" style="margin-top:14px">Description</label>
        <Textarea v-model="newCampaign.description" placeholder="A brief description…" :rows="3" />
      </div>
      <template #footer>
        <Button severity="secondary" @click="showNew = false">Cancel</Button>
        <Button @click="create">Create</Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
const campaigns = ref<any[]>([])
const selectedCampaign = ref<any>(null)
const recentEncounters = ref<any[]>([])
const showNew = ref(false)
const newCampaign = ref({ name: '', description: '' })

const modules = [
  { id: 'encounters', name: 'Encounters', icon: 'gi-broadsword', available: true },
  { id: 'notes', name: 'Notes', icon: 'gi-scroll-unfurled', available: true },
  { id: 'map', name: 'World Map', icon: 'gi-treasure-map', available: true },
  { id: 'timeline', name: 'Timeline', icon: 'gi-sands-of-time', available: false },
]

function moduleRoute(id: string) {
  if (id === 'encounters') return `/campaign/${selectedCampaign.value?.id}/encounters`
  if (id === 'notes') return `/campaign/${selectedCampaign.value?.id}/notes`
  if (id === 'map') return `/campaign/${selectedCampaign.value?.id}/map`
  return '#'
}

onMounted(async () => {
  if (!window.dmforge) return
  campaigns.value = await window.dmforge.campaigns.list()
  if (campaigns.value.length > 0) await selectCampaign(campaigns.value[0])
})

async function selectCampaign(c: any) {
  selectedCampaign.value = c
  if (window.dmforge) recentEncounters.value = (await window.dmforge.encounters.list(c.id)).slice(0, 6)
}
async function create() {
  if (!newCampaign.value.name.trim() || !window.dmforge) return
  const c = await window.dmforge.campaigns.create({ name: newCampaign.value.name, description: newCampaign.value.description })
  campaigns.value.unshift(c)
  newCampaign.value = { name: '', description: '' }
  showNew.value = false
  await selectCampaign(c)
}
async function deleteCampaign(id: number) {
  if (!window.dmforge) return
  await window.dmforge.campaigns.delete(id)
  campaigns.value = campaigns.value.filter(c => c.id !== id)
  if (selectedCampaign.value?.id === id) { selectedCampaign.value = null; recentEncounters.value = [] }
}
function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
}

.shell-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.campaign-desc {
  font-size: 14px;
  color: var(--secondary);
  margin-bottom: 28px;
  margin-top: -12px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}

.module-card {
  text-decoration: none;
  display: block;
}

.module-card--off {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.module-card--on:hover .module-icon-wrap {
  background: var(--gold-dim);
  color: var(--gold);
}

.module-card-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
}

.module-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--raised);
  color: var(--secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.icon-wrap--on {
  color: var(--text);
}

.module-info {
  flex: 1;
}

.module-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.module-sub {
  font-size: 11px;
  color: var(--secondary);
  margin-top: 2px;
}

.module-arrow {
  font-size: 16px;
  color: var(--muted);
  transition: color 0.2s;
}

.module-card--on:hover .module-arrow {
  color: var(--gold);
}

.recent-block {}

.recent-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.text-link {
  font-size: 12px;
  color: var(--gold);
  text-decoration: none;
  font-weight: 600;
}

.text-link:hover {
  opacity: 0.8;
}

.recent-list {
  background: var(--card);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.recent-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 18px;
  text-decoration: none;
  color: var(--text);
  transition: background 0.15s;
  border-bottom: 1px solid var(--border);
}

.recent-row:last-child {
  border-bottom: none;
}

.recent-row:hover {
  background: var(--raised);
}

.recent-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gold-dim);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recent-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.recent-date {
  font-size: 11px;
  color: var(--secondary);
}

.empty-hint {
  font-size: 13px;
  color: var(--secondary);
  padding: 16px 18px;
}

.empty-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.08;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 24px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.empty-sub {
  font-size: 13px;
  color: var(--secondary);
  margin-bottom: 24px;
}

.dialog-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
