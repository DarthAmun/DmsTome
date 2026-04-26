<template>
  <div class="entry-folio">
    <div class="open-book" v-if="currentEntry">
      <!-- Left page: editor -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <NoteEditor
            :entity-id="currentEntry.id"
            :campaign-id="campaignId"
            side="editor"
            @navigate="onNavigate"
            @deleted="goToList()"
          />
        </div>
      </div>

      <div class="book-binding"></div>

      <!-- Right page: preview -->
      <div class="book-stack book-stack--right">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--right">
          <NoteEditor
            :entity-id="currentEntry.id"
            :campaign-id="campaignId"
            side="preview"
            @navigate="onNavigate"
            @deleted="goToList()"
          />
        </div>
      </div>
    </div>
    <div v-else class="leaf-empty entry-folio__not-found">
      <em>Entry not found.</em>
      <button class="entry-folio__back" @click="goToList()">← Back</button>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useCampaignEntity } from '~/composables/useCampaignEntity'
import type { EntityType } from '~/types/entities'

const props = defineProps<{ type: EntityType }>()

const route = useRoute()
const router = useRouter()
const campaignId = Number(route.params.id)

const {
  currentEntry, goToList, ensureLoaded, store,
} = useCampaignEntity(props.type)

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


<style scoped>
.entry-folio {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.entry-folio .open-book {
  flex: 1;
  min-height: 0;
}

.entry-folio__not-found {
  flex: 1;
  gap: 16px;
}

.entry-folio__back {
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0;
}
.entry-folio__back:hover { color: var(--blood); }
</style>
