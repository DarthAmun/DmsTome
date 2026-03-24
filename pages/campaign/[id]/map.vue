<template>
  <div class="map-folio">

    <!-- ACTIVE MAP — full width -->
    <div v-if="activeLocationId" class="map-view">
      <div class="map-view-header">
        <button class="back-crumb" @click="goBack">← All Locations</button>
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

    <!-- ATLAS INDEX -->
    <template v-else>
      <div class="open-book">

        <!-- LEFT PAGE -->
        <div class="book-stack book-stack--left">
          <div class="book-sheet-3"></div>
          <div class="book-sheet-2"></div>
          <div class="book-sheet-1"></div>
          <div class="book-leaf book-leaf--left">
            <div class="page-header">
              <div class="page-chapter-num">{{ campaignName }}</div>
              <h1 class="page-title">The Atlas</h1>
              <div class="page-rule" />
            </div>
            <div class="leaf-inner">
              <div class="leaf-header">
                <span class="leaf-type" style="color:var(--gold)">Locations</span>
                <span class="leaf-count">{{ locations.length }} entries</span>
              </div>
              <div class="atlas-list">
                <div v-for="loc in leftLocations" :key="loc.id" class="entry" @click="openLocation(loc)">
                  <div class="entry-icon">
                    <img v-if="locLogo(loc)" :src="locLogo(loc)!" class="entry-thumb" />
                    <OhVueIcon v-else name="gi-castle" scale="0.85" style="color:var(--gold)" />
                  </div>
                  <span class="entry-name">{{ loc.name }}
                    <em v-if="locAttrs(loc).locationType">— {{ locAttrs(loc).locationType }}</em>
                  </span>
                  <span class="entry-dots" />
                  <span v-if="locMap(loc)" class="entry-tag" style="color:var(--gold);border-color:var(--gold)">map</span>
                  <span class="entry-date">{{ formatDate(loc.updatedAt) }}</span>
                </div>
                <div v-if="!locations.length" class="leaf-empty">
                  <OhVueIcon name="gi-treasure-map" scale="2.5" style="opacity:0.08;margin-bottom:12px" />
                  <em>No locations yet. Begin charting the world.</em>
                </div>
              </div>
            </div>
            <div class="leaf-footer">
              <button class="leaf-new" @click="createLocation">
                <span class="leaf-new-line-l"></span>
                <span class="leaf-new-label">✦ New Location ✦</span>
                <span class="leaf-new-line-r"></span>
              </button>
            </div>
          </div>
        </div>

        <div class="book-binding"></div>

        <!-- RIGHT PAGE -->
        <div class="book-stack book-stack--right">
          <div class="book-sheet-3"></div>
          <div class="book-sheet-2"></div>
          <div class="book-sheet-1"></div>
          <div class="book-leaf book-leaf--right">
            <div class="leaf-inner">
              <div class="leaf-header leaf-header--right">
                <span class="leaf-folio">continued</span>
              </div>
              <div class="atlas-list">
                <div v-for="loc in rightLocations" :key="loc.id" class="entry" @click="openLocation(loc)">
                  <div class="entry-icon">
                    <img v-if="locLogo(loc)" :src="locLogo(loc)!" class="entry-thumb" />
                    <OhVueIcon v-else name="gi-castle" scale="0.85" style="color:var(--gold)" />
                  </div>
                  <span class="entry-name">{{ loc.name }}
                    <em v-if="locAttrs(loc).locationType">— {{ locAttrs(loc).locationType }}</em>
                  </span>
                  <span class="entry-dots" />
                  <span v-if="locMap(loc)" class="entry-tag" style="color:var(--gold);border-color:var(--gold)">map</span>
                  <span class="entry-date">{{ formatDate(loc.updatedAt) }}</span>
                </div>
                <div v-if="rightLocations.length === 0 && locations.length > 0" class="leaf-empty">
                  <em style="opacity:0.35">— end of entries —</em>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>


<script setup lang="ts">
import { useNotesStore } from '~/stores/notes'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const campaignId = Number(route.params.id)
const campaignName = ref('Campaign')
const previewLoc = ref<any>(null)

const locations = computed(() => store.byType['location'] ?? [])
const leftLocations = computed(() => { const a = locations.value; return a.slice(0, Math.ceil(a.length / 2)) })
const rightLocations = computed(() => { const a = locations.value; return a.slice(Math.ceil(a.length / 2)) })

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
    router.push({
      query: {
        locationId: String(parentId),
        ...(newStack.length ? { stack: newStack.join(',') } : {}),
      }
    })
  } else if (activeLocationId.value) {
    router.push({ query: {} })
  } else {
    router.back()
  }
}

function onDrillDown(fromId: number, toId: number) {
  const newStack = [...locationStack.value, fromId]
  router.push({
    query: {
      locationId: String(toId),
      stack: newStack.join(','),
    }
  })
}

function onNavigateCrumb(index: number) {
  // index is the position in the breadcrumb to go back to
  const targetId = locationStack.value[index]
  const newStack = locationStack.value.slice(0, index)
  router.push({
    query: {
      locationId: String(targetId),
      ...(newStack.length ? { stack: newStack.join(',') } : {}),
    }
  })
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
.map-folio {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  overflow: visible;
}

.map-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-view-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  border-bottom: 1px dashed var(--parch-line);
  flex-shrink: 0;
}

.map-view-name {
  font-family: var(--font-head);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink);
}

.map-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.back-crumb {
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0;
}

.back-crumb:hover {
  color: var(--blood);
}

/* Open book spread */
.leaf-inner {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
}

.leaf-footer {
  padding: 10px 28px 16px;
  border-top: 1px dashed var(--parch-line);
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
}

.leaf-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--parch-line);
}

.leaf-header--right {
  justify-content: flex-end;
}

.leaf-type {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.leaf-count {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
}

.leaf-folio {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
  font-style: italic;
}

.leaf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 32px 0;
  color: var(--ink-ghost);
  font-family: var(--font-body);
  font-size: 14px;
  font-style: italic;
  gap: 8px;
}

.atlas-list {
  display: flex;
  flex-direction: column;
}

.entry-icon {
  width: 26px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--parch-dark);
}

</style>