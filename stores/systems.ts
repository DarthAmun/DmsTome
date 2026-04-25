// Manages DbRecord (records table) — system-scoped structured library entries.
// See the DATA MODEL NOTE in composables/useDb.ts for the full two-system explanation.
import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import type { SystemSchema, EntityTypeSchema } from '~/types/entities'
import { getDb } from '~/composables/useDb'

export const useSystemsStore = defineStore('systems', () => {
  const systems = ref<SystemSchema[]>([])
  const isLoading = ref(false)

  async function loadAll() {
    isLoading.value = true
    try {
      const rows = await getDb().systems.orderBy('updatedAt').reverse().toArray()
      systems.value = rows.map(normalizeSystem)
    } catch (err) {
      console.error('[SystemsStore] loadAll:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createSystem(data: { name: string; shortId: string; description?: string }) {
    try {
      const schema: SystemSchema = {
        name: data.name,
        shortId: data.shortId,
        description: data.description ?? '',
        version: '1.0',
        entityTypes: [],
      }
      const ts = new Date().toISOString()
      const id = await getDb().systems.add({
        name: schema.name,
        shortId: schema.shortId,
        description: schema.description,
        version: schema.version,
        entityTypes: JSON.stringify([]),
        createdAt: ts,
        updatedAt: ts,
      })
      const created = await getDb().systems.get(id)
      const sys = normalizeSystem(created!)
      systems.value.unshift(sys)
      return sys
    } catch (err) {
      console.error('[SystemsStore] createSystem:', err)
      throw err
    }
  }

  async function updateSystem(id: number, updates: Partial<SystemSchema>) {
    try {
      const ts = new Date().toISOString()
      const payload: any = { updatedAt: ts }
      if (updates.name !== undefined) payload.name = updates.name
      if (updates.shortId !== undefined) payload.shortId = updates.shortId
      if (updates.description !== undefined) payload.description = updates.description
      if (updates.version !== undefined) payload.version = updates.version
      if (updates.entityTypes !== undefined) payload.entityTypes = JSON.stringify(updates.entityTypes)

      // Update in-memory immediately so computed values derived from the store
      // (e.g. cardFields in [typeId].vue) reflect the change without waiting for the DB round-trip
      const idx = systems.value.findIndex(s => s.id === id)
      if (idx >= 0) {
        systems.value[idx] = normalizeSystem({ ...toRaw(systems.value[idx]), ...payload })
      }

      await getDb().systems.update(id, payload)
      // Reconcile with DB-confirmed data (handles any normalisation differences)
      const confirmed = normalizeSystem((await getDb().systems.get(id))!)
      if (idx >= 0) systems.value[idx] = confirmed
      return confirmed
    } catch (err) {
      console.error('[SystemsStore] updateSystem:', err)
      throw err
    }
  }

  async function deleteSystem(id: number) {
    try {
      await getDb().systems.delete(id)
      await getDb().records.where('systemId').equals(id).delete()
      systems.value = systems.value.filter(s => s.id !== id)
    } catch (err) {
      console.error('[SystemsStore] deleteSystem:', err)
      throw err
    }
  }

  // Import a system from JSON (schema only, no records)
  async function importSystem(json: string) {
    try {
      const schema = JSON.parse(json) as SystemSchema
      const ts = new Date().toISOString()
      const id = await getDb().systems.add({
        name: schema.name,
        shortId: schema.shortId,
        description: schema.description,
        version: schema.version,
        entityTypes: JSON.stringify(schema.entityTypes ?? []),
        createdAt: ts,
        updatedAt: ts,
      })
      const created = normalizeSystem((await getDb().systems.get(id))!)
      systems.value.unshift(created)
      return created
    } catch (err) {
      console.error('[SystemsStore] importSystem:', err)
      throw err
    }
  }

  function exportSystem(id: number): string {
    const sys = systems.value.find(s => s.id === id)
    if (!sys) throw new Error('System not found')
    const { createdAt, updatedAt, ...schema } = sys
    return JSON.stringify(schema, null, 2)
  }

  function getSystem(id: number) {
    return systems.value.find(s => s.id === id) ?? null
  }

  function normalizeSystem(raw: any): SystemSchema {
    return {
      id: raw.id,
      name: raw.name,
      shortId: raw.shortId,
      description: raw.description ?? '',
      version: raw.version ?? '1.0',
      entityTypes: typeof raw.entityTypes === 'string'
        ? JSON.parse(raw.entityTypes || '[]')
        : (raw.entityTypes ?? []),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }
  }

  return {
    systems, isLoading,
    loadAll, createSystem, updateSystem, deleteSystem,
    importSystem, exportSystem, getSystem,
  }
})
