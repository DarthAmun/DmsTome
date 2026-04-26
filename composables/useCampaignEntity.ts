import { useNotesStore } from '~/stores/notes'
import type { Entity } from '~/stores/notes'
import type { EntityType } from '~/types/entities'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import { useFormatters } from '~/composables/useFormatters'

const TYPE_PLURAL_ROUTE: Record<string, string> = {
  npc: 'npcs', location: 'locations', item: 'items',
  faction: 'factions', quest: 'quests', event: 'events',
  session: 'sessions', note: 'notes',
}

function typeRoute(t: string) {
  return TYPE_PLURAL_ROUTE[t] ?? t + 's'
}

export function useCampaignEntity(type: EntityType) {
  const route = useRoute()
  const router = useRouter()
  const store = useNotesStore()
  const { formatDateShort } = useFormatters()

  const campaignId = computed(() => Number(route.params.id))
  const typeConfig = computed(() => ENTITY_TYPE_CONFIG[type])

  // ── List ────────────────────────────────────────────────────
  const entries = computed(() =>
    (store.byType[type] ?? []).slice().sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )
  )

  const leftEntries = computed(() => {
    const a = entries.value
    return a.slice(0, Math.ceil(a.length / 2))
  })

  const rightEntries = computed(() => {
    const a = entries.value
    return a.slice(Math.ceil(a.length / 2))
  })

  // ── Entry ───────────────────────────────────────────────────
  const entryId = computed(() =>
    route.params.entryId ? Number(route.params.entryId) : null
  )

  const currentEntry = computed(() =>
    entryId.value
      ? store.entities.find(e => e.id === entryId.value) ?? null
      : null
  )

  // ── Navigation ──────────────────────────────────────────────
  function openEntry(entry: Entity) {
    router.push(`/campaign/${campaignId.value}/${typeRoute(type)}/${entry.id}`)
  }

  function goToList() {
    router.push(`/campaign/${campaignId.value}/${typeRoute(type)}`)
  }

  // ── CRUD ────────────────────────────────────────────────────
  async function createEntry() {
    const entity = await store.createEntity(
      campaignId.value, type,
      `New ${typeConfig.value?.label ?? type}`
    )
    openEntry(entity)
  }

  async function deleteEntry(id: number) {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    await store.deleteEntity(id)
    if (entryId.value === id) goToList()
  }

  // ── Load ────────────────────────────────────────────────────
  async function ensureLoaded() {
    if (!store.entities.length) {
      await store.loadAll(campaignId.value)
    }
  }

  return {
    campaignId, typeConfig,
    entries, leftEntries, rightEntries,
    entryId, currentEntry,
    openEntry, goToList, createEntry, deleteEntry,
    ensureLoaded, formatDateShort,
    store,
  }
}
