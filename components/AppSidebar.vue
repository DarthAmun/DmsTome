<template>
  <aside class="sidebar" :class="{ collapsed }">

    <!-- ── Top bar ── -->
    <div class="sb-top">
      <img
        v-if="!collapsed"
        src="/icons/icon-192.png"
        alt=""
        width="22"
        height="22"
        class="sb-logo-img"
        @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
      />
      <NuxtLink to="/" class="sb-wordmark" :title="collapsed ? undefined : 'DM\'s Tome'">
        DM's Tome
      </NuxtLink>

      <!-- Theme toggle (hidden when collapsed) -->
      <button
        class="sb-icon-btn sb-theme-btn"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        {{ isDark ? '☀' : '☾' }}
      </button>

      <!-- Collapse toggle -->
      <button
        class="sb-icon-btn sb-collapse-btn"
        :title="collapsed ? 'Expand sidebar (B)' : 'Collapse sidebar (B)'"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '›' : '‹' }}
      </button>
    </div>

    <!-- Logo icon when collapsed -->
    <div v-if="collapsed" class="sb-scroll" style="padding-top:4px">
      <!-- Campaigns icon rail -->
      <div
        v-for="c in campaigns"
        :key="c.id!"
        class="sb-campaign-header"
        :class="{ active: activeCampaignId === c.id }"
        :style="{ '--dot-color': campaignColor(c.id!) }"
        :data-tip="c.name"
        @click="navigateToCampaign(c)"
      >
        <span class="sb-campaign-dot" :style="{ background: campaignColor(c.id!) }" />
      </div>

      <div class="sb-divider" />

      <!-- Systems icon rail -->
      <NuxtLink
        v-for="sys in systems"
        :key="sys.id!"
        :to="`/system/${sys.id}/library`"
        class="sb-system"
        :class="{ active: activeSystemId === sys.id }"
        :data-tip="sys.name"
      >
        <div class="sb-system-icon">{{ (sys.shortId || sys.name).slice(0, 2).toUpperCase() }}</div>
      </NuxtLink>

      <div class="sb-divider" />

      <!-- Settings -->
      <NuxtLink to="/settings" class="sb-bottom-row" :class="{ active: route.path === '/settings' }" data-tip="Settings">
        <span class="sb-bottom-icon">⚙</span>
      </NuxtLink>

      <!-- Theme toggle (in icon rail when collapsed) -->
      <button class="sb-bottom-row" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
        <span class="sb-bottom-icon">{{ isDark ? '☀' : '☾' }}</span>
      </button>
    </div>

    <!-- ── Scroll area (expanded) ── -->
    <div v-else class="sb-scroll">

      <!-- CAMPAIGNS section -->
      <div class="sb-section-row">
        <span class="sb-section-label">Campaigns</span>
        <button class="sb-section-add" title="New campaign" @click="showNewCampaign = true">+</button>
      </div>

      <div v-for="c in campaigns" :key="c.id!" class="sb-campaign">
        <!-- Campaign header row -->
        <div
          class="sb-campaign-header"
          :class="{ active: activeCampaignId === c.id }"
          @click="toggleCampaign(c)"
        >
          <span
            class="sb-campaign-arrow"
            :class="{ open: expandedCampaigns.has(c.id!) }"
          >›</span>
          <span
            class="sb-campaign-dot"
            :style="{ background: campaignColor(c.id!) }"
          />
          <span class="sb-campaign-name">{{ c.name }}</span>
        </div>

        <!-- Entity type children -->
        <Transition name="sb-children">
          <div v-if="expandedCampaigns.has(c.id!)" class="sb-children">
            <NuxtLink
              v-for="et in ENTITY_TYPES"
              :key="et.key"
              :to="`/campaign/${c.id}/${et.segment}`"
              class="sb-child"
              :class="{ active: isChildActive(c.id!, et.segment) }"
              :style="{ '--child-color': et.color }"
            >
              <span class="sb-child-dot" :style="{ background: et.color }" />
              <span class="sb-child-label">{{ et.label }}</span>
              <span class="sb-child-count">{{ entityCounts[c.id!]?.[et.key] ?? '' }}</span>
            </NuxtLink>

            <div class="sb-child-sep" />

            <NuxtLink
              :to="`/campaign/${c.id}/encounters`"
              class="sb-child-tool"
              :class="{ active: route.path === `/campaign/${c.id}/encounters` || (route.path.startsWith('/encounter') && activeCampaignId === c.id) }"
            >
              <span class="sb-child-tool-icon">⚔</span>
              <span>Encounters</span>
            </NuxtLink>

            <NuxtLink
              :to="`/campaign/${c.id}/map`"
              class="sb-child-tool"
              :class="{ active: route.path === `/campaign/${c.id}/map` }"
            >
              <span class="sb-child-tool-icon">🗺</span>
              <span>World Map</span>
            </NuxtLink>
          </div>
        </Transition>
      </div>

      <div v-if="!campaigns.length" class="sb-empty">
        <span>No campaigns yet</span>
      </div>

      <div class="sb-divider" />

      <!-- SYSTEMS section -->
      <div class="sb-section-row">
        <span class="sb-section-label">Systems</span>
        <button class="sb-section-add" title="New system" @click="showNewSystem = true">+</button>
      </div>

      <NuxtLink
        v-for="sys in systems"
        :key="sys.id!"
        :to="`/system/${sys.id}/library`"
        class="sb-system"
        :class="{ active: activeSystemId === sys.id }"
      >
        <div class="sb-system-icon">{{ (sys.shortId || sys.name).slice(0, 2).toUpperCase() }}</div>
        <span class="sb-system-name">{{ sys.name }}</span>
        <span class="sb-system-version">v{{ sys.version }}</span>
      </NuxtLink>

      <div v-if="!systems.length" class="sb-empty">
        <span>No systems yet</span>
      </div>

    </div>

    <!-- ── Bottom nav (expanded only) ── -->
    <div v-if="!collapsed" class="sb-footer">
      <div class="sb-divider" style="margin:0" />
      <NuxtLink to="/settings" class="sb-bottom-row" :class="{ active: route.path === '/settings' }">
        <span class="sb-bottom-icon">⚙</span>
        <span class="sb-bottom-label">Settings</span>
      </NuxtLink>
    </div>

  </aside>
</template>

<script setup lang="ts">
import { dbApi } from '~/composables/useDb'
import { useSystemsStore } from '~/stores/systems'
import { useNotesStore } from '~/stores/notes'
import { useSettings } from '~/composables/useSettings'
import { useAppDialogs } from '~/composables/useAppDialogs'
import type { DbCampaign } from '~/composables/useDb'

const { showNewCampaign, showNewSystem } = useAppDialogs()

const route = useRoute()
const router = useRouter()
const { settings, update: updateSetting } = useSettings()
const systemsStore = useSystemsStore()
const notesStore = useNotesStore()

// ── Collapse state ────────────────────────────────────────────────────────
const collapsed = ref(false)
if (import.meta.client) {
  collapsed.value = localStorage.getItem('sb-collapsed') === '1'
}
watch(collapsed, v => {
  if (import.meta.client) localStorage.setItem('sb-collapsed', v ? '1' : '0')
})

// Keyboard shortcut B
if (import.meta.client) {
  const onKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    if (e.key === 'b' || e.key === 'B') collapsed.value = !collapsed.value
  }
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}

// ── Theme ────────────────────────────────────────────────────────────────
const isDark = computed(() => settings.value.theme !== 'light')
function toggleTheme() {
  updateSetting('theme', isDark.value ? 'light' : 'dark')
}

// ── Campaigns ────────────────────────────────────────────────────────────
const campaigns = ref<DbCampaign[]>([])
async function loadCampaigns() {
  campaigns.value = await dbApi.campaigns.list()
}
onMounted(loadCampaigns)

// Provide a way for parent to reload
defineExpose({ reload: loadCampaigns })

// ── Systems ───────────────────────────────────────────────────────────────
const systems = computed(() => systemsStore.systems)
onMounted(() => { if (!systems.value.length) systemsStore.loadAll() })

// ── Active context ────────────────────────────────────────────────────────
const activeCampaignId = computed(() => {
  const id = route.params.id
  if (!route.path.startsWith('/campaign/')) return null
  return id ? Number(id) : null
})

const activeSystemId = computed(() => {
  const id = route.params.id
  if (!route.path.startsWith('/system/')) return null
  return id ? Number(id) : null
})

// ── Expanded campaigns ────────────────────────────────────────────────────
const expandedCampaigns = ref<Set<number>>(new Set())

// Auto-expand active campaign
watch(activeCampaignId, id => {
  if (id) expandedCampaigns.value.add(id)
}, { immediate: true })

function toggleCampaign(c: DbCampaign) {
  if (!c.id) return
  if (expandedCampaigns.value.has(c.id)) {
    expandedCampaigns.value.delete(c.id)
    expandedCampaigns.value = new Set(expandedCampaigns.value)
  } else {
    expandedCampaigns.value.add(c.id)
    expandedCampaigns.value = new Set(expandedCampaigns.value)
    navigateToCampaign(c)
  }
}

function navigateToCampaign(c: DbCampaign) {
  router.push(`/campaign/${c.id}`)
}


// ── Entity types list ─────────────────────────────────────────────────────
const ENTITY_TYPES = [
  { key: 'session',   label: 'Sessions',  segment: 'sessions',  color: '#b87de8' },
  { key: 'npc',       label: 'NPCs',      segment: 'npcs',      color: '#7cc44e' },
  { key: 'location',  label: 'Locations', segment: 'locations', color: '#a87de8' },
  { key: 'item',      label: 'Items',     segment: 'items',     color: '#ebbd34' },
  { key: 'faction',   label: 'Factions',  segment: 'factions',  color: '#e05555' },
  { key: 'quest',     label: 'Quests',    segment: 'quests',    color: '#e8924a' },
  { key: 'event',     label: 'Events',    segment: 'events',    color: '#4ab8e8' },
  { key: 'note',      label: 'Notes',     segment: 'notes',     color: '#6b9fe8' },
]

function isChildActive(campaignId: number, segment: string): boolean {
  return activeCampaignId.value === campaignId && route.path.includes(`/${segment}`)
}

// ── Entity counts ─────────────────────────────────────────────────────────
const entityCounts = computed(() => {
  const result: Record<number, Record<string, number>> = {}
  for (const e of notesStore.entities) {
    if (!result[e.campaignId]) result[e.campaignId] = {}
    result[e.campaignId][e.type] = (result[e.campaignId][e.type] ?? 0) + 1
  }
  return result
})

// ── Campaign color ────────────────────────────────────────────────────────
const CAMPAIGN_COLORS = [
  '#7c6fe8', '#e87c6f', '#6fe8c0', '#e8c46f', '#6fa8e8',
  '#e86fa8', '#a8e86f', '#e86f6f', '#6fe8a8', '#c46fe8',
]
function campaignColor(id: number): string {
  return CAMPAIGN_COLORS[id % CAMPAIGN_COLORS.length]
}
</script>

<style scoped>
.sb-logo-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
  opacity: 0.85;
}

.sb-empty {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text3);
  font-style: italic;
}

.sb-footer {
  flex-shrink: 0;
  padding: 4px 6px 8px;
}

/* Children expand/collapse transition */
.sb-children-enter-active,
.sb-children-leave-active {
  transition: opacity 0.15s, transform 0.15s;
  overflow: hidden;
}
.sb-children-enter-from,
.sb-children-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Tooltip on hover (collapsed mode) */
.sidebar.collapsed [data-tip]:hover::after {
  opacity: 1;
}
</style>
