<template>
  <div class="bm-ribbon">
    <div class="bm-track">

      <!-- Add / remove bookmark for the current page — always leftmost -->
      <button
        class="bm-tab bm-tab--add"
        :class="{ 'bm-tab--add-active': isCurrentPageBookmarked }"
        :title="isCurrentPageBookmarked ? 'Remove bookmark for this page' : 'Bookmark this page'"
        @click="toggleCurrentPage"
      >
        <OhVueIcon
          :name="isCurrentPageBookmarked ? 'md-bookmarkadded' : 'md-bookmarkborder'"
          scale="0.8"
        />
      </button>

      <div class="bm-sep" />

      <!-- Saved bookmarks -->
      <div
        v-for="(bm, i) in bookmarks"
        :key="bm.id"
        class="bm-tab"
        :class="{ 'bm-tab--active': isCurrentRoute(bm.route) }"
        :style="{ '--bm-color': bm.color }"
        :title="bm.label"
        draggable="true"
        @click="navigate(bm)"
        @dragstart="onDragStart(i)"
        @dragover.prevent="onDragOver(i)"
        @drop="onDrop(i)"
        @dragend="onDragEnd"
      >
        <OhVueIcon :name="bm.icon" scale="0.7" class="bm-icon" />
        <span class="bm-label">{{ bm.label }}</span>
        <button
          class="bm-remove"
          :title="`Remove '${bm.label}'`"
          @click.stop="removeBookmark(bm.id)"
        >×</button>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
import { useBookmarks } from '~/composables/useBookmarks'
import { useNotesStore } from '~/stores/notes'
import { useEncounterStore } from '~/stores/encounter'

const router = useRouter()
const route = useRoute()
const { bookmarks, removeBookmark, reorder, isBookmarked, bookmarkPage, bookmarkEntity } = useBookmarks()
const notesStore = useNotesStore()
const encounterStore = useEncounterStore()

// Ribbon is permanent — always push content down by 32px
if (import.meta.client) {
  document.body.classList.add('bm-ribbon-active')
}

function navigate(bm: { route: string }) {
  router.push(bm.route)
}

function isCurrentRoute(bmRoute: string): boolean {
  return route.path === bmRoute.split('?')[0]
}

// ── Add / remove bookmark for current page ────────────────────────
const ENTITY_SEGMENTS = new Set(['npcs', 'locations', 'items', 'factions', 'quests', 'events', 'sessions', 'notes'])

const currentEntity = computed(() => {
  // Only match chronicle entity pages: /campaign/:cid/(npcs|locations|…)/:entityId
  const m = route.path.match(/\/campaign\/\d+\/(\w+)\/(\d+)$/)
  if (!m || !ENTITY_SEGMENTS.has(m[1])) return null
  return notesStore.entities.find(e => e.id === Number(m[2])) ?? null
})

const isCurrentPageBookmarked = computed(() => isBookmarked(route.path))

function toggleCurrentPage() {
  if (isCurrentPageBookmarked.value) {
    const bm = bookmarks.value.find(b => b.route === route.path)
    if (bm) removeBookmark(bm.id)
    return
  }
  const entity = currentEntity.value
  if (entity) {
    bookmarkEntity({ id: entity.id, name: entity.name, type: entity.type, campaignId: entity.campaignId })
    return
  }
  // Encounter page: /encounter/:id
  const encounterMatch = route.path.match(/^\/encounter\/(\d+)/)
  if (encounterMatch && encounterStore.current) {
    bookmarkPage(route.path, encounterStore.current.name, 'gi-broadsword', 'var(--blood)')
    return
  }
  const label = (document.querySelector('.page-title') as HTMLElement)?.textContent?.trim()
    ?? route.path.split('/').filter(s => Boolean(s) && isNaN(Number(s))).pop()
    ?? 'Page'
  bookmarkPage(route.path, label, 'md-bookmark', 'var(--gold)')
}

// ── Drag-to-reorder ───────────────────────────────────────────────
const draggingIndex = ref<number | null>(null)
function onDragStart(i: number) { draggingIndex.value = i }
function onDragOver(i: number) {
  if (draggingIndex.value === null || draggingIndex.value === i) return
  reorder(draggingIndex.value, i)
  draggingIndex.value = i
}
function onDrop(_i: number) {}
function onDragEnd() { draggingIndex.value = null }
</script>


<style scoped>
/* ── Ribbon bar ──────────────────────────────────────────────────── */
.bm-ribbon {
  position: fixed;
  top: 0;
  left: 64px;
  right: 0;
  height: 32px;
  z-index: var(--z-sidebar);
  background: rgba(22, 14, 8, 0.96);
  border-bottom: 1px solid rgba(0, 0, 0, 0.55);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}

/* ── Track — stretches tabs to full ribbon height ────────────────── */
.bm-track {
  display: flex;
  align-items: stretch;
  height: 100%;
}

/* ── Base tab ────────────────────────────────────────────────────── */
.bm-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 11px;
  min-width: 0;
  max-width: 160px;
  background: transparent;
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  /* Colored top stripe — the "ribbon" marker */
  border-top: 2px solid var(--bm-color, rgba(255, 255, 255, 0.08));
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, max-width 0.15s;
  position: relative;
  overflow: hidden;
}

.bm-tab:hover {
  background: rgba(255, 255, 255, 0.07);
  max-width: 200px;
}

.bm-tab--active {
  background: rgba(255, 255, 255, 0.1);
}

/* ── Add-bookmark button ─────────────────────────────────────────── */
.bm-tab--add {
  --bm-color: rgba(184, 134, 11, 0.45);
  min-width: 38px;
  max-width: 38px;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(184, 134, 11, 0.55);
}
.bm-tab--add:hover {
  --bm-color: var(--gold);
  background: rgba(184, 134, 11, 0.1);
  color: var(--gold);
  max-width: 38px;
}
.bm-tab--add-active {
  --bm-color: var(--gold);
  color: var(--gold);
  background: rgba(184, 134, 11, 0.1);
}
.bm-tab--add-active:hover {
  background: rgba(184, 134, 11, 0.16);
}

/* ── Separator between add-btn and bookmarks ─────────────────────── */
.bm-sep {
  width: 1px;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  align-self: stretch;
}

/* ── Tab contents ────────────────────────────────────────────────── */
.bm-icon {
  color: rgba(232, 220, 197, 0.55);
  flex-shrink: 0;
  transition: color 0.15s;
}
.bm-tab:hover .bm-icon,
.bm-tab--active .bm-icon { color: rgba(232, 220, 197, 0.95); }

.bm-label {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(232, 220, 197, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  transition: color 0.15s;
}
.bm-tab:hover .bm-label { color: rgba(232, 220, 197, 0.85); }
.bm-tab--active .bm-label { color: rgba(232, 220, 197, 1); }

.bm-remove {
  display: none;
  background: none;
  border: none;
  color: rgba(232, 220, 197, 0.35);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 0 0 0 2px;
  flex-shrink: 0;
  transition: color 0.15s;
}
.bm-remove:hover { color: var(--blood); }
.bm-tab:hover .bm-remove { display: block; }
</style>
