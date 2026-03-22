<template>
  <div class="enc-page">
    <div class="page-header enc-header">
      <div class="page-chapter-num">{{ campaignName }}</div>
      <h1 class="page-title">The Battlefield</h1>
      <div class="page-rule" />
    </div>

    <!-- Encounter list -->
    <div class="page-content enc-content" v-if="!selectedEncounter" data-page="II">
      <p class="tome-intro"><em>Tactical encounters. Select one to open the battlefield, or begin a new engagement.</em></p>
      <div class="index-list">
        <div v-for="enc in encounters" :key="enc.id" class="entry" @click="openEncounter(enc)">
          <div class="entry-icon"><OhVueIcon name="gi-broadsword" scale="0.9" style="color:var(--blood)" /></div>
          <span class="entry-name">{{ enc.name }}</span>
          <span class="entry-dots" />
          <span class="entry-tag" :style="enc.status === 'active' ? 'color:var(--blood);border-color:var(--blood)' : ''">
            {{ enc.status || 'prepared' }}
          </span>
          <span class="entry-date">{{ formatDate(enc.updated_at) }}</span>
          <div class="entry-actions" @click.stop>
            <button class="entry-act entry-act--del" @click.stop="deleteEncounter(enc.id)">
              <OhVueIcon name="md-delete" scale="0.75" />
            </button>
          </div>
        </div>
        <div v-if="!encounters.length" class="tome-empty-inline"><em>No encounters yet. Write the first engagement.</em></div>
      </div>
      <div class="new-entry-row">
        <button class="new-entry-btn" @click="createEncounter">
          <span class="new-entry-line" />
          <span class="new-entry-label">✦ New Encounter ✦</span>
          <span class="new-entry-line" />
        </button>
      </div>
    </div>

    <!-- Encounter editor — full chrome -->
    <div v-else class="enc-editor chrome-shell">
      <div class="chrome-header">
        <button class="ghost-btn" @click="selectedEncounter = null; loadEncounters()">
          ← Back
        </button>
        <span class="chrome-title" style="margin-left:12px">{{ selectedEncounter.name }}</span>
        <div class="chrome-spacer" />
      </div>
      <div style="flex:1;overflow:hidden">
        <NuxtLink :to="`/encounter/${selectedEncounter.id}`" class="enc-open-link">
          Open Full Encounter →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const campaignId = Number(route.params.id)
const campaignName = ref('')
const encounters = ref<any[]>([])
const selectedEncounter = ref<any>(null)

onMounted(async () => {
  if (window.dmforge) {
    const camps = await window.dmforge.campaigns.list()
    campaignName.value = camps.find((c:any) => c.id === campaignId)?.name ?? ''
    await loadEncounters()
  }
})

async function loadEncounters() {
  encounters.value = await window.dmforge.encounters.list(campaignId)
}

function openEncounter(enc: any) {
  router.push(`/encounter/${enc.id}`)
}

async function createEncounter() {
  const enc = await window.dmforge.encounters.create(campaignId, 'New Encounter')
  router.push(`/encounter/${enc.id}`)
}

async function deleteEncounter(id: number) {
  if (!confirm('Delete this encounter?')) return
  await window.dmforge.encounters.delete(id)
  await loadEncounters()
}

function formatDate(dt: string) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.enc-page { height: 100%; display: flex; flex-direction: column; background: var(--parch); }
.enc-header { padding-bottom: 0; }
.enc-content { background-image: none !important; }
.enc-editor { flex: 1; overflow: hidden; }
.enc-open-link {
  display: inline-flex; align-items: center; gap: 8px;
  margin: 24px; padding: 10px 20px;
  font-family: var(--font-head); font-size: 11px; font-weight: 600;
  letter-spacing: 0.15em; text-transform: uppercase;
  background: var(--blood); color: var(--parch);
  border: none; border-radius: var(--r); text-decoration: none;
  box-shadow: 0 2px 8px rgba(139,26,26,0.4);
}

.tome-intro { font-family: var(--font-body); font-size: 15px; color: var(--ink-faded); margin-bottom: 28px; line-height: 1.7; padding-bottom: 16px; border-bottom: 1px solid var(--parch-line); }
.index-list { display: flex; flex-direction: column; margin-bottom: 28px; }
.entry-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; }
.entry:hover .entry-actions { opacity: 1; }
.entry-act { width: 22px; height: 22px; border-radius: 3px; background: rgba(28,20,16,0.06); border: 1px solid transparent; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.entry-act--del:hover { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }
.new-entry-row { display: flex; align-items: center; }
.new-entry-btn { display: flex; align-items: center; gap: 16px; width: 100%; background: none; border: none; cursor: pointer; transition: all 0.2s; padding: 8px 0; }
.new-entry-line { flex: 1; height: 1px; background: linear-gradient(to right, transparent, var(--ink-ghost)); }
.new-entry-label { font-family: var(--font-head); font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink-ghost); white-space: nowrap; transition: color 0.2s; flex-shrink: 0; }
.new-entry-btn:hover .new-entry-label { color: var(--blood); }
.new-entry-btn:hover .new-entry-line { background: linear-gradient(to right, transparent, var(--blood)); }
.tome-empty-inline { padding: 24px 0; font-family: var(--font-body); font-size: 15px; color: var(--ink-ghost); text-align: center; }
</style>
