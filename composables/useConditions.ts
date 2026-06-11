import type { TokenCondition } from '~/stores/encounter'

export interface ConditionCatalogEntry {
  icon: string     // oh-vue-icons gi-* name
  abbr: string
  color: string    // hex
  colorHex: number // 0x-prefixed number
  desc: string
}

export const CONDITION_CATALOG: Record<string, ConditionCatalogEntry> = {
  Poisoned:      { icon: 'gi-poison-bottle',  abbr: 'PSN', color: '#5fae54', colorHex: 0x5fae54, desc: 'Disadvantage on attack rolls and ability checks.' },
  Prone:         { icon: 'gi-falling',        abbr: 'PRN', color: '#b9824a', colorHex: 0xb9824a, desc: 'Crawling only; melee attackers have advantage.' },
  Restrained:    { icon: 'gi-spider-web',     abbr: 'RST', color: '#9aa7b8', colorHex: 0x9aa7b8, desc: 'Speed 0; attacks against have advantage.' },
  Frightened:    { icon: 'gi-terror',         abbr: 'FRT', color: '#a06ad4', colorHex: 0xa06ad4, desc: 'Disadvantage while source of fear is in sight.' },
  Stunned:       { icon: 'gi-knockout',       abbr: 'STN', color: '#d9c34a', colorHex: 0xd9c34a, desc: 'Incapacitated; can\'t move; fails STR/DEX saves.' },
  Blinded:       { icon: 'gi-sight-disabled', abbr: 'BLD', color: '#7d8a99', colorHex: 0x7d8a99, desc: 'Can\'t see; attack rolls have disadvantage.' },
  Burning:       { icon: 'gi-fire',           abbr: 'BRN', color: '#e07b39', colorHex: 0xe07b39, desc: 'Takes fire damage at the start of each turn.' },
  Concentrating: { icon: 'gi-brain',          abbr: 'CNC', color: '#4aa3c0', colorHex: 0x4aa3c0, desc: 'Maintaining a spell; broken on failed CON save.' },
  Blessed:       { icon: 'gi-angel-wings',    abbr: 'BLS', color: '#d4b54a', colorHex: 0xd4b54a, desc: '+1d4 to attack rolls and saving throws.' },
  Cursed:        { icon: 'gi-evil-moon',      abbr: 'CRS', color: '#8456a8', colorHex: 0x8456a8, desc: 'Bestow Curse: WIS saves at disadvantage.' },
  Slowed:        { icon: 'gi-snail',          abbr: 'SLW', color: '#6a89b5', colorHex: 0x6a89b5, desc: 'Speed halved; −2 AC and DEX saves.' },
  Invisible:     { icon: 'gi-invisible',      abbr: 'INV', color: '#88c5c5', colorHex: 0x88c5c5, desc: 'Can\'t be seen without special senses.' },
  Grappled:      { icon: 'gi-grab',           abbr: 'GRP', color: '#c08a5a', colorHex: 0xc08a5a, desc: 'Speed 0 while grappled.' },
  Exhaustion:    { icon: 'gi-tired-eye',      abbr: 'EXH', color: '#a35b5b', colorHex: 0xa35b5b, desc: 'Cumulative penalties per level.' },
}

const FALLBACK_COLORS = [
  '#7a8fa6', '#9a7ab5', '#7ab58a', '#b5a07a',
  '#7ab5b5', '#b57a7a', '#8a7ab5', '#b5b57a',
]
let _fallbackIdx = 0

export function getConditionColor(name: string): string {
  return CONDITION_CATALOG[name]?.color ?? FALLBACK_COLORS[Math.abs(hashStr(name)) % FALLBACK_COLORS.length]
}

export function getConditionColorHex(name: string): number {
  return hexColorToNumber(getConditionColor(name))
}

export function hexColorToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

export function visibleConditions(conditions: TokenCondition[], isDM: boolean): TokenCondition[] {
  return isDM ? conditions : conditions.filter(c => !c.hidden)
}

export type HealthState = 'healthy' | 'bloodied' | 'critical' | 'dead'

export function healthState(token: { isDead?: boolean; hpCurrent: number | null; hpMax: number | null }): HealthState {
  if (token.isDead || (token.hpCurrent ?? 0) <= 0) return 'dead'
  const f = (token.hpCurrent ?? 0) / (token.hpMax ?? 1)
  if (f <= 0.25) return 'critical'
  if (f <= 0.5) return 'bloodied'
  return 'healthy'
}

export function hpColor(f: number): string {
  if (f <= 0.25) return '#d04a4a'
  if (f <= 0.5) return '#c9973a'
  return '#1a9a80'
}

export function hpColorHex(f: number): number {
  if (f <= 0.25) return 0xd04a4a
  if (f <= 0.5) return 0xc9973a
  return 0x1a9a80
}

export const HEALTH_STATE_COLORS: Record<HealthState, string> = {
  healthy:  '#1a9a80',
  bloodied: '#c9973a',
  critical: '#d04a4a',
  dead:     '#777788',
}

export const HEALTH_STATE_LABELS: Record<HealthState, string> = {
  healthy:  'Healthy',
  bloodied: 'Bloodied',
  critical: 'Critical',
  dead:     'Dead',
}
