<template>
  <div class="shell">
    <nav class="icon-rail">
      <div class="icon-rail-logo">
        <OhVueIcon name="gi-anvil-impact" />
      </div>
      <NuxtLink to="/" class="rail-icon-btn" title="Back">
        <OhVueIcon name="md-arrowback" scale="0.95" />
      </NuxtLink>
      <div class="rail-divider" />
      <button
        v-for="loc in locations" :key="loc.id"
        class="rail-icon-btn"
        :class="{ active: activeLocationId === loc.id }"
        :title="loc.name"
        @click="selectLocation(loc.id)"
      >
        <OhVueIcon name="gi-castle" scale="0.95" />
      </button>
      <div class="rail-spacer" />
      <button class="rail-fab" title="New Location" @click="createLocation">+</button>
    </nav>

    <div class="shell-body">
      <header class="top-bar">
        <span class="top-bar-title">{{ campaignName }}</span>
        <span class="top-bar-section">/ World Map</span>
        <div class="top-bar-spacer" />
        <NuxtLink :to="`/campaign/${campaignId}/notes`" class="nav-pill">
          <OhVueIcon name="gi-scroll-unfurled" scale="0.85" /> Notes
        </NuxtLink>
      </header>

      <!-- Active map view -->
      <div v-if="activeLocationId" class="map-view">
        <div class="map-view-header">
          <button class="pill-btn" @click="goBack">
            <OhVueIcon name="md-arrowback" scale="0.85" /> All Locations
          </button>
          <span class="map-view-name">{{ activeLocationName }}</span>
        </div>
        <div class="map-body">
          <WorldMap
            :campaign-id="campaignId"
            :root-location-id="activeLocationId"
            @navigate-entity="navigateToEntity"
          />
        </div>
      </div>

      <!-- Location dashboard -->
      <div v-else class="main-canvas">
        <h1 class="section-eyebrow">Locations</h1>

        <div v-if="locations.length > 0" class="loc-grid">
          <div
            v-for="loc in locations" :key="loc.id"
            class="loc-card v6-card"
            @click="openLocation(loc)"
          >
            <div class="loc-card-banner">
              <img v-if="locLogo(loc)" :src="locLogo(loc)!" class="w-full h-full object-cover" />
              <img v-else-if="locMap(loc)" :src="locMap(loc)!" class="w-full h-full object-cover"
                style="filter:brightness(0.45) saturate(0.6)" />
              <div v-else class="loc-card-banner-empty">
                <OhVueIcon name="gi-castle" scale="2.5" style="opacity:0.2" />
              </div>
              <div class="loc-card-badges">
                <span v-if="locAttrs(loc).status" class="loc-status-badge"
                  :class="`status--${locAttrs(loc).status}`">{{ locAttrs(loc).status }}</span>
                <span v-if="locMap(loc)" class="loc-map-badge" title="Has map">
                  <OhVueIcon name="md-map" scale="0.75" />
                </span>
              </div>
              <span v-if="locAttrs(loc).locationType" class="loc-type-tag capitalize">
                {{ locAttrs(loc).locationType }}
              </span>
            </div>
            <div class="loc-card-body">
              <div class="loc-card-name">{{ loc.name }}</div>
              <div class="loc-card-meta">
                <span v-if="pinCount(loc)" class="loc-pin-count">
                  <OhVueIcon name="gi-all-seeing-eye" scale="0.75" /> {{ pinCount(loc) }} pins
                </span>
                <span class="loc-card-date">{{ formatDate(loc.updatedAt) }}</span>
              </div>
              <div class="loc-card-actions" @click.stop>
                <button class="loc-action" @click.stop="openNotes(loc)">
                  <OhVueIcon name="md-editnote" scale="0.8" /> Note
                </button>
                <button v-if="locMap(loc)" class="loc-action loc-action--primary"
                  @click.stop="openLocation(loc)">
                  <OhVueIcon name="md-map" scale="0.8" /> Open Map
                </button>
                <button v-else class="loc-action" @click.stop="openLocation(loc)">
                  <OhVueIcon name="md-add" scale="0.8" /> Add Map
                </button>
              </div>
            </div>
          </div>

          <div class="loc-card loc-card--new v6-card" @click="createLocation">
            <OhVueIcon name="md-add" scale="2" style="color:var(--muted);opacity:0.3;margin-bottom:8px" />
            <span style="color:var(--secondary);font-size:13px;font-weight:500">New Location</span>
          </div>
        </div>

        <div v-else class="empty-state">
          <OhVueIcon name="gi-treasure-map" scale="4" style="opacity:0.1;margin-bottom:16px" />
          <h2 style="font-size:22px;font-weight:900;text-transform:uppercase;margin-bottom:8px">No Locations Yet</h2>
          <p style="color:var(--secondary);font-size:13px;margin-bottom:20px">
            Create a location, add a map image, then pin entities to it.
          </p>
          <Button @click="createLocation">
            <template #icon><OhVueIcon name="md-add" scale="0.85" /></template>
            New Location
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotesStore } from '~/stores/notes'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const campaignId = Number(route.params.id)
const campaignName = ref('Campaign')

const locations = computed(() => store.byType['location'] ?? [])

// All state lives in the URL — back button works automatically
const activeLocationId = computed(() =>
  route.query.locationId ? Number(route.query.locationId) : null
)
const activeLocationName = computed(() =>
  locations.value.find(l => l.id === activeLocationId.value)?.name ?? ''
)

onMounted(async () => {
  await store.loadAll(campaignId)
  if (window.dmforge) {
    const camps = await window.dmforge.campaigns.list()
    campaignName.value = camps.find((c: any) => c.id === campaignId)?.name ?? 'Campaign'
  }
})

function selectLocation(id: number) {
  router.push({ query: { locationId: String(id) } })
}

function openLocation(loc: any) {
  router.push({ query: { locationId: String(loc.id) } })
}

function goBack() {
  router.push({ query: {} })
}

function openNotes(loc: any) {
  router.push(`/campaign/${campaignId}/notes?id=${loc.id}&type=location`)
}

async function createLocation() {
  const e = await store.createEntity(campaignId, 'location', 'New Location')
  router.push(`/campaign/${campaignId}/notes?id=${e.id}&type=location`)
}

function navigateToEntity(entity: any) {
  router.push(`/campaign/${campaignId}/notes?id=${entity.id}&type=${entity.type}`)
}

function locAttrs(loc: any) { return (loc.attributes ?? {}) as any }
function locLogo(loc: any): string | null {
  const a = locAttrs(loc)
  return a.logoSource || null
}
function locMap(loc: any): string | null {
  const a = locAttrs(loc)
  return a.imageSource || null
}
function pinCount(loc: any): number {
  return (locAttrs(loc).mapPins ?? []).length
}
function formatDate(dt: string) {
  if (!dt) return ''
  const diff = Date.now() - new Date(dt).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.shell { display: flex; height: 100vh; overflow: hidden; }
.shell-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.rail-divider { width: 24px; height: 1px; background: var(--border); margin: 4px 0; }
.top-bar-spacer { flex: 1; }
.top-bar-section { font-size: 14px; color: var(--secondary); font-family: 'DM Sans', sans-serif; }

.map-view { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.map-view-header { display: flex; align-items: center; gap: 14px; padding: 10px 20px; background: var(--card); border-bottom: 1px solid var(--border); flex-shrink: 0; }
.map-view-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); }
.map-body { flex: 1; overflow: hidden; position: relative; }

.main-canvas { flex: 1; overflow-y: auto; padding: 28px 24px; background: var(--bg); }
.section-eyebrow { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; color: var(--text); margin-bottom: 20px; }

.loc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.loc-card { display: flex; flex-direction: column; overflow: hidden; cursor: pointer; }
.loc-card-banner { height: 140px; background: var(--raised); position: relative; overflow: hidden; flex-shrink: 0; }
.loc-card-banner-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--muted); }
.loc-card-badges { position: absolute; top: 8px; right: 8px; display: flex; gap: 5px; align-items: center; }
.loc-status-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; text-transform: capitalize; }
.status--discovered   { background: rgba(124,196,78,0.25); color: #7cc44e; }
.status--undiscovered { background: rgba(96,96,96,0.25);   color: var(--secondary); }
.status--destroyed    { background: rgba(224,85,85,0.25);  color: var(--danger); }
.loc-map-badge { width: 22px; height: 22px; border-radius: 6px; background: rgba(0,0,0,0.55); color: white; display: flex; align-items: center; justify-content: center; }
.loc-type-tag { position: absolute; bottom: 8px; left: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,0.6); color: white; }
.loc-card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.loc-card-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }
.loc-card-meta { display: flex; align-items: center; gap: 10px; }
.loc-pin-count { font-size: 11px; color: var(--secondary); display: flex; align-items: center; gap: 4px; }
.loc-card-date { font-size: 11px; color: var(--muted); margin-left: auto; }
.loc-card-actions { display: flex; gap: 5px; margin-top: 6px; padding-top: 8px; border-top: 1px solid var(--border); }
.loc-action { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; background: var(--raised); border: none; color: var(--secondary); font-size: 11px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s; }
.loc-action:hover { background: var(--hover); color: var(--text); }
.loc-action--primary { background: var(--gold-dim); color: var(--gold); }
.loc-action--primary:hover { background: rgba(235,189,52,0.22); }
.loc-card--new { align-items: center; justify-content: center; min-height: 200px; border: 2px dashed var(--border); box-shadow: none; background: transparent; }
.loc-card--new:hover { border-color: var(--border-l); background: var(--card); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
</style>
