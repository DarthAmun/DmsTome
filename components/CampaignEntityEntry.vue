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
import { ENTITY_TYPE_ROUTE } from '~/types/entities'
import type { EntityType } from '~/types/entities'

const props = defineProps<{ type: EntityType }>()

const route = useRoute()
const router = useRouter()
const campaignId = Number(route.params.id)

const { currentEntry, goToList, ensureLoaded, store } = useCampaignEntity(props.type)

function onNavigate(type: string, name: string) {
  const entry = store.findByTypeAndName(type, name)
  if (!entry) return
  router.push(`/campaign/${campaignId}/${ENTITY_TYPE_ROUTE[type as keyof typeof ENTITY_TYPE_ROUTE] ?? type + 's'}/${entry.id}`)
}

onMounted(() => ensureLoaded())
</script>
