export type EntityType = 'note' | 'npc' | 'item' | 'location' | 'faction' | 'quest' | 'event' | 'session'

export interface NpcAttributes {
  portraitSource?: string
  portraitType?: 'file' | 'url'
  title?: string
  level?: string
  race?: string
  role?: string
  isAlive?: boolean
  status?: string
}

export interface MapPin {
  entityId: number
  x: number   // 0–1 fraction of image width
  y: number   // 0–1 fraction of image height
}

export interface LocationAttributes {
  imageSource?: string       // map image
  imageType?: 'file' | 'url'
  logoSource?: string        // banner/logo image
  logoType?: 'file' | 'url'
  locationType?: 'city' | 'dungeon' | 'wilderness' | 'building' | 'region' | 'other'
  status?: 'discovered' | 'undiscovered' | 'destroyed'
  mapPins?: MapPin[]
}

export interface ItemAttributes {
  imageSource?: string
  imageType?: 'file' | 'url'
  itemType?: 'weapon' | 'armor' | 'consumable' | 'treasure' | 'misc'
  rarity?: 'common' | 'uncommon' | 'rare' | 'unique'
  isMagic?: boolean
  isCursed?: boolean
  value?: string
}

export interface FactionAttributes {
  imageSource?: string
  imageType?: 'file' | 'url'
  factionType?: 'criminal' | 'religious' | 'political' | 'mercenary' | 'arcane' | 'other'
  size?: 'small' | 'medium' | 'large' | 'massive'
  isSecret?: boolean
  headquartersName?: string
}

export interface QuestAttributes {
  status?: 'active' | 'completed' | 'failed' | 'dormant'
  questGiver?: string
  reward?: string
}

export interface EventAttributes {
  date?: string
  location?: string
  significance?: 'minor' | 'major' | 'critical'
}

export interface SessionAttributes {
  mode?: 'planning' | 'running' | 'finished'
  sessionNumber?: string
  date?: string
  scriptContent?: string   // the session script / prep
  notesContent?: string    // live notes taken during session
}

export interface NoteAttributes {
  icon?: string
  tags?: string[]
}

export interface PinnedLocation {
  locationEntityId: number
  locationName: string
  x: number
  y: number
}

export type EntityAttributes = NpcAttributes | LocationAttributes | ItemAttributes | FactionAttributes | NoteAttributes | QuestAttributes | EventAttributes | SessionAttributes

export const ENTITY_TYPE_CONFIG: Record<EntityType, {
  label: string
  plural: string
  color: string
  defaultIcon: string
}> = {
  note:     { label: 'Note',     plural: 'Notes',     color: '#6b9fe8', defaultIcon: 'gi-scroll-unfurled' },
  npc:      { label: 'NPC',      plural: 'NPCs',      color: '#7cc44e', defaultIcon: 'gi-person' },
  item:     { label: 'Item',     plural: 'Items',     color: '#ebbd34', defaultIcon: 'gi-open-treasure-chest' },
  location: { label: 'Location', plural: 'Locations', color: '#a87de8', defaultIcon: 'gi-castle' },
  faction:  { label: 'Faction',  plural: 'Factions',  color: '#e05555', defaultIcon: 'gi-american-shield' },
  quest:    { label: 'Quest',    plural: 'Quests',    color: '#e8924a', defaultIcon: 'gi-holy-grail' },
  event:    { label: 'Event',    plural: 'Events',    color: '#4ab8e8', defaultIcon: 'gi-sands-of-time' },
  session:  { label: 'Session',  plural: 'Sessions',  color: '#b87de8', defaultIcon: 'gi-book-aura' },
}

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
