export interface EntityRef {
  type: string
  name: string
  metadata: Record<string, string>
  raw: string
  start: number
  end: number
}

export interface ParsedLink {
  type: string
  name: string
  metadata: Record<string, string>
}

const ENTITY_TYPES = ['note', 'npc', 'item', 'location', 'faction', 'quest', 'event', 'session', 'encounter']

// Allows apostrophes and other special chars in names — stops only at | or }
const ENTITY_REGEX = /\{\{(\w+):\s*([^|}\n]+?)\s*(?:\|\s*([^}]*))?\}\}/g

function parseMeta(metaStr: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  if (!metaStr) return metadata
  metaStr.split(',').forEach(pair => {
    // support both = and : as separator
    const idx = pair.search(/[=:]/)
    if (idx === -1) return
    const k = pair.slice(0, idx).trim()
    const v = pair.slice(idx + 1).trim()
    if (k) metadata[k] = v
  })
  return metadata
}

export function parseEntityRefs(content: string): EntityRef[] {
  const refs: EntityRef[] = []
  let match: RegExpExecArray | null
  ENTITY_REGEX.lastIndex = 0
  while ((match = ENTITY_REGEX.exec(content)) !== null) {
    const [raw, type, name, metaStr] = match
    if (!ENTITY_TYPES.includes(type.toLowerCase())) continue
    refs.push({
      type: type.toLowerCase(),
      name: name.trim(),
      metadata: parseMeta(metaStr ?? ''),
      raw,
      start: match.index,
      end: match.index + raw.length,
    })
  }
  return refs
}

export function renderEntityRefs(
  html: string,
  entityLookup?: (type: string, name: string) => { imageUrl?: string; iconHtml?: string; color?: string } | null,
  extraTypes?: string[]
): string {
  const allTypes = extraTypes?.length ? [...ENTITY_TYPES, ...extraTypes.map(t => t.toLowerCase())] : ENTITY_TYPES
  return html.replace(ENTITY_REGEX, (raw, type, name, metaStr) => {
    if (type.toLowerCase() === 'roll') {
      const expr = name.trim()
      return `<span class="roll-ref" data-roll="${expr}">🎲 ${expr}</span>`
    }
    if (!allTypes.includes(type.toLowerCase())) return raw
    const metadata = parseMeta(metaStr ?? '')
    const metaLabel = Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(', ')
    const tooltip = metaLabel ? ` (${metaLabel})` : ''
    const extra = entityLookup ? entityLookup(type.toLowerCase(), name.trim()) : null
    const avatarHtml = extra?.imageUrl
      ? `<img class="entity-ref-avatar" src="${extra.imageUrl}" />`
      : extra?.iconHtml
        ? extra.iconHtml
        : extra
          ? `<span class="entity-ref-dot" style="background:${extra.color ?? '#888'}"></span>`
          : ''
    return `<span class="entity-ref entity-ref--${type.toLowerCase()}" data-entity-type="${type.toLowerCase()}" data-entity-name="${name.trim()}" title="${name.trim()}${tooltip}">${avatarHtml}${name.trim()}${metaLabel ? ` <em>${metaLabel}</em>` : ''}</span>`
  })
}

export function extractLinks(content: string): ParsedLink[] {
  return parseEntityRefs(content).map(ref => ({ type: ref.type, name: ref.name, metadata: ref.metadata }))
}
