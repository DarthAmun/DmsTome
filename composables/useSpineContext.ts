import { useSystemsStore } from '~/stores/systems'
import { useNotesStore } from '~/stores/notes'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'

export function useSpineContext() {
  const route = useRoute()
  const systemsStore = useSystemsStore()
  const notesStore = useNotesStore()

  // ── Which Level 1 is active ──────────────────────────────────
  const activeLevelOne = computed<'campaigns' | 'systems' | null>(() => {
    if (route.path.startsWith('/campaign/')) return 'campaigns'
    if (route.path.startsWith('/system/')) return 'systems'
    return null
  })

  // ── Campaign context ─────────────────────────────────────────
  const campaignId = computed(() => {
    const id = route.params.id
    if (!route.path.startsWith('/campaign/')) return null
    return id ? Number(id) : null
  })

  // ── System context ───────────────────────────────────────────
  const systemId = computed(() => {
    const id = route.params.id
    if (!route.path.startsWith('/system/')) return null
    return id ? Number(id) : null
  })

  const currentSystem = computed(() =>
    systemId.value ? systemsStore.getSystem(systemId.value) : null
  )

  // ── Level 2 visibility ───────────────────────────────────────
  const showCampaignTabs = computed(() =>
    route.path.startsWith('/campaign/')
  )

  const showSystemTabs = computed(() =>
    route.path.startsWith('/system/')
  )

  // ── Level 3 — current entity type ───────────────────────────
  // Campaign context: /campaign/:id/npcs, /campaign/:id/npcs/:entryId, etc.
  const campaignActiveType = computed(() => {
    const path = route.path
    const TYPE_ROUTE_MAP: Record<string, string> = {
      npcs: 'npc', locations: 'location',
      factions: 'faction', quests: 'quest', events: 'event',
      sessions: 'session', notes: 'note',
    }
    for (const [segment, type] of Object.entries(TYPE_ROUTE_MAP)) {
      if (path.includes(`/${segment}`)) return type
    }
    return null
  })

  const campaignActiveTypeConfig = computed(() => {
    if (!campaignActiveType.value) return null
    const config = ENTITY_TYPE_CONFIG[campaignActiveType.value as keyof typeof ENTITY_TYPE_CONFIG]
    return config ?? null
  })

  // System context: /system/:id/:typeId (but not /builder or /library)
  const systemActiveTypeId = computed(() => {
    const typeId = route.params.typeId as string
    if (!typeId) return null
    if (typeId === 'builder' || typeId === 'library') return null
    return typeId
  })

  const systemActiveType = computed(() => {
    if (!systemActiveTypeId.value || !currentSystem.value) return null
    return currentSystem.value.entityTypes.find(
      et => et.id === systemActiveTypeId.value
    ) ?? null
  })

  // ── Combined Level 3 ─────────────────────────────────────────
  const levelThree = computed(() => {
    if (campaignActiveTypeConfig.value) {
      const config = campaignActiveTypeConfig.value
      return {
        icon: config.defaultIcon,
        label: config.plural,
        color: config.color,
        route: route.path,
      }
    }
    if (systemActiveType.value) {
      return {
        icon: systemActiveType.value.icon || 'gi-scroll-unfurled',
        label: systemActiveType.value.plural,
        color: systemActiveType.value.color,
        route: route.path,
      }
    }
    return null
  })

  return {
    activeLevelOne,
    campaignId,
    systemId,
    currentSystem,
    showCampaignTabs,
    showSystemTabs,
    campaignActiveType,
    systemActiveTypeId,
    levelThree,
  }
}
