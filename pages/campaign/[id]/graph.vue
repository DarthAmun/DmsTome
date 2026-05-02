<template>
  <div class="graph-page">
    <div class="page-header graph-header">
      <div class="page-chapter-num">{{ campaignName }}</div>
      <h1 class="page-title">Knowledge Graph</h1>
      <div class="page-rule" />
    </div>
    <div class="graph-body">
      <div v-if="!loaded" class="graph-loading">
        <div class="graph-loading-text">Building graph…</div>
      </div>
      <NotesGraph
        v-else
        :campaign-id="campaignId"
        @navigate="onNavigate"
      />
    </div>
  </div>
</template>


<script setup lang="ts">
import { useNotesStore } from '~/stores/notes'
import { dbApi } from '~/composables/useDb'

const TYPE_PLURAL_ROUTE: Record<string, string> = {
  npc: 'npcs', location: 'locations',
  faction: 'factions', quest: 'quests', event: 'events',
  session: 'sessions', note: 'notes',
}

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const campaignId = Number(route.params.id)
const campaignName = ref('')
const loaded = ref(false)

function onNavigate(type: string, name: string) {
  const entry = store.findByTypeAndName(type, name)
  if (!entry) return
  router.push(`/campaign/${campaignId}/${TYPE_PLURAL_ROUTE[type] ?? type + 's'}/${entry.id}`)
}

onMounted(async () => {
  const [camp] = await Promise.all([
    dbApi.campaigns.get(campaignId),
    store.loadAll(campaignId),
  ])
  campaignName.value = camp?.name ?? ''
  loaded.value = true
})
</script>


<style scoped>
.graph-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.graph-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.graph-loading-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text2, #8a7a65);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
