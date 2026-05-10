import { getDb } from '~/composables/useDb'
import { useNotesStore } from '~/stores/notes'
import { useSystemsStore } from '~/stores/systems'
import type { EntityTypeSchema } from '~/types/entities'

export interface CmdContext {
  campaign: { id: number; name: string } | null
  system:   { id: number; name: string } | null
}

export type CmdItem =
  | { kind: 'cmd';     id: string; icon: string; label: string; hint: string; canExecute: boolean; warning?: string; execute?: () => Promise<void> | void }
  | { kind: 'section'; label: string }
  | { kind: 'pick';    id: string; icon: string; label: string; hint: string; execute: () => void; fill?: string }

// ── Constants ────────────────────────────────────────────────────────────────

interface GotoTarget {
  aliases: string[]
  label: string
  segment: string       // campaign-relative path ('npcs', 'graphs', '' for dashboard)
  absolute?: string     // absolute path when not campaign-scoped ('/settings')
  needsCampaign: boolean
}

const GOTO_TARGETS: GotoTarget[] = [
  { aliases: ['npcs', 'npc', 'characters', 'character'],          label: 'NPCs',        segment: 'npcs',       needsCampaign: true  },
  { aliases: ['locations', 'location', 'places', 'place'],        label: 'Locations',   segment: 'locations',  needsCampaign: true  },
  { aliases: ['factions', 'faction', 'guilds', 'guild'],          label: 'Factions',    segment: 'factions',   needsCampaign: true  },
  { aliases: ['quests', 'quest', 'missions', 'mission'],          label: 'Quests',      segment: 'quests',     needsCampaign: true  },
  { aliases: ['events', 'event'],                                  label: 'Events',      segment: 'events',     needsCampaign: true  },
  { aliases: ['sessions', 'session'],                              label: 'Sessions',    segment: 'sessions',   needsCampaign: true  },
  { aliases: ['notes', 'note'],                                    label: 'Notes',       segment: 'notes',      needsCampaign: true  },
  { aliases: ['encounters', 'encounter', 'battle', 'combat'],     label: 'Encounters',  segment: 'encounters', needsCampaign: true  },
  { aliases: ['graphs', 'graph'],                                  label: 'Graphs',      segment: 'graphs',     needsCampaign: true  },
  { aliases: ['chronicle', 'timeline', 'history'],                label: 'Chronicle',   segment: 'chronicle',  needsCampaign: true  },
  { aliases: ['dashboard', 'home', 'overview', 'index'],          label: 'Dashboard',   segment: '',           needsCampaign: true  },
  { aliases: ['settings', 'preferences', 'config'],               label: 'Settings',    segment: 'settings',   absolute: '/settings', needsCampaign: false },
]

interface EntityTypeCmd {
  aliases: string[]
  type: string
  label: string
  plural: string
  segment: string
}

const ENTITY_TYPES_CMD: EntityTypeCmd[] = [
  { aliases: ['npc', 'npcs', 'character', 'characters'],   type: 'npc',      label: 'NPC',      plural: 'NPCs',      segment: 'npcs' },
  { aliases: ['location', 'locations', 'place', 'places'], type: 'location', label: 'Location', plural: 'Locations', segment: 'locations' },
  { aliases: ['faction', 'factions'],                       type: 'faction',  label: 'Faction',  plural: 'Factions',  segment: 'factions' },
  { aliases: ['quest', 'quests'],                           type: 'quest',    label: 'Quest',    plural: 'Quests',    segment: 'quests' },
  { aliases: ['event', 'events'],                           type: 'event',    label: 'Event',    plural: 'Events',    segment: 'events' },
  { aliases: ['session', 'sessions'],                       type: 'session',  label: 'Session',  plural: 'Sessions',  segment: 'sessions' },
  { aliases: ['note', 'notes'],                             type: 'note',     label: 'Note',     plural: 'Notes',     segment: 'notes' },
]

const COMMAND_VERBS = [
  'goto', 'go', 'navigate', 'nav',
  'add', 'create', 'new',
  'find', 'search', 'open', 'show',
  'set', 'use',
  'unset', 'clear',
  'theme',
  'roll', 'dice',
]

// ── Singleton context ────────────────────────────────────────────────────────

const _ctx = ref<CmdContext>({ campaign: null, system: null })

if (import.meta.client) {
  try {
    const s = localStorage.getItem('dmstome-cmd-ctx')
    if (s) Object.assign(_ctx.value, JSON.parse(s))
  } catch {}
}

function _saveCtx() {
  if (import.meta.client) localStorage.setItem('dmstome-cmd-ctx', JSON.stringify(_ctx.value))
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fuzzyScore(alias: string, query: string): number {
  if (alias === query) return 3
  if (alias.startsWith(query)) return 2
  if (alias.includes(query)) return 1
  return 0
}

function matchGotoTarget(word: string): GotoTarget | null {
  let best: GotoTarget | null = null
  let bestScore = 0
  for (const t of GOTO_TARGETS) {
    for (const a of t.aliases) {
      const s = fuzzyScore(a, word)
      if (s > bestScore) { bestScore = s; best = t }
    }
  }
  return bestScore > 0 ? best : null
}

function matchEntityType(word: string): EntityTypeCmd | null {
  let best: EntityTypeCmd | null = null
  let bestScore = 0
  for (const t of ENTITY_TYPES_CMD) {
    for (const a of t.aliases) {
      const s = fuzzyScore(a, word)
      if (s > bestScore) { bestScore = s; best = t }
    }
  }
  return bestScore > 0 ? best : null
}

function matchSystemEntityType(word: string, sysEts: EntityTypeSchema[]): EntityTypeSchema | null {
  if (!word || !sysEts.length) return null
  const lw = word.toLowerCase()
  return (
    sysEts.find(et => et.id === lw || et.name.toLowerCase() === lw || et.plural.toLowerCase() === lw) ??
    sysEts.find(et => et.id.startsWith(lw) || et.name.toLowerCase().startsWith(lw) || et.plural.toLowerCase().startsWith(lw)) ??
    null
  )
}

// ── Suggestion builders ──────────────────────────────────────────────────────

function gotoSuggestions(
  target: GotoTarget,
  ctx: CmdContext,
  campaigns: { id: number; name: string }[],
  router: any,
  close: () => void,
): CmdItem[] {
  const items: CmdItem[] = []

  if (target.absolute) {
    items.push({
      kind: 'cmd', id: `goto-${target.segment}`,
      icon: '→', label: `goto ${target.label.toLowerCase()}`,
      hint: target.label,
      canExecute: true,
      execute: () => { router.push(target.absolute!); close() },
    })
    return items
  }

  if (!ctx.campaign) {
    items.push({
      kind: 'cmd', id: `goto-${target.segment}-nocampaign`,
      icon: '→', label: `goto ${target.label.toLowerCase()}`,
      hint: target.label,
      canExecute: false,
      warning: 'select a campaign',
    })
    if (campaigns.length) {
      items.push({ kind: 'section', label: 'Select campaign' })
      for (const c of campaigns) {
        items.push({
          kind: 'pick', id: `pick-camp-${c.id}`,
          icon: '📋', label: c.name,
          hint: `Set context & go to ${target.label}`,
          execute: () => {
            _ctx.value.campaign = c; _saveCtx()
            router.push(`/campaign/${c.id}/${target.segment}`); close()
          },
        })
      }
    }
  } else {
    const path = `/campaign/${ctx.campaign.id}/${target.segment}`
    items.push({
      kind: 'cmd', id: `goto-${target.segment}`,
      icon: '→', label: `goto ${target.label.toLowerCase()}`,
      hint: `${target.label} · ${ctx.campaign.name}`,
      canExecute: true,
      execute: () => { router.push(path); close() },
    })
  }
  return items
}

async function addSuggestions(
  typeWord: string,
  nameRest: string,
  ctx: CmdContext,
  campaigns: { id: number; name: string }[],
  sysEts: EntityTypeSchema[],
  router: any,
  close: () => void,
): Promise<CmdItem[]> {
  const items: CmdItem[] = []
  const db = getDb()
  const now = new Date().toISOString()

  // Special: add encounter or graph
  if (['encounter', 'encounters', 'battle'].includes(typeWord) || ['graph', 'graphs'].includes(typeWord)) {
    const isEnc = ['encounter', 'encounters', 'battle'].includes(typeWord)
    const label = isEnc ? 'encounter' : 'graph'
    const name = nameRest.trim() || (isEnc ? 'New Encounter' : 'New Graph')

    if (!ctx.campaign) {
      items.push({ kind: 'cmd', id: `add-${label}-nocamp`, icon: '＋', label: `add ${label} "${name}"`, hint: `Create ${label}`, canExecute: false, warning: 'select a campaign' })
      if (campaigns.length) {
        items.push({ kind: 'section', label: 'Select campaign' })
        for (const c of campaigns) {
          items.push({ kind: 'pick', id: `pick-addenc-${c.id}`, icon: '📋', label: c.name, hint: `Set context & create ${label}`, execute: () => { _ctx.value.campaign = c; _saveCtx(); executeAdd(); } })
        }
      }
      async function executeAdd() {
        if (!_ctx.value.campaign) return
        if (isEnc) {
          const id = await db.encounters.add({ campaign_id: _ctx.value.campaign.id, name, grid_size: 60, grid_offset_x: 0, grid_offset_y: 0, fog_enabled: false, fog_data: '{}', map_source: null, map_type: null, combat_log: '[]', tokens_json: '[]', created_at: now } as any)
          router.push(`/encounter/${id}`); close()
        } else {
          const { dbApi } = await import('~/composables/useDb')
          const id = await dbApi.graphLayout.create(_ctx.value.campaign.id, name)
          router.push(`/campaign/${_ctx.value.campaign.id}/graphs?graph=${id}`); close()
        }
      }
      return items
    }

    items.push({
      kind: 'cmd', id: `add-${label}`, icon: '＋',
      label: `add ${label} "${name}"`, hint: `Create in ${ctx.campaign.name}`,
      canExecute: !!nameRest.trim(),
      warning: nameRest.trim() ? undefined : 'type a name',
      execute: async () => {
        if (!ctx.campaign) return
        if (isEnc) {
          const id = await db.encounters.add({ campaign_id: ctx.campaign.id, name, grid_size: 60, grid_offset_x: 0, grid_offset_y: 0, fog_enabled: false, fog_data: '{}', map_source: null, map_type: null, combat_log: '[]', tokens_json: '[]', created_at: now } as any)
          router.push(`/encounter/${id}`); close()
        } else {
          const { dbApi } = await import('~/composables/useDb')
          const id = await dbApi.graphLayout.create(ctx.campaign.id, name)
          router.push(`/campaign/${ctx.campaign.id}/graphs?graph=${id}`); close()
        }
      },
    })
    return items
  }

  const eType = matchEntityType(typeWord)
  const sysEt = !eType ? matchSystemEntityType(typeWord, sysEts) : null

  if (!typeWord || (!eType && !sysEt)) {
    // Show campaign entity types as picks
    for (const t of ENTITY_TYPES_CMD) {
      items.push({ kind: 'pick', id: `add-type-${t.type}`, icon: '＋', label: `add ${t.label.toLowerCase()} …`, hint: `Create a ${t.label}`, execute: () => {}, fill: `> add ${t.label.toLowerCase()} ` })
    }
    // Show system entity types as picks when system context is set
    if (ctx.system && sysEts.length) {
      items.push({ kind: 'section', label: `${ctx.system.name} types` })
      for (const et of sysEts) {
        items.push({ kind: 'pick', id: `add-sys-type-${et.id}`, icon: '＋', label: `add ${et.name.toLowerCase()} …`, hint: `Create a ${et.name}`, execute: () => {}, fill: `> add ${et.id} ` })
      }
    }
    return items
  }

  // ── System entity type ────────────────────────────────────────────────────
  if (sysEt) {
    const name = nameRest.trim()
    if (!ctx.system) {
      items.push({ kind: 'cmd', id: `add-sys-${sysEt.id}-nosys`, icon: '＋', label: `add ${sysEt.name.toLowerCase()} "${name || '…'}"`, hint: `Create ${sysEt.name}`, canExecute: false, warning: 'set a system context' })
      return items
    }
    items.push({
      kind: 'cmd', id: `add-sys-${sysEt.id}`, icon: '＋',
      label: `add ${sysEt.name.toLowerCase()} "${name || '…'}"`,
      hint: `Create ${sysEt.name} in ${ctx.system.name}`,
      canExecute: !!name,
      warning: name ? undefined : 'type a name',
      execute: async () => {
        if (!ctx.system || !name) return
        const { dbApi } = await import('~/composables/useDb')
        const rec = await dbApi.records.create({ systemId: ctx.system.id, entityTypeId: sysEt.id, name })
        if (rec) router.push(`/system/${ctx.system.id}/${sysEt.id}?record=${encodeURIComponent(name)}`)
        close()
      },
    })
    return items
  }

  // ── Campaign entity type ──────────────────────────────────────────────────
  const name = nameRest.trim()
  if (!ctx.campaign) {
    items.push({ kind: 'cmd', id: `add-${eType!.type}-nocamp`, icon: '＋', label: `add ${eType!.label.toLowerCase()} "${name || '…'}"`, hint: `Create ${eType!.label}`, canExecute: false, warning: 'select a campaign' })
    if (campaigns.length) {
      items.push({ kind: 'section', label: 'Select campaign' })
      for (const c of campaigns) {
        items.push({
          kind: 'pick', id: `pick-add-${c.id}`, icon: '📋', label: c.name,
          hint: `Set context & create ${eType!.label}`,
          execute: () => { _ctx.value.campaign = c; _saveCtx() },
        })
      }
    }
    return items
  }

  items.push({
    kind: 'cmd', id: `add-${eType!.type}`, icon: '＋',
    label: `add ${eType!.label.toLowerCase()} "${name || '…'}"`,
    hint: `Create ${eType!.label} in ${ctx.campaign.name}`,
    canExecute: !!name,
    warning: name ? undefined : 'type a name',
    execute: async () => {
      if (!ctx.campaign || !name) return
      const notesStore = useNotesStore()
      const entity = await notesStore.createEntity(ctx.campaign.id, eType!.type as any, name)
      if (entity) router.push(`/campaign/${ctx.campaign.id}/${eType!.segment}/${entity.id}`)
      close()
    },
  })
  return items
}

async function findSuggestions(
  typeWord: string,
  nameRest: string,
  ctx: CmdContext,
  campaigns: { id: number; name: string }[],
  systems: { id: number; name: string }[],
  sysEts: EntityTypeSchema[],
  router: any,
  close: () => void,
): Promise<CmdItem[]> {
  const items: CmdItem[] = []
  const { dbApi } = await import('~/composables/useDb')

  const eType = matchEntityType(typeWord)
  const sysEt = !eType ? matchSystemEntityType(typeWord, sysEts) : null

  // ── Campaign entity search ────────────────────────────────────────────────
  if (eType) {
    if (!ctx.campaign) {
      items.push({ kind: 'cmd', id: 'find-nocamp', icon: '⌕', label: `find ${eType.label.toLowerCase()} "${nameRest || '…'}"`, hint: `Search ${eType.plural}`, canExecute: false, warning: 'select a campaign' })
      if (campaigns.length) {
        items.push({ kind: 'section', label: 'Select campaign' })
        for (const c of campaigns) {
          items.push({ kind: 'pick', id: `pick-find-${c.id}`, icon: '📋', label: c.name, hint: 'Set context & search', execute: () => { _ctx.value.campaign = c; _saveCtx() } })
        }
      }
      return items
    }
    if (!nameRest.trim()) {
      items.push({ kind: 'cmd', id: 'find-noname', icon: '⌕', label: `find ${eType.label.toLowerCase()} …`, hint: `Search ${eType.plural} in ${ctx.campaign.name}`, canExecute: false, warning: 'type a name' })
      return items
    }
    const rows = await dbApi.entities.search(nameRest.toLowerCase(), 8)
    const matches = rows.filter((r: any) => r.type === eType.type)
    if (!matches.length) {
      items.push({ kind: 'cmd', id: 'find-none', icon: '⌕', label: `No ${eType.plural} matching "${nameRest}"`, hint: '', canExecute: false })
    }
    for (const r of matches) {
      items.push({
        kind: 'pick', id: `find-ent-${r.id}`, icon: '⌕',
        label: r.name,
        hint: `${eType.label} · ${ctx.campaign.name}`,
        execute: () => { router.push(`/campaign/${r.campaign_id}/${eType.segment}/${r.id}`); close() },
      })
    }
    return items
  }

  // ── System entity type search ─────────────────────────────────────────────
  if (sysEt) {
    if (!ctx.system) {
      items.push({ kind: 'cmd', id: 'find-sys-nosys', icon: '⌕', label: `find ${sysEt.name.toLowerCase()} "${nameRest || '…'}"`, hint: `Search ${sysEt.plural}`, canExecute: false, warning: 'set a system context' })
      return items
    }
    if (!nameRest.trim()) {
      items.push({ kind: 'cmd', id: 'find-sys-noname', icon: '⌕', label: `find ${sysEt.name.toLowerCase()} …`, hint: `Search ${sysEt.plural} in ${ctx.system.name}`, canExecute: false, warning: 'type a name' })
      return items
    }
    const recRows = await dbApi.records.search(nameRest.toLowerCase(), 8)
    const matches = recRows.filter((r: any) => r.systemId === ctx.system!.id && r.entityTypeId === sysEt.id)
    if (!matches.length) {
      items.push({ kind: 'cmd', id: 'find-sys-none', icon: '⌕', label: `No ${sysEt.plural} matching "${nameRest}"`, hint: '', canExecute: false })
    }
    for (const r of matches) {
      items.push({
        kind: 'pick', id: `find-sys-rec-${r.id}`, icon: '⌕',
        label: r.name,
        hint: `${sysEt.name} · ${ctx.system!.name}`,
        execute: () => { router.push(`/system/${r.systemId}/${r.entityTypeId}?record=${encodeURIComponent(r.name)}`); close() },
      })
    }
    return items
  }

  // ── Fallback: broad record search across all systems ──────────────────────
  if (!nameRest.trim()) {
    items.push({ kind: 'cmd', id: 'find-rec-noname', icon: '⌕', label: `find ${typeWord} …`, hint: 'Search system library', canExecute: false, warning: 'type a name' })
    return items
  }
  const recRows = await dbApi.records.search(nameRest.toLowerCase(), 8)
  if (!recRows.length) {
    items.push({ kind: 'cmd', id: 'find-rec-none', icon: '⌕', label: `No records matching "${nameRest}"`, hint: '', canExecute: false })
  }
  for (const r of recRows) {
    items.push({
      kind: 'pick', id: `find-rec-${r.id}`, icon: '⌕',
      label: r.name,
      hint: `${r.entityTypeId} · System ${r.systemId}`,
      execute: () => { router.push(`/system/${r.systemId}/${r.entityTypeId}?record=${encodeURIComponent(r.name)}`); close() },
    })
  }
  return items
}

function setSuggestions(
  nameRest: string,
  campaigns: { id: number; name: string }[],
  systems: { id: number; name: string }[],
  close: () => void,
): CmdItem[] {
  const items: CmdItem[] = []
  const q = nameRest.toLowerCase().trim()

  const matchedCamps = q ? campaigns.filter(c => c.name.toLowerCase().includes(q)) : campaigns
  const matchedSystems = q ? systems.filter(s => s.name.toLowerCase().includes(q)) : systems

  if (matchedCamps.length) {
    items.push({ kind: 'section', label: 'Set Campaign Context' })
    for (const c of matchedCamps) {
      const active = _ctx.value.campaign?.id === c.id
      items.push({
        kind: 'pick', id: `set-camp-${c.id}`, icon: active ? '✓' : '📋',
        label: c.name, hint: active ? 'Active campaign' : 'Set as campaign context',
        execute: () => { _ctx.value.campaign = { id: c.id, name: c.name }; _saveCtx() },
      })
    }
  }
  if (matchedSystems.length) {
    items.push({ kind: 'section', label: 'Set System Context' })
    for (const s of matchedSystems) {
      const active = _ctx.value.system?.id === s.id
      items.push({
        kind: 'pick', id: `set-sys-${s.id}`, icon: active ? '✓' : '⚙',
        label: s.name, hint: active ? 'Active system' : 'Set as system context',
        execute: () => { _ctx.value.system = { id: s.id, name: s.name }; _saveCtx() },
      })
    }
  }
  if (!matchedCamps.length && !matchedSystems.length) {
    items.push({ kind: 'cmd', id: 'set-none', icon: '⚠', label: `No match for "${nameRest}"`, hint: '', canExecute: false })
  }
  return items
}

function unsetSuggestions(rest: string): CmdItem[] {
  const items: CmdItem[] = []
  const r = rest.trim().toLowerCase()
  const hasCamp = !!_ctx.value.campaign
  const hasSys = !!_ctx.value.system

  if (!hasCamp && !hasSys) {
    items.push({ kind: 'cmd', id: 'unset-none', icon: '✕', label: 'No context set', hint: '', canExecute: false })
    return items
  }
  if ((!r || r.includes('campaign') || r.includes('camp')) && hasCamp) {
    items.push({ kind: 'pick', id: 'unset-camp', icon: '✕', label: `Unset campaign (${_ctx.value.campaign!.name})`, hint: 'Remove campaign context', execute: () => { _ctx.value.campaign = null; _saveCtx() } })
  }
  if ((!r || r.includes('system') || r.includes('sys')) && hasSys) {
    items.push({ kind: 'pick', id: 'unset-sys', icon: '✕', label: `Unset system (${_ctx.value.system!.name})`, hint: 'Remove system context', execute: () => { _ctx.value.system = null; _saveCtx() } })
  }
  if ((hasCamp || hasSys) && !r) {
    items.push({ kind: 'pick', id: 'unset-all', icon: '✕', label: 'Unset all context', hint: 'Clear everything', execute: () => { _ctx.value.campaign = null; _ctx.value.system = null; _saveCtx() } })
  }
  return items
}

function themeSuggestions(rest: string, updateSettings: (k: string, v: any) => void, close: () => void): CmdItem[] {
  const THEMES = ['dark', 'void', 'forest', 'light', 'parchment']
  const q = rest.trim().toLowerCase()
  const matched = q ? THEMES.filter(t => t.startsWith(q)) : THEMES
  return matched.map(t => ({
    kind: 'pick' as const, id: `theme-${t}`, icon: '◐', label: t, hint: `Switch to ${t} theme`,
    execute: () => { updateSettings('theme', t) },
  }))
}

function defaultSuggestions(partialVerb?: string): CmdItem[] {
  const hints = [
    { icon: '→', label: 'goto [section]',      hint: 'Navigate to a section — npcs, graphs, settings…' },
    { icon: '＋', label: 'add [type] [name]',   hint: 'Create a new entity — npc, location, quest…' },
    { icon: '⌕', label: 'find [type] [name]',  hint: 'Find and open an existing entity or record' },
    { icon: '◎', label: 'set [name]',           hint: 'Set campaign or system context' },
    { icon: '✕', label: 'unset',                hint: 'Clear current context' },
    { icon: '◐', label: 'theme [name]',         hint: 'Switch color theme — dark, void, forest, light, parchment' },
  ]
  const filtered = partialVerb
    ? hints.filter(h => h.label.startsWith(partialVerb) || h.label.includes(partialVerb))
    : hints
  return filtered.map((h, i) => ({
    kind: 'cmd' as const, id: `hint-${i}`, icon: h.icon, label: h.label, hint: h.hint, canExecute: false,
  }))
}

// ── Exported composable ──────────────────────────────────────────────────────

export function useCommandPalette() {
  const ctx = _ctx

  function setCtx(type: 'campaign' | 'system', item: { id: number; name: string }) {
    ctx.value[type] = item
    _saveCtx()
  }

  function clearCtx(type?: 'campaign' | 'system') {
    if (type) ctx.value[type] = null
    else { ctx.value.campaign = null; ctx.value.system = null }
    _saveCtx()
  }

  function isCommandMode(query: string): boolean {
    const q = query.trim()
    if (!q) return false
    if (q.startsWith('>')) return true
    const first = q.split(/\s+/)[0].toLowerCase()
    return COMMAND_VERBS.includes(first)
  }

  function rawCommandQuery(query: string): string {
    const q = query.trim()
    return q.startsWith('>') ? q.slice(1).trimStart() : q
  }

  async function getSuggestions(
    rawQuery: string,
    opts: {
      campaigns: { id: number; name: string }[]
      systems:   { id: number; name: string }[]
      router: any
      updateSettings: (k: string, v: any) => void
      close: () => void
    },
  ): Promise<CmdItem[]> {
    const q = rawCommandQuery(rawQuery).toLowerCase().trim()
    const { campaigns, systems, router, updateSettings, close } = opts

    // Resolve system entity types from active context
    const systemsStore = useSystemsStore()
    const sysEts: EntityTypeSchema[] = ctx.value.system
      ? (systemsStore.getSystem(ctx.value.system.id)?.entityTypes ?? [])
      : []

    if (!q) return defaultSuggestions()

    const [verbWord, ...rest] = q.split(/\s+/)
    const restStr = rest.join(' ')
    const [typeWord, ...nameRest] = rest
    const nameStr = nameRest.join(' ')

    // Goto
    if (['goto', 'go', 'navigate', 'nav'].includes(verbWord)) {
      if (!typeWord) {
        const items: CmdItem[] = []
        for (const t of GOTO_TARGETS) {
          items.push(...gotoSuggestions(t, ctx.value, campaigns, router, close))
        }
        if (ctx.value.system && sysEts.length) {
          items.push({ kind: 'section', label: `${ctx.value.system.name} types` })
          for (const et of sysEts) {
            items.push({
              kind: 'cmd', id: `goto-sys-${et.id}`, icon: '→',
              label: `goto ${et.plural.toLowerCase()}`,
              hint: `${et.plural} · ${ctx.value.system.name}`,
              canExecute: true,
              execute: () => { router.push(`/system/${ctx.value.system!.id}/${et.id}`); close() },
            })
          }
        }
        return items
      }
      const target = matchGotoTarget(typeWord)
      if (target) return gotoSuggestions(target, ctx.value, campaigns, router, close)
      // Try system entity type
      const sysEt = matchSystemEntityType(typeWord, sysEts)
      if (sysEt && ctx.value.system) {
        return [{
          kind: 'cmd', id: `goto-sys-${sysEt.id}`, icon: '→',
          label: `goto ${sysEt.plural.toLowerCase()}`,
          hint: `${sysEt.plural} · ${ctx.value.system.name}`,
          canExecute: true,
          execute: () => { router.push(`/system/${ctx.value.system!.id}/${sysEt.id}`); close() },
        }]
      }
      if (sysEt && !ctx.value.system) {
        return [{ kind: 'cmd', id: 'goto-sys-nosys', icon: '→', label: `goto ${sysEt.plural.toLowerCase()}`, hint: `${sysEt.plural}`, canExecute: false, warning: 'set a system context' }]
      }
      return [{ kind: 'cmd', id: 'goto-unk', icon: '→', label: `goto ${typeWord}`, hint: `Unknown section "${typeWord}"`, canExecute: false }]
    }

    // Open — ambiguous: try goto first, then find
    if (verbWord === 'open') {
      if (typeWord) {
        const gotoTarget = matchGotoTarget(typeWord)
        if (gotoTarget) return gotoSuggestions(gotoTarget, ctx.value, campaigns, router, close)
        const sysEt = matchSystemEntityType(typeWord, sysEts)
        if (sysEt && ctx.value.system) {
          return [{
            kind: 'cmd', id: `goto-sys-${sysEt.id}`, icon: '→',
            label: `goto ${sysEt.plural.toLowerCase()}`,
            hint: `${sysEt.plural} · ${ctx.value.system.name}`,
            canExecute: true,
            execute: () => { router.push(`/system/${ctx.value.system!.id}/${sysEt.id}`); close() },
          }]
        }
        const eType = matchEntityType(typeWord)
        if (eType) return findSuggestions(typeWord, nameStr, ctx.value, campaigns, systems, sysEts, router, close)
      }
      return defaultSuggestions('o')
    }

    // Add / Create
    if (['add', 'create', 'new'].includes(verbWord)) {
      return addSuggestions(typeWord ?? '', nameStr, ctx.value, campaigns, sysEts, router, close)
    }

    // Find / Search / Show
    if (['find', 'search', 'show'].includes(verbWord)) {
      return findSuggestions(typeWord ?? '', nameStr, ctx.value, campaigns, systems, sysEts, router, close)
    }

    // Set
    if (['set', 'use'].includes(verbWord)) {
      return setSuggestions(restStr, campaigns, systems, close)
    }

    // Unset
    if (['unset', 'clear'].includes(verbWord)) {
      return unsetSuggestions(restStr)
    }

    // Theme
    if (verbWord === 'theme') {
      return themeSuggestions(restStr, updateSettings, close)
    }

    // No match — show hints filtered by what they're typing
    return defaultSuggestions(verbWord)
  }

  return { ctx, setCtx, clearCtx, isCommandMode, rawCommandQuery, getSuggestions }
}
