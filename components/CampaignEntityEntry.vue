<template>
  <template v-if="currentEntry">
    <div class="entry-pane">
      <div class="entry-pane-editor">
        <NoteEditor
          :entity-id="currentEntry.id"
          :campaign-id="campaignId"
          side="editor"
          @navigate="onNavigate"
          @deleted="goToList()"
        />
      </div>
      <div class="entry-pane-preview">
        <NoteEditor
          :entity-id="currentEntry.id"
          :campaign-id="campaignId"
          side="preview"
          @navigate="onNavigate"
          @deleted="goToList()"
        />
      </div>
    </div>
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
  npc: 'npcs', location: 'locations', item: 'items',
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
