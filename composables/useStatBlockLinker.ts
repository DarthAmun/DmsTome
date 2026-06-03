/**
 * Extracts HP/AC/size from record data and picks which entity types look like
 * combatants. Replaces near-identical logic in the encounter page and
 * TokenEditModal.
 */
import { dbApi } from '~/composables/useDb'
import { useSystems } from '~/composables/useSystems'
import type { FieldComponentType } from '~/types/entities'

const HP_RE = /\b(hp|health|hit.?point|hpmax|hp.?max)\b/i
const AC_RE = /\b(ac|armou?r.?class|armor)\b/i
const NON_COMBAT_RE = /\b(condition|spell|item|feat|trait|skill|background|ancestry)\b/i

export const SIZE_STRING_MAP: Record<string, number> = {
  tiny: 1, small: 1, medium: 1, large: 2, huge: 3, gargantuan: 4,
}

// Component types whose values are arrays of short strings (e.g. PF2e traits).
// These are checked first and win over plain string fields.
const ARRAY_SIZE_COMPONENTS = new Set<FieldComponentType>(['tags', 'multiselect', 'trait-picker'])
// Component types that hold a single short string (e.g. a D&D size select).
const STRING_SIZE_COMPONENTS = new Set<FieldComponentType>(['text', 'select'])

const SIZE_FIELD_RE = /\bsize\b/i

function coerceSize(raw: unknown): number | null {
  if (typeof raw === 'string') return SIZE_STRING_MAP[raw.toLowerCase().trim()] ?? null
  return null
}

function extractHpFromObject(obj: any): { hpMax: number | null; hpCurrent: number | null } {
  const rawMax = obj.max
  const rawCur = obj.current ?? rawMax
  return {
    hpMax: rawMax != null ? Number(rawMax) : null,
    hpCurrent: rawCur != null ? Number(rawCur) : null,
  }
}

function toStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string')
  if (typeof raw === 'string') return raw.split(',').map(s => s.trim())
  return []
}

export interface ExtractedStats {
  hpCurrent: number | null
  hpMax: number | null
  ac: number | null
  size: number
}

type FieldMeta = { key: string; label?: string; component?: FieldComponentType }

export function useStatBlockLinker() {
  const systemsStore = useSystems()

  /** Generic single-stat extractor used by both HP and AC paths. Checks
   *  object shapes ({max, current, value}) before plain number coercion. */
  function extractStatValue(
    data: Record<string, any>,
    re: RegExp,
    fields?: FieldMeta[],
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

  /**
   * Extracts grid size from field values by component type, not key name.
   *
   * Priority:
   *   1. tags / multiselect fields — scan each element; first size match wins.
   *      These beat string fields so a correctly-tagged PF2e trait ("Large")
   *      wins over a stale plain-text size field ("medium").
   *   2. text / select fields — only if the whole value is a known size word.
   *
   * textarea, number, tracker, and other heavy components are intentionally
   * skipped to avoid false positives from description prose.
   */
  function extractSizeFromFields(data: Record<string, any>, fields: FieldMeta[]): number | null {
    let fromArray: number | null = null   // best match from tags/multiselect/trait-picker
    let fromString: number | null = null  // fallback from text/select

    for (const f of fields) {
      const raw = data[f.key]
      if (raw == null) continue
      const { component: comp } = f
      const isSizeField = SIZE_FIELD_RE.test(f.key) || SIZE_FIELD_RE.test(f.label ?? '')

      if (comp && ARRAY_SIZE_COMPONENTS.has(comp)) {
        for (const el of toStringArray(raw)) {
          const s = coerceSize(el)
          if (s !== null) {
            // Prefer a field explicitly named "size*"; otherwise keep the first match
            if (isSizeField || fromArray === null) fromArray = s
            if (isSizeField) break
          }
        }
      } else if (comp && STRING_SIZE_COMPONENTS.has(comp) && fromString === null) {
        fromString = coerceSize(raw)
      }
    }

    return fromArray ?? fromString
  }

  /** Pulls HP (current/max), AC, and grid size from a record's data object. */
  function extractStatsFromData(
    data: Record<string, any>,
    fields?: FieldMeta[],
  ): ExtractedStats {
    let hpMax: number | null = null
    let hpCurrent: number | null = null
    let ac: number | null = null

    for (const [k, v] of Object.entries(data)) {
      if (HP_RE.test(k)) {
        if (v && typeof v === 'object' && 'max' in v) {
          const hp = extractHpFromObject(v)
          hpMax = hp.hpMax; hpCurrent = hp.hpCurrent
        } else {
          const n = Number(v)
          if (!isNaN(n) && n >= 0) { hpMax = n; hpCurrent = n }
        }
      }
      if (AC_RE.test(k)) {
        const n = coerceNumber(v)
        if (n !== null && n > 0) ac = n
      }
    }

    // Field-label fallback for HP
    if (hpMax === null && fields) {
      for (const f of fields) {
        if (!HP_RE.test(f.label ?? '') && !HP_RE.test(f.key)) continue
        const raw = (data as any)[f.key]
        if (raw === undefined || raw === null) continue
        if (raw && typeof raw === 'object' && 'max' in raw) {
          const hp = extractHpFromObject(raw)
          hpMax = hp.hpMax; hpCurrent = hp.hpCurrent
        } else {
          const n = Number(raw)
          if (!isNaN(n) && n >= 0) { hpMax = n; hpCurrent = n }
        }
        if (hpMax !== null) break
      }
    }
    if (ac === null && fields) {
      const n = extractStatValue(data, AC_RE, fields)
      if (n !== null) ac = n
    }

    const size = fields ? (extractSizeFromFields(data, fields) ?? 1) : 1

    return { hpCurrent, hpMax, ac, size }
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

  async function loadRecordWithFields(recordId: number) {
    const rec = await dbApi.records.get(recordId)
    if (!rec) return null
    const data: Record<string, any> = typeof rec.data === 'string'
      ? JSON.parse(rec.data || '{}')
      : (rec.data ?? {})
    if (!systemsStore.getSystem(rec.systemId)) await systemsStore.loadAll()
    const sys = systemsStore.getSystem(rec.systemId)
    const et: any = sys?.entityTypes?.find((t: any) => t.id === rec.entityTypeId)
    const fields: FieldMeta[] = et?.fields ?? []
    return { rec, data, fields }
  }

  async function linkRecordToToken(recordId: number): Promise<ExtractedStats> {
    const loaded = await loadRecordWithFields(recordId)
    if (!loaded) return { hpCurrent: null, hpMax: null, ac: null, size: 1 }
    return extractStatsFromData(loaded.data, loaded.fields)
  }

  /** Loads a record and extracts stats + image, returning everything needed
   *  to create an encounter token. */
  async function extractAllFromRecord(recordId: number): Promise<ExtractedStats & { imageSource: string | null; imageType: 'file' | 'url'; name: string }> {
    const loaded = await loadRecordWithFields(recordId)
    if (!loaded) return { hpCurrent: null, hpMax: null, ac: null, size: 1, imageSource: null, imageType: 'file', name: '' }
    const { rec, data, fields } = loaded
    const stats = extractStatsFromData(data, fields)
    const imageSource = extractImageFromRecord(data, fields)
    return {
      ...stats,
      imageSource,
      imageType: imageSource?.startsWith('http') ? 'url' : 'file',
      name: rec.name,
    }
  }

  /** Returns the image data URL from a record's data, using the entity type
   *  schema to find the field with component === 'image'. */
  function extractImageFromRecord(
    data: Record<string, any>,
    fields?: FieldMeta[],
  ): string | null {
    if (!fields) return null
    const imgField = fields.find(f => f.component === 'image')
    if (!imgField) return null
    const val = data[imgField.key]
    return typeof val === 'string' && val ? val : null
  }

  return {
    extractStatValue,
    extractStatsFromData,
    extractImageFromRecord,
    extractAllFromRecord,
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
