<template>
  <div class="map-folio">
      <div class="page-header map-header" v-if="!activeLocationId">
        <div class="page-chapter-num">{{ campaignName }}</div>
        <h1 class="page-title">The Atlas</h1>
        <div class="page-rule" />
      </div>

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
            :location-stack="locationStack"
            @navigate-entity="navigateToEntity"
            @drill-down="onDrillDown"
            @navigate-crumb="onNavigateCrumb"
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
            <OhVueIcon name="md-add" scale="2" style="color:var(--ink-ghost);opacity:0.3;margin-bottom:8px" />
            <span style="color:var(--ink-faded);font-size:13px;font-weight:500">New Location</span>
          </div>
        </div>

        <div v-else class="empty-state">
          <OhVueIcon name="gi-treasure-map" scale="4" style="opacity:0.1;margin-bottom:16px" />
          <h2 style="font-size:22px;font-weight:700;text-transform:uppercase;margin-bottom:8px">No Locations Yet</h2>
          <p style="color:var(--ink-faded);font-size:13px;margin-bottom:20px">
            Create a location, add a map image, then pin entities to it.
          </p>
          <Button @click="createLocation">
            <template #icon><OhVueIcon name="md-add" scale="0.85" /></template>
            New Location
          </Button>
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

// All state in the URL:
//   locationId = current map being viewed
//   stack      = comma-separated list of parent location IDs (for breadcrumb)
const activeLocationId = computed(() =>
  route.query.locationId ? Number(route.query.locationId) : null
)
const locationStack = computed<number[]>(() => {
  const s = route.query.stack as string
  if (!s) return []
  return s.split(',').map(Number).filter(Boolean)
})
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
  // If we're deep in a stack, go back up one level
  if (locationStack.value.length > 0) {
    const newStack = locationStack.value.slice(0, -1)
    const parentId = locationStack.value[locationStack.value.length - 1]
    router.push({ query: {
      locationId: String(parentId),
      ...(newStack.length ? { stack: newStack.join(',') } : {}),
    }})
  } else if (activeLocationId.value) {
    router.push({ query: {} })
  } else {
    router.back()
  }
}

function onDrillDown(fromId: number, toId: number) {
  const newStack = [...locationStack.value, fromId]
  router.push({ query: {
    locationId: String(toId),
    stack: newStack.join(','),
  }})
}

function onNavigateCrumb(index: number) {
  // index is the position in the breadcrumb to go back to
  const targetId = locationStack.value[index]
  const newStack = locationStack.value.slice(0, index)
  router.push({ query: {
    locationId: String(targetId),
    ...(newStack.length ? { stack: newStack.join(',') } : {}),
  }})
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
.map-folio { height: 100%; display: flex; flex-direction: column; background: var(--parch); }
.map-header { padding-bottom: 0; flex-shrink: 0; }

/* Active map view */
.map-view { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.map-view-header {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 24px; background: var(--parch);
  border-bottom: 1px dashed var(--parch-line); flex-shrink: 0;
}
.map-view-name {
  font-family: var(--font-head); font-size: 13px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink);
}
.map-body { flex: 1; overflow: hidden; position: relative; }

/* Location dashboard — parchment index */
.main-canvas { flex: 1; overflow-y: auto; padding: 20px 36px; background: var(--parch); background-image: none !important; background-color: var(--parch) !important; }

/* Location grid — index entries */
.loc-grid { display: flex; flex-direction: column; margin-bottom: 28px; }

.loc-card {
  display: flex; align-items: center; gap: 0;
  padding: 12px 0; border-bottom: 1px dashed var(--parch-line);
  cursor: pointer; transition: all 0.15s; position: relative;
}
.loc-card:hover { padding-left: 8px; }
.loc-card:hover::before { content: '›'; position: absolute; left: -6px; color: var(--blood); font-size: 18px; }

.loc-card-banner {
  width: 80px; height: 60px; flex-shrink: 0;
  background: var(--parch-dark); border: 1px solid var(--ink-ghost);
  border-radius: var(--r); overflow: hidden; margin-right: 14px;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-ghost);
}
.loc-card-banner-empty { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.loc-card-badges { position: absolute; top: 4px; right: 4px; display: flex; gap: 3px; }
.loc-type-tag { position: absolute; bottom: 3px; left: 3px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 1px 5px; background: rgba(28,20,16,0.6); color: var(--parch); border-radius: 2px; }

.loc-card-info { flex: 1; }
.loc-card-name { font-family: var(--font-body); font-size: 16px; color: var(--ink); margin-bottom: 3px; }
.loc-card-meta { display: flex; align-items: center; gap: 8px; }
.loc-status-badge { font-family: var(--font-head); font-size: 8px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 6px; border: 1px solid currentColor; border-radius: 2px; }
.status--discovered   { color: #4a7a38; }
.status--undiscovered { color: var(--ink-ghost); }
.status--destroyed    { color: var(--blood); }
.loc-map-badge { font-family: var(--font-head); font-size: 8px; color: var(--gold); letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 3px; }
.loc-pin-count { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); display: flex; align-items: center; gap: 3px; }
.loc-card-date { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); margin-left: auto; }

.loc-card-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; margin-left: 10px; }
.loc-card:hover .loc-card-actions { opacity: 1; }
.loc-action { display: inline-flex; align-items: center; gap: 3px; padding: 4px 8px; border-radius: 2px; background: rgba(28,20,16,0.06); border: 1px solid transparent; color: var(--ink-ghost); font-size: 9px; font-family: var(--font-head); letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
.loc-action:hover { background: rgba(28,20,16,0.12); color: var(--ink); }
.loc-action--primary { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }
.loc-action--primary:hover { background: rgba(139,26,26,0.2); }
.loc-card--new { justify-content: center; flex-direction: column; min-height: 60px; border: 1px dashed var(--ink-ghost); border-bottom: none; padding: 14px; }

/* New entry row */
.new-entry-row { display: flex; align-items: center; margin-bottom: 20px; }
.new-entry-btn { display: flex; align-items: center; gap: 16px; width: 100%; background: none; border: none; cursor: pointer; transition: all 0.2s; padding: 8px 0; }
.new-entry-line { flex: 1; height: 1px; background: linear-gradient(to right, transparent, var(--ink-ghost)); }
.new-entry-label { font-family: var(--font-head); font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: var(--ink-ghost); white-space: nowrap; transition: color 0.2s; flex-shrink: 0; }
.new-entry-btn:hover .new-entry-label { color: var(--blood); }
.new-entry-btn:hover .new-entry-line { background: linear-gradient(to right, transparent, var(--blood)); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; min-height: 300px; }
.empty-state p { font-family: var(--font-body); font-size: 15px; color: var(--ink-ghost); font-style: italic; margin-bottom: 20px; }
</style>