// Manages DbEntity (entities table) — campaign-scoped notes and lore.
// See the DATA MODEL NOTE in composables/useDb.ts for the full two-system explanation.
import { defineStore } from 'pinia'
import { extractLinks } from '~/composables/useEntityParser'
import { dbApi } from '~/composables/useDb'
import type { EntityType, EntityAttributes } from '~/types/entities'

export interface Entity {
  id: number
  campaignId: number
  type: EntityType
  name: string
  content: string
  attributes: EntityAttributes
  createdAt: string
  updatedAt: string
}

export interface EntityLink {
  id: number
  sourceId: number
  targetType: string
  targetName: string
  metadata: Record<string, string>
}

export const useNotesStore = defineStore('notes', () => {
  const entities = ref<Entity[]>([])
  const currentEntity = ref<Entity | null>(null)
  const links = ref<EntityLink[]>([])
  const isLoading = ref(false)

  const byType = computed(() => {
    const map: Record<string, Entity[]> = {}
    for (const e of entities.value) {
      if (!map[e.type]) map[e.type] = []
      map[e.type].push(e)
    }
    return map
  })

  async function loadAll(campaignId: number) {
    isLoading.value = true
    try {
      const [ents, lnks] = await Promise.all([
        dbApi.entities.list(campaignId),
        dbApi.entities.listLinks(campaignId),
      ])
      entities.value = ents.map(normalize)
      links.value = lnks.map(normalizeLink)
    } catch (err) {
      console.error('[NotesStore] loadAll:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function loadEntity(id: number) {
    try {
      const raw = await dbApi.entities.get(id)
      if (!raw) return null
      currentEntity.value = normalize(raw)
      return currentEntity.value
    } catch (err) {
      console.error('[NotesStore] loadEntity:', err)
      return null
    }
  }

  async function createEntity(campaignId: number, type: EntityType, name: string) {
    try {
      const raw = await dbApi.entities.create({ campaignId, type, name, content: '', attributes: '{}' })
      const entity = normalize(raw)
      entities.value.unshift(entity)
      return entity
    } catch (err) {
      console.error('[NotesStore] createEntity:', err)
      throw err
    }
  }

  async function updateEntity(id: number, updates: { name?: string; content?: string; attributes?: EntityAttributes }) {
    try {
      const entity = entities.value.find(e => e.id === id)
      if (entity) Object.assign(entity, updates)
      if (currentEntity.value?.id === id) Object.assign(currentEntity.value, updates)

      const payload: any = { id }
      if (updates.name !== undefined) payload.name = updates.name
      if (updates.content !== undefined) payload.content = updates.content
      if (updates.attributes !== undefined) payload.attributes = JSON.stringify(updates.attributes)

      await dbApi.entities.update(payload)

      if (updates.content !== undefined) await syncLinks(id, updates.content)
    } catch (err) {
      console.error('[NotesStore] updateEntity:', err)
      throw err
    }
  }

  async function deleteEntity(id: number) {
    try {
      await dbApi.entities.delete(id)
      entities.value = entities.value.filter(e => e.id !== id)
      links.value = links.value.filter(l => l.sourceId !== id)
      if (currentEntity.value?.id === id) currentEntity.value = null
    } catch (err) {
      console.error('[NotesStore] deleteEntity:', err)
      throw err
    }
  }

  async function syncLinks(entityId: number, content: string) {
    const parsed = extractLinks(content)
    await dbApi.entities.deleteLinks(entityId)
    const newLinks: EntityLink[] = []
    for (const link of parsed) {
      const raw = await dbApi.entities.createLink({
        sourceId: entityId,
        targetType: link.type,
        targetName: link.name,
        metadata: JSON.stringify(link.metadata),
      })
      newLinks.push(normalizeLink(raw))
    }
    links.value = [...links.value.filter(l => l.sourceId !== entityId), ...newLinks]
  }

  function findByTypeAndName(type: string, name: string): Entity | null {
    return entities.value.find(
      e => e.type === type && e.name.toLowerCase() === name.toLowerCase()
    ) ?? null
  }

  function linksFrom(id: number) {
    return links.value.filter(l => l.sourceId === id)
  }

  function backlinksTo(type: string, name: string) {
    return links.value.filter(
      l => l.targetType === type && l.targetName.toLowerCase() === name.toLowerCase()
    )
  }

  function getGraphData(campaignId: number) {
    const nodes = entities.value
      .filter(e => e.campaignId === campaignId)
      .map(e => ({ data: { id: `${e.type}-${e.id}`, label: e.name, type: e.type, entityId: e.id } }))

    const edges = links.value
      .filter(l => entities.value.find(e => e.id === l.sourceId)?.campaignId === campaignId)
      .map(l => {
        const source = entities.value.find(e => e.id === l.sourceId)
        const target = entities.value.find(e => e.type === l.targetType && e.name.toLowerCase() === l.targetName.toLowerCase())
        if (!source || !target) return null
        const metaLabel = Object.entries(l.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')
        return { data: { id: `edge-${l.id}`, source: `${source.type}-${source.id}`, target: `${target.type}-${target.id}`, label: metaLabel, metadata: l.metadata } }
      })
      .filter(Boolean)

    return { nodes, edges }
  }

  function normalize(raw: any): Entity {
    return {
      id: raw.id,
      campaignId: raw.campaign_id,
      type: raw.type,
      name: raw.name,
      content: raw.content ?? '',
      attributes: typeof raw.attributes === 'string' ? JSON.parse(raw.attributes || '{}') : (raw.attributes ?? {}),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    }
  }

  function normalizeLink(raw: any): EntityLink {
    return {
      id: raw.id,
      sourceId: raw.source_id,
      targetType: raw.target_type,
      targetName: raw.target_name,
      metadata: typeof raw.metadata === 'string' ? JSON.parse(raw.metadata || '{}') : (raw.metadata ?? {}),
    }
  }

  // Returns all locations that have a pin for the given entity id
  function pinnedLocationsFor(entityId: number) {
    return entities.value.filter(e => {
      const attrs = e.attributes as any
      return Array.isArray(attrs.mapPins) && attrs.mapPins.some((p: any) => p.entityId === entityId)
    }).map(e => {
      const attrs = e.attributes as any
      const pin = attrs.mapPins.find((p: any) => p.entityId === entityId)
      return { location: e, x: pin.x, y: pin.y }
    })
  }

  return {
    entities, currentEntity, links, isLoading, byType,
    loadAll, loadEntity, createEntity, updateEntity, deleteEntity,
    findByTypeAndName, linksFrom, backlinksTo, getGraphData, pinnedLocationsFor,
  }
})
