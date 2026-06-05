export type EntityType = 'session' | 'note' | 'npc' | 'location' | 'faction' | 'quest' | 'event' | 'random-table' | 'rumor'

// Shape reference — used via EntityAttributes union
export interface NpcAttributes {
  portraitSource?: string
  portraitType?: 'file' | 'url'
  title?: string
  level?: string
  race?: string
  role?: string
  isAlive?: boolean
  isPlayerCharacter?: boolean
  status?: string
}

export interface MapPin {
  entityId: number
  x: number   // 0–1 fraction of image width
  y: number   // 0–1 fraction of image height
  hidden?: boolean  // DM-only: hide this pin from the player view
}

// Shape reference — used via EntityAttributes union
export interface LocationAttributes {
  imageSource?: string       // map image
  imageType?: 'file' | 'url'
  logoSource?: string        // banner/logo image
  logoType?: 'file' | 'url'
  locationType?: 'city' | 'dungeon' | 'wilderness' | 'building' | 'region' | 'other'
  status?: 'discovered' | 'undiscovered' | 'destroyed'
  mapPins?: MapPin[]
}

// Shape reference — used via EntityAttributes union
export interface FactionAttributes {
  imageSource?: string
  imageType?: 'file' | 'url'
  factionType?: 'criminal' | 'religious' | 'political' | 'mercenary' | 'arcane' | 'other'
  size?: 'small' | 'medium' | 'large' | 'massive'
  isSecret?: boolean
  headquartersName?: string
}

// Shape reference — used via EntityAttributes union
export interface QuestAttributes {
  status?: 'active' | 'completed' | 'failed' | 'dormant'
  questGiver?: string
  questGiverId?: number
  questGiverType?: 'npc' | 'faction'
  reward?: string
}

// Shape reference — used via EntityAttributes union
export interface EventAttributes {
  date?: string
  location?: string
  significance?: 'minor' | 'major' | 'critical'
}

// Shape reference — used via EntityAttributes union
export interface SessionAttributes {
  mode?: 'planning' | 'running' | 'finished'
  sessionNumber?: string
  date?: string
  scriptContent?: string   // the session script / prep
  notesContent?: string    // live notes taken during session
}

// Shape reference — used via EntityAttributes union
export interface NoteAttributes {
  icon?: string
  tags?: string[]
}

export interface RandomTableRow {
  min: number
  max: number
  result: string
}

// Shape reference — used via EntityAttributes union
export interface RandomTableAttributes {
  die?: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'
  rows?: RandomTableRow[]
  tags?: string[]
}

// Shape reference — used via EntityAttributes union
export interface RumorAttributes {
  statuses?: string[]
  source?: string
  tags?: string[]
}

export const RUMOR_STATUS_COLORS: Record<string, string> = {
  unheard:  'var(--text3)',
  heard:    '#6b9fe8',
  revealed: 'var(--success)',
  false:    'var(--danger)',
}

export const SESSION_MODE_COLORS: Record<string, string> = {
  planning: '#6b9fe8',
  running:  '#7cc44e',
  finished: '#b87de8',
}

export const QUEST_STATUS_COLORS: Record<string, string> = {
  active:    '#e8924a',
  completed: '#7cc44e',
  failed:    'var(--blood)',
  dormant:   'var(--ink-ghost)',
}

export const EVENT_SIGNIFICANCE_COLORS: Record<string, string> = {
  critical: 'var(--blood)',
  major:    'var(--gold)',
  minor:    'var(--ink-ghost)',
}

// Shape reference — used via EntityAttributes union
export interface PinnedLocation {
  locationEntityId: number
  locationName: string
  x: number
  y: number
}

export type EntityAttributes = NpcAttributes | LocationAttributes | FactionAttributes | NoteAttributes | QuestAttributes | EventAttributes | SessionAttributes | RandomTableAttributes | RumorAttributes

export const ENTITY_TYPE_ROUTE: Record<EntityType, string> = {
  session:        'sessions',
  note:           'notes',
  npc:            'npcs',
  location:       'locations',
  faction:        'factions',
  quest:          'quests',
  event:          'events',
  'random-table': 'random-tables',
  rumor:          'rumors',
}

export const ENTITY_TYPE_CONFIG: Record<EntityType, {
  label: string
  plural: string
  color: string
  defaultIcon: string
}> = {
  session:        { label: 'Session',      plural: 'Sessions',      color: '#b87de8', defaultIcon: 'gi-book-aura' },
  note:           { label: 'Note',         plural: 'Notes',         color: '#6b9fe8', defaultIcon: 'gi-scroll-unfurled' },
  npc:            { label: 'NPC',          plural: 'NPCs',          color: '#7cc44e', defaultIcon: 'gi-person' },
  location:       { label: 'Location',     plural: 'Locations',     color: '#a87de8', defaultIcon: 'gi-castle' },
  faction:        { label: 'Faction',      plural: 'Factions',      color: '#e05555', defaultIcon: 'gi-american-shield' },
  quest:          { label: 'Quest',        plural: 'Quests',        color: '#e8924a', defaultIcon: 'gi-holy-grail' },
  event:          { label: 'Event',        plural: 'Events',        color: '#4ab8e8', defaultIcon: 'gi-sands-of-time' },
  'random-table': { label: 'Random Table', plural: 'Random Tables', color: '#e8c44a', defaultIcon: 'gi-dice-six-faces-six' },
  rumor:          { label: 'Rumor',        plural: 'Rumors',        color: '#c86fa8', defaultIcon: 'gi-speaker' },
}

/** Pre-built list from ENTITY_TYPE_CONFIG + ENTITY_TYPE_ROUTE. Import this instead of re-deriving in each component. */
export const ENTITY_TYPE_LIST = (Object.keys(ENTITY_TYPE_CONFIG) as EntityType[]).map(key => ({
  key,
  label:   ENTITY_TYPE_CONFIG[key].plural,
  segment: ENTITY_TYPE_ROUTE[key],
  color:   ENTITY_TYPE_CONFIG[key].color,
  icon:    ENTITY_TYPE_CONFIG[key].defaultIcon,
}))

// Note icon picker — all verified to exist
export const NOTE_ICONS = [
  { name: 'gi-scroll-unfurled', label: 'Scroll' },
  { name: 'gi-book-aura',       label: 'Lore' },
  { name: 'gi-death-note',      label: 'Secret' },
  { name: 'gi-magic-hat',       label: 'Magic' },
  { name: 'gi-house-keys',      label: 'Key' },
  { name: 'gi-sands-of-time',   label: 'Timeline' },
  { name: 'gi-all-seeing-eye',  label: 'Mystery' },
  { name: 'gi-castle',          label: 'Location' },
  { name: 'gi-coins',           label: 'Treasure' },
  { name: 'gi-broadsword',      label: 'Combat' },
]

// ── System Builder Types ───────────────────────────────────────────────────

export type FieldComponentType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'toggle'
  | 'image'
  | 'tracker'
  | 'dice'
  | 'clock'
  | 'rating'
  | 'tags'
  | 'checklist'
  | 'statblock'
  | 'abilities'
  | 'spellslots'
  | 'conditions'
  | 'attack'
  | 'speed'
  | 'entity-link'
  // Generic structured fields
  | 'damage-formula'
  | 'trait-picker'
  | 'scaling'
  | 'currency'
  // PF2e-specific fields
  | 'proficiency'
  | 'action-cost'
  | 'attack-block'

export interface FieldSchema {
  key: string
  label: string
  component: FieldComponentType
  config: {
    placeholder?: string
    options?: string[]          // for select / multiselect
    min?: number
    max?: number
    step?: number
    unit?: string               // e.g. "ft", "gp"
    defaultMax?: number         // for tracker
    rows?: number               // for textarea
    defaultExpression?: string  // for dice, e.g. "2d6"
    segments?: number           // for clock (4,6,8,10)
    ratingMax?: number          // for rating
    ratingStyle?: 'dot' | 'diamond' | 'skull'  // for rating
    checklistItems?: string[]   // for checklist
    // statblock
    stats?: string[]            // stat names, e.g. ["STR","DEX","CON","INT","WIS","CHA"]
    statMin?: number
    statMax?: number
    showModifier?: boolean      // show D&D-style floor((val-10)/2) modifier
    // conditions
    conditions?: string[]       // condition names
    // speed
    speedModes?: string[]       // movement mode names
    speedUnit?: string          // unit suffix, default "ft"
    // spellslots / resource levels
    slotLevels?: number         // number of levels, default 9
    slotLevelNames?: string[]   // labels for each level
    // entity-link
    entityTypeId?: string       // which entity type this field links to
    // currency
    denominationOptions?: string[]  // e.g. ['cp','sp','gp','pp']
    // scaling
    scalingType?: 'level' | 'heighten' | 'both'
  }
  required: boolean
  showInCard: boolean           // show on summary card
  showInHeader: boolean         // show prominently at top of record
  sortable: boolean
}

export type SectionStyle = 'auto' | 'full' | 'two-col' | 'three-col'

export interface SectionDef {
  id: string
  title?: string
  style: SectionStyle
  fields: string[]              // ordered field keys
}

export const SECTION_STYLE_OPTIONS: { value: SectionStyle; label: string }[] = [
  { value: 'auto',      label: 'Auto' },
  { value: 'full',      label: 'Full' },
  { value: 'two-col',   label: '2 Col' },
  { value: 'three-col', label: '3 Col' },
]

export interface EntityTypeSchema {
  id: string                    // stable key, e.g. "spell"
  name: string
  plural: string
  icon: string                  // gi-* icon name
  color: string
  fields: FieldSchema[]
  sections?: SectionDef[]
}

export interface SystemSchema {
  id?: number
  name: string
  shortId: string               // "pf2e"
  description: string
  version: string
  entityTypes: EntityTypeSchema[]
  createdAt?: string
  updatedAt?: string
}

// Converts a camelCase/PascalCase label to a snake_case key
export function labelToKey(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, c => c.toLowerCase())
}

export const FIELD_COMPONENT_OPTIONS: { value: FieldComponentType; label: string; icon: string; section?: string }[] = [
  // ── Generic ──────────────────────────────────────────────────────────────
  { value: 'text',           label: 'Text',           icon: 'md-editnote' },
  { value: 'textarea',       label: 'Markdown',       icon: 'gi-book-aura' },
  { value: 'number',         label: 'Number',         icon: 'gi-coins' },
  { value: 'select',         label: 'Select',         icon: 'md-arrowdropdown' },
  { value: 'multiselect',    label: 'Tags (fixed)',   icon: 'gi-all-seeing-eye' },
  { value: 'toggle',         label: 'Toggle',         icon: 'gi-health-potion' },
  { value: 'image',          label: 'Image',          icon: 'gi-person' },
  { value: 'tracker',        label: 'Tracker',        icon: 'gi-sands-of-time' },
  { value: 'dice',           label: 'Dice Roll',      icon: 'gi-dice-six' },
  { value: 'clock',          label: 'Clock',          icon: 'gi-hourglass' },
  { value: 'rating',         label: 'Rating',         icon: 'gi-three-coins' },
  { value: 'tags',           label: 'Tags (free)',    icon: 'gi-labels' },
  { value: 'checklist',      label: 'Checklist',      icon: 'gi-check-mark' },
  { value: 'statblock',      label: 'Stat Block',     icon: 'gi-muscle-up' },
  { value: 'abilities',      label: 'Abilities',      icon: 'gi-lightning-bolt' },
  { value: 'spellslots',     label: 'Spell Slots',    icon: 'gi-sparkles' },
  { value: 'conditions',     label: 'Conditions',     icon: 'gi-poison' },
  { value: 'attack',         label: 'Attack',         icon: 'gi-crossed-swords' },
  { value: 'speed',          label: 'Speed',          icon: 'gi-boot-stomp' },
  { value: 'entity-link',    label: 'Entity Link',    icon: 'gi-linked-rings' },
  { value: 'damage-formula', label: 'Damage Formula', icon: 'gi-crossed-swords' },
  { value: 'trait-picker',   label: 'Trait Picker',   icon: 'gi-labels' },
  { value: 'scaling',        label: 'Level Scaling',  icon: 'gi-sands-of-time' },
  { value: 'currency',       label: 'Currency',       icon: 'gi-three-coins' },
  // ── PF2e ─────────────────────────────────────────────────────────────────
  { value: 'proficiency',    label: 'Proficiency',    icon: 'gi-muscle-up',      section: 'PF2e' },
  { value: 'action-cost',    label: 'Action Cost',    icon: 'gi-lightning-bolt', section: 'PF2e' },
  { value: 'attack-block',   label: 'Attack Block',   icon: 'gi-crossed-swords', section: 'PF2e' },
]
