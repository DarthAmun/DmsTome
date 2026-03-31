<template>
  <div class="map-folio">
    <!-- ACTIVE MAP — full width -->
    <div v-if="activeLocationId" class="map-view-shell">
      <div class="map-sheet map-sheet-3"></div>
      <div class="map-sheet map-sheet-2"></div>
      <div class="map-view">
        <div class="map-view-header">
          <button class="back-btn" @click="goBack">
            <OhVueIcon name="md-arrowback" scale="0.75" />
            {{ locationStack.length > 0 ? "Up a Level" : "All Locations" }}
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
      <!-- end map-view -->
    </div>
    <!-- end map-view-shell -->

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
                <span class="leaf-type" style="color: var(--gold)"
                  >Locations</span
                >
                <span class="leaf-count">{{ locations.length }} entries</span>
              </div>
              <div class="atlas-list">
                <div
                  v-for="(loc, i) in leftLocations"
                  :key="loc.id"
                  class="entry"
                  style="--et-color: var(--gold)"
                  @click="openLocation(loc)"
                >
                  <span class="entry-num">{{
                    spreadPage * PAGE_HALF * 2 + i + 1
                  }}</span>
                  <div class="entry-icon">
                    <div class="entry-badge">
                      <img
                        v-if="locLogo(loc)"
                        :src="locLogo(loc)!"
                        class="entry-thumb"
                      />
                      <OhVueIcon
                        v-else
                        name="gi-castle"
                        scale="0.75"
                        style="color: var(--gold)"
                      />
                    </div>
                  </div>
                  <div class="entry-body">
                    <div class="entry-top">
                      <span class="entry-name">{{ loc.name }}</span>
                      <span class="entry-leader" />
                      <span class="entry-date">{{
                        formatDate(loc.updatedAt)
                      }}</span>
                    </div>
                    <div
                      v-if="locAttrs(loc).locationType || locMap(loc)"
                      class="entry-attrs"
                    >
                      <span
                        v-if="locAttrs(loc).locationType"
                        class="ea-pill"
                        style="
                          color: var(--gold);
                          border-color: var(--gold);
                          background: color-mix(
                            in srgb,
                            var(--gold) 10%,
                            transparent
                          );
                        "
                      >
                        {{ locAttrs(loc).locationType }}
                      </span>
                      <span v-if="locMap(loc)" class="ea-bool">map</span>
                    </div>
                  </div>
                </div>
                <div v-if="!locations.length" class="leaf-empty">
                  <OhVueIcon
                    name="gi-treasure-map"
                    scale="2.5"
                    style="opacity: 0.08; margin-bottom: 12px"
                  />
                  <em>No locations yet. Begin charting the world.</em>
                </div>
              </div>
            </div>
            <div class="leaf-footer">
              <button
                class="leaf-nav-btn"
                :disabled="!hasPrevSpread"
                @click="prevSpread"
              >
                <OhVueIcon name="md-chevronleft" scale="0.9" />
              </button>
              <button class="leaf-new" @click="createLocation">
                <span class="leaf-new-line-l"></span>
                <span class="leaf-new-label">✦ New Location ✦</span>
                <span class="leaf-new-line-r"></span>
              </button>
              <span class="leaf-folio-num">{{ spreadPage + 1 }}</span>
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
                <span class="leaf-folio"
                  >{{ spreadPage + 1 }} / {{ totalSpreads }}</span
                >
              </div>
              <div class="atlas-list">
                <div
                  v-for="(loc, i) in rightLocations"
                  :key="loc.id"
                  class="entry"
                  style="--et-color: var(--gold)"
                  @click="openLocation(loc)"
                >
                  <span class="entry-num">{{
                    spreadPage * PAGE_HALF * 2 + PAGE_HALF + i + 1
                  }}</span>
                  <div class="entry-icon">
                    <div class="entry-badge">
                      <img
                        v-if="locLogo(loc)"
                        :src="locLogo(loc)!"
                        class="entry-thumb"
                      />
                      <OhVueIcon
                        v-else
                        name="gi-castle"
                        scale="0.75"
                        style="color: var(--gold)"
                      />
                    </div>
                  </div>
                  <div class="entry-body">
                    <div class="entry-top">
                      <span class="entry-name">{{ loc.name }}</span>
                      <span class="entry-leader" />
                      <span class="entry-date">{{
                        formatDate(loc.updatedAt)
                      }}</span>
                    </div>
                    <div
                      v-if="locAttrs(loc).locationType || locMap(loc)"
                      class="entry-attrs"
                    >
                      <span
                        v-if="locAttrs(loc).locationType"
                        class="ea-pill"
                        style="
                          color: var(--gold);
                          border-color: var(--gold);
                          background: color-mix(
                            in srgb,
                            var(--gold) 10%,
                            transparent
                          );
                        "
                      >
                        {{ locAttrs(loc).locationType }}
                      </span>
                      <span v-if="locMap(loc)" class="ea-bool">map</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="rightLocations.length === 0 && locations.length > 0"
                  class="leaf-empty"
                >
                  <em style="opacity: 0.35">— end of entries —</em>
                </div>
              </div>
            </div>
            <div class="leaf-footer leaf-footer--right">
              <span class="leaf-folio-num">{{ spreadPage + 2 }}</span>
              <button
                class="leaf-nav-btn"
                :disabled="!hasNextSpread"
                @click="nextSpread"
              >
                <OhVueIcon name="md-chevronright" scale="0.9" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useNotesStore } from "~/stores/notes";
import { usePageChrome } from "~/composables/usePageChrome";

const route = useRoute();
const router = useRouter();
const store = useNotesStore();
const campaignId = Number(route.params.id);
const campaignName = ref("Campaign");
const previewLoc = ref<any>(null);
const { hideSpine, showSpine } = usePageChrome();

const locations = computed(() => store.byType["location"] ?? []);

const PAGE_HALF = 8;
const spreadPage = ref(0);
const hasPrevSpread = computed(() => spreadPage.value > 0);
const hasNextSpread = computed(
  () => (spreadPage.value + 1) * PAGE_HALF * 2 < locations.value.length,
);
const totalSpreads = computed(() =>
  Math.max(1, Math.ceil(locations.value.length / (PAGE_HALF * 2))),
);
const leftLocations = computed(() =>
  locations.value.slice(
    spreadPage.value * PAGE_HALF * 2,
    spreadPage.value * PAGE_HALF * 2 + PAGE_HALF,
  ),
);
const rightLocations = computed(() =>
  locations.value.slice(
    spreadPage.value * PAGE_HALF * 2 + PAGE_HALF,
    (spreadPage.value + 1) * PAGE_HALF * 2,
  ),
);

function prevSpread() {
  if (hasPrevSpread.value) spreadPage.value--;
}
function nextSpread() {
  if (hasNextSpread.value) spreadPage.value++;
}

// All state in the URL:
//   locationId = current map being viewed
//   stack      = comma-separated list of parent location IDs (for breadcrumb)
const activeLocationId = computed(() =>
  route.query.locationId ? Number(route.query.locationId) : null,
);
const locationStack = computed<number[]>(() => {
  const s = route.query.stack as string;
  if (!s) return [];
  return s.split(",").map(Number).filter(Boolean);
});
const activeLocationName = computed(
  () =>
    locations.value.find((l) => l.id === activeLocationId.value)?.name ?? "",
);

onMounted(async () => {
  await store.loadAll(campaignId);
  if (window.dmforge) {
    const camps = await window.dmforge.campaigns.list();
    campaignName.value =
      camps.find((c: any) => c.id === campaignId)?.name ?? "Campaign";
  }
  if (activeLocationId.value) hideSpine();
});

watch(activeLocationId, (val) => {
  if (val) hideSpine();
  else showSpine();
});

onUnmounted(() => showSpine());

function selectLocation(id: number) {
  router.push({ query: { locationId: String(id) } });
}

function openLocation(loc: any) {
  router.push({ query: { locationId: String(loc.id) } });
}

function goBack() {
  // If we're deep in a stack, go back up one level
  if (locationStack.value.length > 0) {
    const newStack = locationStack.value.slice(0, -1);
    const parentId = locationStack.value[locationStack.value.length - 1];
    router.push({
      query: {
        locationId: String(parentId),
        ...(newStack.length ? { stack: newStack.join(",") } : {}),
      },
    });
  } else if (activeLocationId.value) {
    router.push({ query: {} });
  } else {
    router.back();
  }
}

function onDrillDown(fromId: number, toId: number) {
  const newStack = [...locationStack.value, fromId];
  router.push({
    query: {
      locationId: String(toId),
      stack: newStack.join(","),
    },
  });
}

function onNavigateCrumb(index: number) {
  // index is the position in the breadcrumb to go back to
  const targetId = locationStack.value[index];
  const newStack = locationStack.value.slice(0, index);
  router.push({
    query: {
      locationId: String(targetId),
      ...(newStack.length ? { stack: newStack.join(",") } : {}),
    },
  });
}

function openNotes(loc: any) {
  router.push(`/campaign/${campaignId}/notes?id=${loc.id}&type=location`);
}

async function createLocation() {
  const e = await store.createEntity(campaignId, "location", "New Location");
  router.push(`/campaign/${campaignId}/notes?id=${e.id}&type=location`);
}

function navigateToEntity(entity: any) {
  router.push(
    `/campaign/${campaignId}/notes?id=${entity.id}&type=${entity.type}`,
  );
}

function locAttrs(loc: any) {
  return (loc.attributes ?? {}) as any;
}
function locLogo(loc: any): string | null {
  const a = locAttrs(loc);
  return a.logoSource || null;
}
function locMap(loc: any): string | null {
  const a = locAttrs(loc);
  return a.imageSource || null;
}
function pinCount(loc: any): number {
  return (locAttrs(loc).mapPins ?? []).length;
}
function formatDate(dt: string) {
  if (!dt) return "";
  const diff = Date.now() - new Date(dt).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
</script>

<style scoped>
.map-folio {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  overflow: visible;
}

.map-view-shell {
  position: relative;
  flex: 1;
  overflow: visible;
  padding: 14px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.map-sheet {
  position: absolute;
  border-radius: 2px;
  pointer-events: none;
}

.map-sheet-3 {
  inset: 10px 12px 8px 12px;
  background-color: #b8ac96;
  background-image: var(--paper);
  background-blend-mode: multiply;
  transform: rotate(1.5deg) translateX(10px);
  transform-origin: top center;
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.45);
}

.map-sheet-2 {
  inset: 10px 12px 8px 12px;
  background-color: #cdc09e;
  background-image: var(--paper);
  background-blend-mode: multiply;
  transform: rotate(-1.0deg) translateX(-8px);
  transform-origin: top center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.32);
}

.map-view {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  border-radius: 2px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.4);
}

.map-view-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  border-bottom: 1px dashed var(--parch-line);
  flex-shrink: 0;
  box-shadow: 0 1px 0 rgba(184, 134, 11, 0.18);
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

/* Open book spread */
.leaf-inner {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 12px;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
}

.leaf-footer {
  padding: 10px 28px 16px;
  border-top: 1px dashed var(--parch-line);
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
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

/* Entry */
.entry {
  align-items: flex-start;
  border-left: 2px solid transparent;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.entry:hover {
  border-left-color: color-mix(
    in srgb,
    var(--et-color, var(--gold)) 40%,
    transparent
  );
  background: color-mix(in srgb, var(--et-color, var(--gold)) 4%, transparent);
}

.entry-num {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--ink-ghost);
  opacity: 0.4;
  width: 18px;
  flex-shrink: 0;
  text-align: right;
  padding-top: 2px;
  line-height: 1;
}
.entry-icon {
  width: 32px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.entry-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--et-color, var(--gold)) 13%, transparent);
  border: 1px solid
    color-mix(in srgb, var(--et-color, var(--gold)) 30%, transparent);
  overflow: hidden;
  flex-shrink: 0;
}
.entry-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}
.entry-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.entry-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.entry-name {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.entry-leader {
  flex: 1;
  min-width: 8px;
  border-bottom: 1px dotted var(--ink-ghost);
  opacity: 0.3;
  align-self: center;
  position: relative;
  top: 1px;
}
.entry-date {
  font-family: var(--font-head);
  font-size: 8px;
  color: var(--ink-ghost);
  letter-spacing: 0.05em;
  flex-shrink: 0;
  white-space: nowrap;
}
.entry-attrs {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 5px;
  padding-bottom: 3px;
  overflow: hidden;
}

.ea-pill {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 7px 2px 5px;
  border: 1px solid currentColor;
  border-radius: 2px;
  flex-shrink: 0;
  white-space: nowrap;
}
.ea-bool {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 7px 2px 5px;
  border-radius: 2px;
  color: var(--gold);
  background: rgba(184, 134, 11, 0.08);
  border: 1px solid rgba(184, 134, 11, 0.3);
  flex-shrink: 0;
}

/* Pagination footer */
.leaf-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 14px;
}
.leaf-footer--right {
  justify-content: flex-end;
}
.leaf-footer .leaf-new {
  flex: 1;
  width: auto;
}
.leaf-nav-btn {
  width: 26px;
  height: 26px;
  border-radius: 2px;
  background: none;
  border: 1px solid var(--parch-line);
  color: var(--ink-ghost);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.leaf-nav-btn:hover:not(:disabled) {
  border-color: var(--ink-faded);
  color: var(--ink);
}
.leaf-nav-btn:disabled {
  opacity: 0.25;
  cursor: default;
}
.leaf-folio-num {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
  letter-spacing: 0.12em;
  white-space: nowrap;
}
</style>
