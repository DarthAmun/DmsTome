<template>
  <div class="shell">
    <nav class="icon-rail">
      <div class="icon-rail-logo">⚔</div>
      <NuxtLink to="/" class="rail-icon-btn" title="Back to campaigns">
        <OhVueIcon name="md-arrowback" scale="0.95" />
      </NuxtLink>
      <div class="rail-spacer" />
      <button class="rail-fab" title="New Encounter" @click="showNew = true">+</button>
    </nav>

    <div class="shell-body">
      <header class="top-bar">
        <span class="top-bar-title">{{ campaignName }}</span>
        <span class="top-bar-section">/ Encounters</span>
        <div class="top-bar-spacer" />
        <Button @click="showNew = true">
          <template #icon>
            <OhVueIcon name="md-add" scale="0.85" />
          </template>
          New Encounter
        </Button>
      </header>

      <div class="main-canvas">
        <h1 class="section-eyebrow">Encounters</h1>
        <div class="enc-grid">
          <NuxtLink v-for="enc in encounters" :key="enc.id" :to="`/encounter/${enc.id}`" class="enc-card v6-card">
            <div class="enc-thumb">
              <img v-if="enc.map_source" :src="getMapThumb(enc)" class="w-full h-full object-cover" />
              <div v-else class="enc-thumb-empty">
                <OhVueIcon name="md-map" scale="2.2" style="color:var(--muted);opacity:0.4" />
              </div>
            </div>
            <div class="enc-info">
              <div class="enc-name">{{ enc.name }}</div>
              <div class="enc-date">{{ formatDate(enc.updated_at) }}</div>
              <div class="enc-actions" @click.prevent>
                <button class="act-chip" @click.prevent="duplicate(enc)">
                  <OhVueIcon name="md-add" scale="0.75" /> Copy
                </button>
                <button class="act-chip act-chip--danger" @click.prevent="remove(enc.id)">
                  <OhVueIcon name="md-delete" scale="0.75" /> Delete
                </button>
              </div>
            </div>
          </NuxtLink>

          <button class="enc-card enc-card--new v6-card" @click="showNew = true">
            <OhVueIcon name="md-add" scale="2" style="color:var(--muted);opacity:0.3;margin-bottom:8px" />
            <span style="color:var(--secondary);font-size:13px;font-weight:500">New Encounter</span>
          </button>
        </div>
      </div>
    </div>

    <Dialog v-model:visible="showNew" modal :draggable="false">
      <template #header>New Encounter</template>
      <div>
        <label class="f-label">Name</label>
        <InputText v-model="newName" placeholder="The Goblin Ambush…" autofocus @keyup.enter="create" />
      </div>
      <template #footer>
        <Button severity="secondary" @click="showNew = false">Cancel</Button>
        <Button @click="create">Create</Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute(); const router = useRouter()
const campaignId = Number(route.params.id)
const encounters = ref<any[]>([]); const campaignName = ref('Campaign')
const showNew = ref(false); const newName = ref('')

onMounted(async () => {
  if (!window.dmforge) return
  encounters.value = await window.dmforge.encounters.list(campaignId)
  const camps = await window.dmforge.campaigns.list()
  campaignName.value = camps.find((c: any) => c.id === campaignId)?.name ?? 'Campaign'
})
async function create() {
  if (!newName.value.trim() || !window.dmforge) return
  const enc = await window.dmforge.encounters.create({ campaignId, name: newName.value })
  newName.value = ''; showNew.value = false; router.push(`/encounter/${enc.id}`)
}
async function remove(id: number) {
  if (!window.dmforge) return
  encounters.value = encounters.value.filter(e => e.id !== id)
  await window.dmforge.encounters.delete(id)
}
async function duplicate(enc: any) {
  if (!window.dmforge) return
  const copy = await window.dmforge.encounters.create({ campaignId, name: enc.name + ' (Copy)' })
  await window.dmforge.encounters.update({ id: copy.id, map_source: enc.map_source, map_type: enc.map_type, grid_size: enc.grid_size, grid_offset_x: enc.grid_offset_x, grid_offset_y: enc.grid_offset_y, fog_data: enc.fog_data })
  const full = await window.dmforge.encounters.get(enc.id)
  for (const t of full.tokens ?? []) await window.dmforge.encounterTokens.add({ encounterId: copy.id, tokenId: t.token_id, gridX: t.grid_x, gridY: t.grid_y, size: t.size, isVisible: t.is_visible, label: t.label, hpMax: t.hp_max, hpCurrent: t.hp_current, initiative: t.initiative })
  encounters.value = await window.dmforge.encounters.list(campaignId)
}
function formatDate(dt: string) { return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
function getMapThumb(enc: any) { return enc.map_type === 'url' ? enc.map_source : `${enc.map_source}` }
</script>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.shell-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.top-bar-section {
  font-size: 14px;
  color: var(--secondary);
  font-family: 'DM Sans', sans-serif;
}

.enc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.enc-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-decoration: none;
  cursor: pointer;
}

.enc-thumb {
  height: 130px;
  background: var(--raised);
  overflow: hidden;
}

.enc-thumb-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enc-info {
  padding: 14px 16px;
}

.enc-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 3px;
}

.enc-date {
  font-size: 11px;
  color: var(--secondary);
  margin-bottom: 10px;
}

.enc-actions {
  display: flex;
  gap: 6px;
}

.act-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  background: var(--raised);
  border: none;
  color: var(--secondary);
  font-size: 11px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}

.act-chip:hover {
  background: var(--hover);
  color: var(--text);
}

.act-chip--danger:hover {
  background: var(--danger-dim);
  color: var(--danger);
}

.enc-card--new {
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed var(--border);
  box-shadow: none;
  background: transparent;
}

.enc-card--new:hover {
  border-color: var(--border-l);
  background: var(--card);
}
</style>
