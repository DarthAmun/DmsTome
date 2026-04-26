<template>
  <div class="graph-page">
    <div class="page-header graph-header">
      <div class="page-chapter-num">{{ campaignName }}</div>
      <h1 class="page-title">Knowledge Graph</h1>
      <div class="page-rule" />
    </div>
    <div class="graph-body">
      <NotesGraph
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
  npc: 'npcs', location: 'locations', item: 'items',
  faction: 'factions', quest: 'quests', event: 'events',
  session: 'sessions', note: 'notes',
}

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const campaignId = Number(route.params.id)
const campaignName = ref('')

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
}
</style>
