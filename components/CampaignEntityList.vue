<template>
  <div class="entity-folio">

    <!-- Page header -->
    <div class="page-header">
      <div class="phr-row">
        <div>
          <div class="page-chapter-num">{{ campaignName }}</div>
          <h1 class="page-title">{{ typeConfig?.plural }}</h1>
        </div>
        <div v-if="hasViewToggle" class="phr-tools">
          <button class="view-btn" :class="{ active: viewMode === 'list' }"
            @click="setView('list')" title="List view">
            <OhVueIcon name="md-menubook" scale="0.85" />
          </button>
          <button v-if="type === 'event'" class="view-btn"
            :class="{ active: viewMode === 'timeline' }"
            @click="setView('timeline')" title="Timeline">
            <OhVueIcon name="md-history" scale="0.85" />
          </button>
          <button v-if="type === 'session'" class="view-btn"
            :class="{ active: viewMode === 'log' }"
            @click="setView('log')" title="Session log">
            <OhVueIcon name="gi-book-aura" scale="0.85" />
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Timeline view (events only) ─────────────────────────── -->
    <div v-if="viewMode === 'timeline'" class="open-book">
      <div class="book-stack book-stack--full">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--full">
          <div class="tl-outer" ref="timelineRef">
            <div v-if="!timelineEvents.length" class="tl-empty">
              <OhVueIcon name="gi-sands-of-time" scale="3" style="opacity:0.08;margin-bottom:12px" />
              <em>No events recorded yet.</em>
            </div>
            <template v-else>
              <div class="tl-track">
                <div v-for="(ev, i) in timelineEvents" :key="ev.id"
                  class="tl-event" :class="i % 2 === 0 ? 'tl-event--above' : 'tl-event--below'"
                  @click="openEntry(ev)">
                  <div class="tl-stem" />
                  <div class="tl-node" :style="{ background: sigNodeColor(ev.attributes?.significance) }" />
                  <div class="tl-card">
                    <div class="tl-card-date">{{ ev.attributes?.date || '— undated —' }}</div>
                    <div class="tl-card-name">{{ ev.name }}</div>
                    <div v-if="ev.attributes?.location" class="tl-card-loc">{{ ev.attributes.location }}</div>
                    <span v-if="ev.attributes?.significance" class="tl-card-sig"
                      :style="{ color: sigNodeColor(ev.attributes.significance), borderColor: sigNodeColor(ev.attributes.significance) + '66' }">
                      {{ ev.attributes.significance }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-if="timelineOverflows" class="tl-scroll-hint">← scroll →</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Session log view (sessions only) ─────────────────────── -->
    <div v-else-if="viewMode === 'log'" class="open-book">
      <div class="book-stack book-stack--full">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--full">
          <div class="session-log">
            <div v-if="!logSessions.length" class="slog-empty-state">
              <OhVueIcon name="gi-book-aura" scale="3" style="opacity:0.08;margin-bottom:12px" />
              <em>No sessions recorded yet.</em>
            </div>
            <div v-for="sess in logSessions" :key="sess.id" class="slog-chapter">
              <div class="slog-header" @click="toggleExpand(sess.id)">
                <span class="slog-num">{{ sess.attributes?.sessionNumber ? 'Session ' + sess.attributes.sessionNumber : '—' }}</span>
                <span class="slog-bullet">·</span>
                <span class="slog-title">{{ sess.name }}</span>
                <span class="slog-spacer" />
                <span v-if="sess.attributes?.date" class="slog-date">{{ formatSessionDate(sess.attributes.date) }}</span>
                <span v-if="sess.attributes?.mode" class="slog-status"
                  :style="{ color: sessionStatusColor(sess.attributes.mode), borderColor: sessionStatusColor(sess.attributes.mode) + '66' }">
                  ●&thinsp;{{ sess.attributes.mode }}
                </span>
              </div>
              <div class="slog-rule" />
              <div class="slog-body" :class="{ 'slog-body--expanded': expandedIds.has(sess.id) }">
                <div v-if="sess.attributes?.scriptContent" class="slog-content"
                  v-html="renderSessionNotes(sess.attributes.scriptContent)" />
                <div v-else class="slog-no-notes"><em>No live notes for this session.</em></div>
                <div v-if="!expandedIds.has(sess.id) && sess.attributes?.scriptContent" class="slog-fade" />
              </div>
              <div class="slog-footer">
                <button v-if="sess.attributes?.scriptContent" class="slog-expand-btn"
                  @click.stop="toggleExpand(sess.id)">
                  {{ expandedIds.has(sess.id) ? '▲ Collapse' : '▼ Expand' }}
                </button>
                <span class="slog-footer-spacer" />
                <button class="slog-readmore-btn" @click.stop="openEntry(sess)">Read more →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Standard list view ───────────────────────────────────── -->
    <div v-else class="open-book">

      <!-- Left page -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <div class="leaf-inner">
            <div class="leaf-header">
              <span class="leaf-type" :style="{ color: typeConfig?.color }">{{ typeConfig?.plural }}</span>
              <span class="leaf-count">{{ entries.length }} entries</span>
            </div>
            <div v-for="entry in pageLeftEntries" :key="entry.id" class="entry" @click="openEntry(entry)">
              <div class="entry-icon">
                <OhVueIcon :name="typeConfig?.defaultIcon ?? 'gi-scroll-unfurled'" scale="0.85"
                  :style="{ color: typeConfig?.color }" />
              </div>
              <span class="entry-name">{{ entry.name }}</span>
              <span class="entry-dots" />
              <span class="entry-date">{{ formatDateShort(entry.updatedAt) }}</span>
              <div class="entry-actions" @click.stop>
                <button class="entry-act entry-act--del" @click.stop="deleteEntry(entry.id)">
                  <OhVueIcon name="md-delete" scale="0.75" />
                </button>
              </div>
            </div>
            <div v-if="!entries.length" class="leaf-empty">
              <OhVueIcon :name="typeConfig?.defaultIcon ?? 'gi-scroll-unfurled'" scale="2.5"
                style="opacity:0.07;margin-bottom:10px" />
              <em>No {{ typeConfig?.plural?.toLowerCase() }} yet.</em>
            </div>
          </div>
          <div class="leaf-footer">
            <button class="leaf-new" @click="createEntry()">
              <span class="leaf-new-line-l"></span>
              <span class="leaf-new-label">✦ New {{ typeConfig?.label }} ✦</span>
              <span class="leaf-new-line-r"></span>
            </button>
            <div class="leaf-nav">
              <button class="leaf-nav-btn" :disabled="currentSpread === 1" @click="currentSpread--">‹</button>
              <span class="leaf-nav-page">{{ leftPageNum }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="book-binding"></div>

      <!-- Right page -->
      <div class="book-stack book-stack--right">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--right">
          <div class="leaf-inner">
            <div class="leaf-header leaf-header--right">
              <span class="leaf-folio">continued</span>
            </div>
            <div v-for="entry in pageRightEntries" :key="entry.id" class="entry" @click="openEntry(entry)">
              <div class="entry-icon">
                <OhVueIcon :name="typeConfig?.defaultIcon ?? 'gi-scroll-unfurled'" scale="0.85"
                  :style="{ color: typeConfig?.color }" />
              </div>
              <span class="entry-name">{{ entry.name }}</span>
              <span class="entry-dots" />
              <span class="entry-date">{{ formatDateShort(entry.updatedAt) }}</span>
              <div class="entry-actions" @click.stop>
                <button class="entry-act entry-act--del" @click.stop="deleteEntry(entry.id)">
                  <OhVueIcon name="md-delete" scale="0.75" />
                </button>
              </div>
            </div>
            <div v-if="pageRightEntries.length === 0 && entries.length > 0" class="leaf-empty">
              <em style="opacity:0.35">— end of entries —</em>
            </div>
          </div>
          <div class="leaf-footer leaf-footer--right">
            <div class="leaf-nav leaf-nav--right">
              <span class="leaf-nav-page">{{ rightPageNum }}</span>
              <button class="leaf-nav-btn" :disabled="currentSpread === totalSpreads" @click="currentSpread++">›</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { useCampaignEntity } from '~/composables/useCampaignEntity'
import type { EntityType } from '~/types/entities'
import { dbApi } from '~/composables/useDb'

const props = defineProps<{ type: EntityType }>()

const {
  campaignId, typeConfig,
  entries,
  openEntry, createEntry, deleteEntry,
  ensureLoaded, formatDateShort,
} = useCampaignEntity(props.type)

// ── Pagination ───────────────────────────────────────────────────────
const ITEMS_PER_SIDE = 10
const ITEMS_PER_SPREAD = ITEMS_PER_SIDE * 2
const currentSpread = ref(1)

const totalSpreads = computed(() =>
  Math.max(1, Math.ceil(entries.value.length / ITEMS_PER_SPREAD))
)
const leftPageNum = computed(() => (currentSpread.value - 1) * 2 + 1)
const rightPageNum = computed(() => (currentSpread.value - 1) * 2 + 2)

const pageLeftEntries = computed(() => {
  const start = (currentSpread.value - 1) * ITEMS_PER_SPREAD
  return entries.value.slice(start, start + ITEMS_PER_SIDE)
})
const pageRightEntries = computed(() => {
  const start = (currentSpread.value - 1) * ITEMS_PER_SPREAD + ITEMS_PER_SIDE
  return entries.value.slice(start, start + ITEMS_PER_SIDE)
})

watch(totalSpreads, (total) => {
  if (currentSpread.value > total) currentSpread.value = total
})

const campaignName = ref('')
const hasViewToggle = props.type === 'event' || props.type === 'session'

// ── View mode (events / sessions only) ──────────────────────────────
const localKey = `dmstome.${props.type}.view.${typeof window !== 'undefined' ? Number(useRoute().params.id) : 0}`
const viewMode = ref<string>(
  hasViewToggle && import.meta.client
    ? (localStorage.getItem(localKey) || 'list')
    : 'list'
)

function setView(mode: string) {
  viewMode.value = mode
  if (import.meta.client) localStorage.setItem(localKey, mode)
}

// ── Timeline (events) ────────────────────────────────────────────────
const timelineRef = ref<HTMLElement | null>(null)
const timelineOverflows = ref(false)

const timelineEvents = computed(() => {
  if (props.type !== 'event') return []
  return entries.value.slice().sort((a, b) => {
    const da: string = (a.attributes as any)?.date ?? ''
    const db: string = (b.attributes as any)?.date ?? ''
    if (!da && !db) return a.id - b.id
    if (!da) return 1
    if (!db) return -1
    return da.localeCompare(db)
  })
})

function sigNodeColor(sig: string | undefined): string {
  return ({ critical: 'var(--blood)', major: 'var(--gold)', minor: 'var(--ink-ghost)' } as any)[sig ?? ''] ?? 'var(--ink-ghost)'
}

watch([viewMode, () => timelineEvents.value.length], () => {
  if (viewMode.value !== 'timeline') return
  nextTick(() => {
    if (!timelineRef.value) return
    timelineOverflows.value = timelineRef.value.scrollWidth > timelineRef.value.clientWidth + 2
  })
})

// ── Session log ──────────────────────────────────────────────────────
const expandedIds = ref<Set<number>>(new Set())
const mdParser = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true })

const logSessions = computed(() => {
  if (props.type !== 'session') return []
  return entries.value.slice().sort((a, b) => {
    const na = parseInt((a.attributes as any)?.sessionNumber ?? '', 10)
    const nb = parseInt((b.attributes as any)?.sessionNumber ?? '', 10)
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb
    return a.id - b.id
  })
})

function toggleExpand(id: number) {
  const s = new Set(expandedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedIds.value = s
}

function renderSessionNotes(content: string) {
  return mdParser.render(content || '')
}

function sessionStatusColor(mode: string | undefined): string {
  return ({ planning: '#6b9fe8', running: '#5a8a3a', finished: '#b87de8' } as any)[mode ?? ''] ?? 'var(--ink-ghost)'
}

function formatSessionDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-US', opts)
}

// ── Load ─────────────────────────────────────────────────────────────
onMounted(async () => {
  const [camp] = await Promise.all([
    dbApi.campaigns.get(campaignId.value),
    ensureLoaded(),
  ])
  campaignName.value = camp?.name ?? ''
})
</script>


<style scoped>
.entity-folio {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

/* Page header row (title + view toggle) */
.phr-row {
  display: flex;
  justify-content: space-between;
}

.phr-tools {
  display: flex;
  gap: 4px;
  padding-bottom: 4px;
}

.view-btn {
  width: 28px; height: 28px;
  border-radius: 3px;
  background: none;
  border: 1px solid transparent;
  color: var(--ink-ghost);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.view-btn:hover { border-color: var(--parch-dark); color: var(--ink-faded); }
.view-btn.active { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }

/* ── Pagination nav ───────────────────────────────────────────────── */
.leaf-footer--right {
  display: flex;
  justify-content: flex-end;
}

.leaf-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.leaf-nav--right {
  justify-content: flex-end;
}

.leaf-nav-btn {
  font-family: var(--font-head);
  font-size: 16px;
  line-height: 1;
  color: var(--ink-ghost);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  transition: color 0.15s;
}
.leaf-nav-btn:hover:not(:disabled) { color: var(--blood); }
.leaf-nav-btn:disabled { opacity: 0.2; cursor: default; }

.leaf-nav-page {
  font-family: 'Cinzel', var(--font-deco);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--ink-ghost);
  min-width: 16px;
  text-align: center;
}

/* ── Timeline ─────────────────────────────────────────────────────── */
.tl-outer {
  flex: 1; overflow-x: auto; overflow-y: hidden;
  position: relative; display: flex; flex-direction: column;
}
.tl-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: var(--ink-ghost); font-family: var(--font-body);
  font-size: 14px; font-style: italic;
}
.tl-track {
  position: relative; display: flex; align-items: stretch;
  height: 360px; min-width: max-content; padding: 0 80px; flex-shrink: 0;
}
.tl-track::before {
  content: ''; position: absolute; left: 0; right: 0; top: 50%;
  height: 1px; background: var(--ink-faded); opacity: 0.45; pointer-events: none;
}
.tl-event { position: relative; width: 180px; flex-shrink: 0; cursor: pointer; }
.tl-node {
  position: absolute; left: calc(50% - 5px); top: calc(50% - 5px);
  width: 10px; height: 10px; border-radius: 50%;
  border: 1.5px solid var(--parch); z-index: 1; transition: transform 0.15s;
}
.tl-event:hover .tl-node { transform: scale(1.5); }
.tl-stem {
  position: absolute; left: calc(50% - 0.5px); width: 0;
  border-left: 1px dashed var(--parch-line); opacity: 0.8;
}
.tl-event--above .tl-stem { bottom: calc(50% + 5px); height: 28px; }
.tl-event--below .tl-stem { top: calc(50% + 5px); height: 28px; }
.tl-card {
  position: absolute; left: 50%; transform: translateX(-50%);
  width: 152px; padding: 8px 10px 7px;
  background: color-mix(in srgb, var(--parch-dark) 85%, transparent);
  border: 1px solid var(--parch-line); border-radius: 2px;
  display: flex; flex-direction: column; gap: 3px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tl-event:hover .tl-card { border-color: var(--ink-ghost); box-shadow: 0 2px 12px rgba(28,20,16,0.12); }
.tl-event--above .tl-card { bottom: calc(50% + 34px); }
.tl-event--below .tl-card { top: calc(50% + 34px); }
.tl-card-date {
  font-family: 'Cinzel', var(--font-deco); font-size: 8px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-ghost);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tl-card-name {
  font-family: 'IM Fell English', var(--font-body);
  font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.3;
}
.tl-card-loc {
  font-family: var(--font-body); font-size: 11px; color: var(--ink-ghost);
  font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tl-card-sig {
  display: inline-block; font-family: var(--font-head); font-size: 8px;
  font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  border: 1px solid; border-radius: 999px; padding: 1px 6px;
  margin-top: 2px; align-self: flex-start;
}
.tl-scroll-hint {
  text-align: center; font-family: var(--font-body); font-size: 11px;
  font-style: italic; color: var(--ink-ghost); opacity: 0.5;
  padding: 4px 0 10px; flex-shrink: 0; user-select: none;
}

/* ── Session log ──────────────────────────────────────────────────── */
.session-log {
  flex: 1; overflow-y: auto; padding: 24px 40px 40px;
}
.slog-empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 0; color: var(--ink-ghost);
  font-family: var(--font-body); font-size: 14px; font-style: italic;
}
.slog-chapter {
  max-width: 720px; margin: 0 auto 12px;
  border-top: 1.5px dashed rgba(184,134,11,0.35); padding-top: 20px;
}
.slog-chapter:first-of-type { border-top: none; padding-top: 0; }
.slog-header {
  display: flex; align-items: baseline; gap: 8px;
  cursor: pointer; user-select: none; padding-bottom: 10px;
}
.slog-num {
  font-family: 'Cinzel Decorative', var(--font-deco); font-size: 11px;
  font-weight: 700; color: rgba(139,26,26,0.55); letter-spacing: 0.06em; flex-shrink: 0;
}
.slog-bullet { color: rgba(139,26,26,0.3); font-size: 12px; flex-shrink: 0; }
.slog-title {
  font-family: 'Cinzel', var(--font-deco); font-size: 15px; font-weight: 700;
  color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
}
.slog-spacer { flex: 1; min-width: 12px; }
.slog-date {
  font-family: var(--font-head); font-size: 9px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--ink-ghost); flex-shrink: 0;
}
.slog-status {
  font-family: var(--font-head); font-size: 9px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 999px; border: 1px solid; flex-shrink: 0;
}
.slog-rule { height: 1px; background: var(--parch-line); margin-bottom: 14px; }
.slog-body { position: relative; max-height: 120px; overflow: hidden; transition: max-height 0.35s ease; }
.slog-body--expanded { max-height: 4000px; }
.slog-fade {
  position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
  background: linear-gradient(transparent, var(--parch)); pointer-events: none;
}
.slog-content { font-family: var(--font-body); font-size: 13.5px; line-height: 1.7; color: var(--ink-faded); }
.slog-content :deep(p) { margin: 0 0 0.6em; }
.slog-content :deep(h1), .slog-content :deep(h2), .slog-content :deep(h3) {
  font-family: var(--font-head); font-size: 11px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-ghost); margin: 0.9em 0 0.35em;
}
.slog-content :deep(ul), .slog-content :deep(ol) { padding-left: 1.4em; margin: 0 0 0.6em; }
.slog-content :deep(li) { margin-bottom: 0.2em; }
.slog-content :deep(strong) { color: var(--ink); font-weight: 600; }
.slog-content :deep(blockquote) {
  border-left: 2px solid rgba(184,134,11,0.4); padding-left: 12px;
  color: var(--ink-ghost); font-style: italic; margin: 0.5em 0;
}
.slog-content :deep(hr) { border: none; border-top: 1px dashed var(--parch-line); margin: 0.8em 0; }
.slog-no-notes { font-family: var(--font-body); font-size: 13px; color: var(--ink-ghost); font-style: italic; }
.slog-footer { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-bottom: 4px; }
.slog-footer-spacer { flex: 1; }
.slog-expand-btn {
  font-family: var(--font-head); font-size: 8px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-ghost);
  background: none; border: none; cursor: pointer; padding: 0; transition: color 0.15s;
}
.slog-expand-btn:hover { color: var(--gold); }
.slog-readmore-btn {
  font-family: var(--font-head); font-size: 8px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; color: rgba(139,26,26,0.6);
  background: none; border: none; cursor: pointer; padding: 0; transition: color 0.15s;
}
.slog-readmore-btn:hover { color: var(--blood); }
</style>
