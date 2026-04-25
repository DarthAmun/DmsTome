/**
 * Extracts HP/AC from record data and picks which entity types look like
 * combatants. Replaces near-identical logic in the encounter page and
 * TokenEditModal.
 */
import { dbApi } from '~/composables/useDb'
import { useSystemsStore } from '~/stores/systems'

const HP_RE = /\b(hp|health|hit.?point|hpmax|hp.?max)\b/i
const AC_RE = /\b(ac|armou?r.?class|armor)\b/i
const NON_COMBAT_RE = /\b(condition|spell|item|feat|trait|skill|background|ancestry)\b/i

export interface ExtractedStats {
  hpCurrent: number | null
  hpMax: number | null
  ac: number | null
}

export function useStatBlockLinker() {
  const systemsStore = useSystemsStore()

  /** Generic single-stat extractor used by both HP and AC paths. Checks
   *  object shapes ({max, current, value}) before plain number coercion. */
  function extractStatValue(
    data: Record<string, any>,
    re: RegExp,
    fields?: Array<{ key: string; label?: string }>,
  ): number | null {
    // 1. Match key names
    for (const [key, val] of Object.entries(data)) {
      if (!re.test(key)) continue
      const n = coerceNumber(val)
      if (n !== null) return n
    }
    // 2. Fallback: match field labels from entity-type schema
    if (fields) {
      for (const f of fields) {
        if (!re.test(f.label ?? '') && !re.test(f.key)) continue
        const val = (data as any)[f.key]
        if (val === undefined || val === null) continue
        const n = coerceNumber(val)
        if (n !== null) return n
      }
    }
    return null
  }

  /** Pulls HP (current/max) and AC from a record's data object.
   *  HP may appear as {max, current}; falls back to the plain number. */
  function extractStatsFromData(
    data: Record<string, any>,
    fields?: Array<{ key: string; label?: string }>,
  ): ExtractedStats {
    let hpMax: number | null = null
    let hpCurrent: number | null = null
    let ac: number | null = null

    for (const [k, v] of Object.entries(data)) {
      if (HP_RE.test(k)) {
        if (v && typeof v === 'object' && 'max' in v) {
          hpMax = Number((v as any).max) || null
          hpCurrent = Number((v as any).current ?? (v as any).max) || null
        } else {
          const n = Number(v)
          if (!isNaN(n) && n > 0) { hpMax = n; hpCurrent = n }
        }
      }
      if (AC_RE.test(k)) {
        const n = Number(v)
        if (!isNaN(n) && n > 0) ac = n
      }
    }

    // Field-label fallback for HP
    if (hpMax === null && fields) {
      for (const f of fields) {
        if (!HP_RE.test(f.label ?? '') && !HP_RE.test(f.key)) continue
        const raw = (data as any)[f.key]
        if (raw === undefined || raw === null) continue
        if (raw && typeof raw === 'object' && 'max' in raw) {
          hpMax = Number((raw as any).max) || null
          hpCurrent = Number((raw as any).current ?? (raw as any).max) || null
        } else {
          const n = Number(raw)
          if (!isNaN(n) && n > 0) { hpMax = n; hpCurrent = n }
        }
        if (hpMax !== null) break
      }
    }
    if (ac === null && fields) {
      const n = extractStatValue(data, AC_RE, fields)
      if (n !== null) ac = n
    }

    return { hpCurrent, hpMax, ac }
  }

  /** Returns ids of entity types that look like combatants. Falls back to
   *  non-utility types if none declare HP/AC, then to all types. */
  async function getCombatantTypes(systemId: number): Promise<string[]> {
    if (!systemsStore.getSystem(systemId)) await systemsStore.loadAll()
    const system = systemsStore.getSystem(systemId)
    if (!system) return []
    const allTypes: any[] = system.entityTypes ?? []

    let ids = allTypes
      .filter((et: any) => (et.fields ?? []).some((f: any) =>
        HP_RE.test(f.key) || HP_RE.test(f.label ?? '') ||
        AC_RE.test(f.key) || AC_RE.test(f.label ?? '')
      ))
      .map((et: any) => et.id)

    if (!ids.length) {
      ids = allTypes
        .filter((et: any) => !NON_COMBAT_RE.test(et.name ?? '') && !NON_COMBAT_RE.test(et.id ?? ''))
        .map((et: any) => et.id)
    }
    if (!ids.length) ids = allTypes.map((et: any) => et.id)
    return ids
  }

  /** Loads a record by id and pulls HP/AC, consulting the record's entity
   *  type schema for field-label fallback when keys don't match. */
  async function linkRecordToToken(recordId: number): Promise<ExtractedStats> {
    const rec = await dbApi.records.get(recordId)
    if (!rec) return { hpCurrent: null, hpMax: null, ac: null }
    const data: Record<string, any> = typeof rec.data === 'string'
      ? JSON.parse(rec.data || '{}')
      : (rec.data ?? {})
    if (!systemsStore.getSystem(rec.systemId)) await systemsStore.loadAll()
    const sys = systemsStore.getSystem(rec.systemId)
    const et: any = sys?.entityTypes?.find((t: any) => t.id === rec.entityTypeId)
    const fields: Array<{ key: string; label?: string }> = et?.fields ?? []
    return extractStatsFromData(data, fields)
  }

  return {
    extractStatValue,
    extractStatsFromData,
    getCombatantTypes,
    linkRecordToToken,
    HP_RE,
    AC_RE,
  }
}

function coerceNumber(val: any): number | null {
  if (typeof val === 'number') return isFinite(val) ? val : null
  if (val && typeof val === 'object') {
    for (const k of ['max', 'current', 'value']) {
      const n = Number((val as any)[k])
      if (!isNaN(n)) return n
    }
  }
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}
