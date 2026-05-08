<template>
  <template v-if="currentEntry">
    <NpcEditor
      v-if="props.type === 'npc'"
      :entity-id="currentEntry.id"
      :campaign-id="campaignId"
      @navigate="onNavigate"
      @deleted="goToList()"
    />
    <LocationEditor
      v-else-if="props.type === 'location'"
      :entity-id="currentEntry.id"
      :campaign-id="campaignId"
      @navigate="onNavigate"
      @deleted="goToList()"
    />
    <FactionEditor
      v-else-if="props.type === 'faction'"
      :entity-id="currentEntry.id"
      :campaign-id="campaignId"
      @navigate="onNavigate"
      @deleted="goToList()"
    />
    <QuestEditor
      v-else-if="props.type === 'quest'"
      :entity-id="currentEntry.id"
      :campaign-id="campaignId"
      @navigate="onNavigate"
      @deleted="goToList()"
    />
    <EventEditor
      v-else-if="props.type === 'event'"
      :entity-id="currentEntry.id"
      :campaign-id="campaignId"
      @navigate="onNavigate"
      @deleted="goToList()"
    />
    <SessionEditor
      v-else-if="props.type === 'session'"
      :entity-id="currentEntry.id"
      :campaign-id="campaignId"
      @navigate="onNavigate"
      @deleted="goToList()"
    />
    <NoteEditorSimple
      v-else
      :entity-id="currentEntry.id"
      :campaign-id="campaignId"
      @navigate="onNavigate"
      @deleted="goToList()"
    />
  </template>
  <template v-else>
    <div class="edetail-empty">
      <span>Entry not found.</span>
      <button class="btn-accent-sm" @click="goToList()">← Back</button>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useCampaignEntity } from '~/composables/useCampaignEntity'
import type { EntityType } from '~/types/entities'

const props = defineProps<{ type: EntityType }>()

const route = useRoute()
const router = useRouter()
const campaignId = Number(route.params.id)

const { currentEntry, goToList, ensureLoaded, store } = useCampaignEntity(props.type)

const TYPE_PLURAL_ROUTE: Record<string, string> = {
  npc: 'npcs', location: 'locations',
  faction: 'factions', quest: 'quests', event: 'events',
  session: 'sessions', note: 'notes',
}

function onNavigate(type: string, name: string) {
  const entry = store.findByTypeAndName(type, name)
  if (!entry) return
  router.push(`/campaign/${campaignId}/${TYPE_PLURAL_ROUTE[type] ?? type + 's'}/${entry.id}`)
}

onMounted(() => ensureLoaded())
</script>
