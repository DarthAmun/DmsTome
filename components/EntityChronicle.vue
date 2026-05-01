<template>
  <div class="chronicle screen-in">

    <!-- ── Left panel: entity list ── -->
    <div class="elist">

      <div class="elist-head">
        <div class="elist-head-title" :style="{ color: typeConfig?.color }">
          {{ typeConfig?.plural }}
        </div>
        <button class="btn-accent-sm" @click="createEntry">+ New</button>
      </div>

      <div class="elist-search">
        <span class="elist-search-icon">⌕</span>
        <input
          v-model="search"
          class="elist-search-input"
          :placeholder="`Search ${typeConfig?.plural?.toLowerCase() ?? ''}…`"
        />
      </div>

      <!-- View toggle (events + sessions) -->
      <div v-if="hasViewToggle" class="elist-view-toggle">
        <button class="elist-vbtn" :class="{ active: viewMode === 'list' }" @click="setView('list')">List</button>
        <button v-if="type === 'event'" class="elist-vbtn" :class="{ active: viewMode === 'timeline' }" @click="setView('timeline')">Timeline</button>
        <button v-if="type === 'session'" class="elist-vbtn" :class="{ active: viewMode === 'log' }" @click="setView('log')">Log</button>
      </div>

      <div class="elist-body">
        <div v-if="!filteredEntries.length" class="elist-empty">
          <div :style="{ color: typeConfig?.color, fontSize: '28px', opacity: 0.15 }">
            {{ typeConfig?.plural?.charAt(0) }}
          </div>
          <span>{{ search ? 'No results' : `No ${typeConfig?.plural?.toLowerCase()} yet` }}</span>
          <button class="btn-accent-sm" style="margin-top: 8px" @click="createEntry">Create one</button>
        </div>

        <div
          v-for="e in filteredEntries"
          :key="e.id"
          class="erow"
          :class="{ active: activeEntryId === e.id }"
          @click="openEntry(e)"
        >
          <!-- NPC: portrait image or gradient initials -->
          <div v-if="type === 'npc'" class="erow-avatar"
            :style="attrImg(e, 'portraitSource') ? {} : { background: avatarGradient(e.name) }">
            <img v-if="attrImg(e, 'portraitSource')" :src="attrImg(e, 'portraitSource')!" class="erow-avatar-img" />
            <template v-else>{{ initials(e.name) }}</template>
          </div>

          <!-- Location: logo image or gradient initials -->
          <div v-else-if="type === 'location'" class="erow-avatar erow-avatar--sq"
            :style="attrImg(e, 'logoSource') ? {} : { background: avatarGradient(e.name) }">
            <img v-if="attrImg(e, 'logoSource')" :src="attrImg(e, 'logoSource')!" class="erow-avatar-img" />
            <template v-else>{{ initials(e.name) }}</template>
          </div>

          <!-- Item: image thumbnail or icon -->
          <div v-else-if="type === 'item'" class="erow-avatar erow-avatar--sq erow-avatar--icon"
            :style="attrImg(e, 'imageSource') ? {} : { background: (typeConfig?.color ?? '#888') + '18', borderColor: (typeConfig?.color ?? '#888') + '40' }">
            <img v-if="attrImg(e, 'imageSource')" :src="attrImg(e, 'imageSource')!" class="erow-avatar-img" />
            <OhVueIcon v-else name="gi-open-treasure-chest" scale="0.7" :style="{ color: typeConfig?.color }" />
          </div>

          <!-- Faction: image or icon -->
          <div v-else-if="type === 'faction'" class="erow-avatar erow-avatar--icon"
            :style="attrImg(e, 'imageSource') ? {} : { background: (typeConfig?.color ?? '#888') + '18', borderColor: (typeConfig?.color ?? '#888') + '40' }">
            <img v-if="attrImg(e, 'imageSource')" :src="attrImg(e, 'imageSource')!" class="erow-avatar-img" />
            <OhVueIcon v-else name="gi-american-shield" scale="0.7" :style="{ color: typeConfig?.color }" />
          </div>

          <!-- Session: number badge -->
          <div v-else-if="type === 'session'" class="erow-num-badge"
            :style="{ background: (typeConfig?.color ?? '#888') + '18', borderColor: (typeConfig?.color ?? '#888') + '40', color: typeConfig?.color }">
            {{ (e.attributes as any)?.sessionNumber || '#' }}
          </div>

          <!-- Quest: icon colored by status -->
          <div v-else-if="type === 'quest'" class="erow-icon-badge"
            :style="{ color: questColor(e) }">
            <OhVueIcon name="gi-holy-grail" scale="0.75" />
          </div>

          <!-- Event: icon colored by significance -->
          <div v-else-if="type === 'event'" class="erow-icon-badge"
            :style="{ color: eventColor(e) }">
            <OhVueIcon name="gi-sands-of-time" scale="0.75" />
          </div>

          <!-- Note: custom picked icon -->
          <div v-else-if="type === 'note'" class="erow-icon-badge"
            :style="{ color: typeConfig?.color }">
            <OhVueIcon :name="(e.attributes as any)?.icon || 'gi-scroll-unfurled'" scale="0.75" />
          </div>

          <!-- Fallback: colored dot -->
          <div v-else class="erow-dot" :style="{ background: activeEntryId === e.id ? typeConfig?.color : 'var(--border-hi)' }" />

          <!-- Name + attribute sub-line -->
          <div class="erow-body">
            <div class="erow-name">{{ e.name }}</div>
            <div v-if="rowSub(e)" class="erow-sub">{{ rowSub(e) }}</div>
          </div>

          <!-- Status / rarity pill -->
          <span v-if="rowTag(e)" class="erow-pill" :style="pillStyle(rowTag(e)!)">
            {{ rowTag(e) }}
          </span>
          <!-- Session / event date -->
          <span v-if="rowDate(e)" class="erow-date">{{ rowDate(e) }}</span>
        </div>
      </div>
    </div>

    <!-- ── Right panel: child route (detail or empty) ── -->
    <div class="edetail">
      <NuxtPage />
    </div>

  </div>
</template>

<script setup lang="ts">
import { useCampaignEntity } from '~/composables/useCampaignEntity'
import type { EntityType } from '~/types/entities'
import type { Entity } from '~/stores/notes'

const props = defineProps<{ type: EntityType }>()

const route = useRoute()
const {
  typeConfig, entries, openEntry, createEntry, ensureLoaded, formatDateShort,
} = useCampaignEntity(props.type)

const search = ref('')

const filteredEntries = computed(() => {
  if (!search.value) return entries.value
  const q = search.value.toLowerCase()
  return entries.value.filter(e => e.name.toLowerCase().includes(q))
})

const activeEntryId = computed(() =>
  route.params.entryId ? Number(route.params.entryId) : null
)

const hasViewToggle = props.type === 'event' || props.type === 'session'
const localKey = `dmstome.${props.type}.view`
const viewMode = ref(
  hasViewToggle && import.meta.client ? (localStorage.getItem(localKey) || 'list') : 'list'
)
function setView(m: string) {
  viewMode.value = m
  if (import.meta.client) localStorage.setItem(localKey, m)
}

// ── Avatar helpers ─────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ['#6f6fc8', '#9b68c8'], ['#c86f6f', '#c89b68'], ['#6fc8a8', '#68c89b'],
  ['#c8a86f', '#c8c868'], ['#6fa8c8', '#6890c8'], ['#c86fa8', '#c868c8'],
]
function avatarGradient(name: string): string {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_GRADIENTS.length
  const [a, b] = AVATAR_GRADIENTS[idx]
  return `linear-gradient(135deg, ${a}, ${b})`
}
function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function attrImg(e: Entity, key: string): string | null {
  const v = (e.attributes as any)?.[key]
  return v && typeof v === 'string' && v.length > 0 ? v : null
}

// ── Row sub-line ──────────────────────────────────────────────────────────
function rowSub(e: Entity): string | null {
  const a = e.attributes as any
  if (props.type === 'npc') {
    return [a?.title, a?.race].filter(Boolean).join(' · ') || null
  }
  if (props.type === 'location') {
    return a?.locationType || null
  }
  if (props.type === 'item') {
    return [a?.itemType, a?.isMagic ? 'magic' : null].filter(Boolean).join(' · ') || null
  }
  if (props.type === 'faction') {
    return [a?.factionType, a?.size].filter(Boolean).join(' · ') || null
  }
  if (props.type === 'quest') {
    return a?.questGiver ? `from ${a.questGiver}` : null
  }
  if (props.type === 'event') {
    return [a?.location, a?.significance].filter(Boolean).join(' · ') || null
  }
  if (props.type === 'note') {
    const tags = a?.tags as string[] | undefined
    return tags?.length ? tags.slice(0, 2).join(', ') : null
  }
  return null
}

// ── Row date ───────────────────────────────────────────────────────────────
function rowDate(e: Entity): string | null {
  const a = e.attributes as any
  if (props.type === 'session' && a?.date) return formatDateShort(a.date)
  if (props.type === 'event' && a?.date) return formatDateShort(a.date)
  return null
}

// ── Row tag (pill) ─────────────────────────────────────────────────────────
function rowTag(e: Entity): string | null {
  const a = e.attributes as any
  if (props.type === 'npc') return a?.status || null
  if (props.type === 'session') return a?.mode || null
  if (props.type === 'quest') return a?.status || null
  if (props.type === 'location') return a?.status || null
  if (props.type === 'item') return a?.rarity || null
  if (props.type === 'faction') return null  // factionType is in sub-line
  return null
}

const TAG_COLORS: Record<string, string> = {
  active: 'var(--success)', planning: '#6b9fe8', running: 'var(--success)',
  finished: '#b87de8', completed: 'var(--success)', failed: 'var(--danger)',
  dormant: 'var(--text3)', discovered: 'var(--success)', undiscovered: 'var(--text3)',
  destroyed: 'var(--danger)', rare: '#b87de8', unique: '#e8924a',
  uncommon: '#7cc44e', common: 'var(--text3)',
}
function pillStyle(tag: string) {
  const c = TAG_COLORS[tag] ?? 'var(--text3)'
  return { color: c, borderColor: c + '44', background: c + '11' }
}

// ── Quest / event color ───────────────────────────────────────────────────
function questColor(e: Entity): string {
  const s = (e.attributes as any)?.status
  return TAG_COLORS[s] ?? 'var(--text3)'
}

function eventColor(e: Entity): string {
  const sig = (e.attributes as any)?.significance
  if (sig === 'critical') return 'var(--danger)'
  if (sig === 'major') return '#ebbd34'
  return 'var(--text3)'
}

onMounted(() => ensureLoaded())
</script>
