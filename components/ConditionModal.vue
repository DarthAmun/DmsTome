<template>
  <Teleport to="body">
    <div v-if="open && token" class="pv-dialog-mask" style="z-index:var(--z-modal-top)" @click.self="$emit('close')">
      <div class="pv-dialog cm-dialog" @keydown.esc="$emit('close')">

        <!-- Header -->
        <div class="cm-header">
          <span class="cm-title">Conditions</span>
          <span class="cm-sub">— {{ token.label || token.name }}</span>
          <button class="cm-close" @click="$emit('close')">✕</button>
        </div>

        <!-- Search -->
        <div class="cm-search-wrap">
          <OhVueIcon name="fa-search" scale="0.75" class="cm-search-icon" />
          <input
            ref="searchEl"
            v-model="search"
            class="cm-search-input"
            placeholder="Search conditions…"
            autocomplete="off"
          />
          <button v-if="search" class="cm-search-clear" @click="search = ''">✕</button>
        </div>

        <div class="cm-body">

          <!-- Active conditions -->
          <div v-if="localConditions.length" class="cm-section">
            <div class="cm-section-header">
              <span class="cm-section-label cm-section-label--active">Active</span>
              <span class="cm-section-count">{{ localConditions.length }}</span>
            </div>
            <div class="cm-active-list">
              <div v-for="(cond, idx) in localConditions" :key="cond.name + idx" class="cm-active-item">
                <div class="cm-active-row">
                  <span
                    class="cm-active-name"
                    title="Open full condition details"
                    @click="emit('show-condition-panel', cond.name, cond.value)"
                  >{{ cond.name }}</span>
                  <div class="cm-active-stepper">
                    <button class="cond-ctrl-btn" @click="adjustValue(idx, -1)">−</button>
                    <span class="cm-val-display">{{ cond.value !== null ? cond.value : '—' }}</span>
                    <button class="cond-ctrl-btn" @click="adjustValue(idx, 1)">+</button>
                  </div>
                  <button class="condition-remove" @click="removeCondition(idx)">✕</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Available conditions -->
          <div class="cm-section">
            <div class="cm-section-header">
              <span class="cm-section-label cm-section-label--avail">Available</span>
              <span class="cm-section-count">{{ filteredAvailable.length }}</span>
            </div>

            <div v-if="loading" class="cm-loading">
              <OhVueIcon name="md-autorenew" scale="1.2" class="cm-spin" />
            </div>
            <template v-else>
              <!-- Free-text "add custom" entry — shown when search doesn't match any known condition -->
              <button v-if="customConditionEntry" class="cm-add-custom" @click="addCustomCondition">
                <OhVueIcon name="md-add" scale="0.85" style="flex-shrink:0" />
                Add "<strong>{{ customConditionEntry }}</strong>" as condition
              </button>

              <div v-if="!filteredAvailable.length && !customConditionEntry" class="cm-empty">
                {{ search ? `No matches for "${search}"` : 'No conditions in linked system' }}
              </div>
              <div v-else class="cm-list">
                <div
                  v-for="cond in filteredAvailable"
                  :key="cond.name"
                  class="cm-row"
                  :class="{ 'cm-row--active': isActive(cond.name) }"
                >
                  <div class="cm-row-body">
                    <div class="cm-row-top">
                      <span class="cm-cond-name">{{ cond.name }}</span>
                      <OhVueIcon
                        v-if="isActive(cond.name)"
                        name="md-check"
                        scale="0.85"
                        class="cm-active-check"
                      />
                      <button class="cm-toggle-btn" @click="toggleCondition(cond)">
                        {{ isActive(cond.name) ? 'Remove' : 'Add' }}
                      </button>
                    </div>
                    <span v-if="cond.summary" class="cm-cond-summary">{{ cond.summary }}</span>
                    <span v-if="cond.description" class="cm-cond-desc">{{ cond.description }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>

        </div><!-- /cm-body -->

        <!-- Footer -->
        <div class="cm-footer">
          <button class="link-btn link-btn--link" @click="$emit('close')">Done</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { EncounterToken, TokenCondition } from '~/stores/encounter'
import { getDb } from '~/composables/useDb'

const props = defineProps<{
  token: EncounterToken | null
  systemId: number | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  update: [tokenId: number, conditions: TokenCondition[]]
  'show-condition-panel': [name: string, value: number | null]
}>()

// ── State ──────────────────────────────────────────────────────────────────
const search = ref('')
const searchEl = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const localConditions = ref<TokenCondition[]>([])

interface AvailCondition {
  name: string
  summary: string
  hasValue: boolean
  description?: string
}

const availableConditions = ref<AvailCondition[]>([])

// ── Known valued conditions (fallback list) ────────────────────────────────
const VALUED_CONDITIONS = new Set([
  'Clumsy', 'Confused', 'Doomed', 'Drained', 'Dying', 'Enfeebled',
  'Frightened', 'Sickened', 'Slowed', 'Stunned', 'Stupefied', 'Wounded',
  'Blinded', 'Controlled', 'Dazzled', 'Deafened', 'Fatigued', 'Grabbed',
  'Immobilized', 'Paralyzed', 'Petrified', 'Quickened', 'Restrained',
])

const FALLBACK_CONDITIONS: AvailCondition[] = [
  { name: 'Blinded',       summary: 'Cannot see; automatic failure on sight-based checks.',  hasValue: false },
  { name: 'Broken',        summary: 'Item is non-functional until repaired.',                hasValue: false },
  { name: 'Clumsy',        summary: 'Penalty to Dex-based checks and AC.',                  hasValue: true  },
  { name: 'Confused',      summary: 'Acts randomly; may attack allies.',                     hasValue: false },
  { name: 'Controlled',    summary: 'Another creature dictates actions.',                    hasValue: false },
  { name: 'Dazzled',       summary: 'Everything is concealed.',                              hasValue: false },
  { name: 'Deafened',      summary: 'Cannot hear; -2 to Initiative; spell failure chance.',  hasValue: false },
  { name: 'Doomed',        summary: 'Dying value to reach death is reduced.',                hasValue: true  },
  { name: 'Drained',       summary: 'Penalty to Con-based checks; lose max HP.',            hasValue: true  },
  { name: 'Dying',         summary: 'Unconscious and approaching death.',                    hasValue: true  },
  { name: 'Encumbered',    summary: 'Carrying too much; –5 ft Speed, clumsy 1.',            hasValue: false },
  { name: 'Enfeebled',     summary: 'Penalty to Str-based checks and damage.',              hasValue: true  },
  { name: 'Fascinated',    summary: 'Distracted by a subject; –2 Perception.',              hasValue: false },
  { name: 'Fatigued',      summary: '\u20131 AC and saves; cannot use exploration activities.',  hasValue: false },
  { name: 'Flat-Footed',   summary: '–2 circumstance penalty to AC.',                       hasValue: false },
  { name: 'Fleeing',       summary: 'Must spend each action moving away from source.',      hasValue: false },
  { name: 'Frightened',    summary: 'Penalty to all checks; reduces each turn.',            hasValue: true  },
  { name: 'Grabbed',       summary: 'Immobilized and flat-footed.',                         hasValue: false },
  { name: 'Hidden',        summary: 'Location unknown; must succeed on DC 11 flat check.',  hasValue: false },
  { name: 'Immobilized',   summary: 'Cannot move voluntarily.',                             hasValue: false },
  { name: 'Invisible',     summary: 'Cannot be seen; harder to detect.',                    hasValue: false },
  { name: 'Observed',      summary: 'Fully visible to others.',                             hasValue: false },
  { name: 'Paralyzed',     summary: 'Cannot act; flat-footed.',                             hasValue: false },
  { name: 'Petrified',     summary: 'Turned to stone; object immunities.',                  hasValue: false },
  { name: 'Poisoned',      summary: 'Afflicted by a poison; takes stage effects.',          hasValue: true  },
  { name: 'Prone',         summary: '–2 to attack rolls; melee +1 vs you, ranged –2 vs you.', hasValue: false },
  { name: 'Quickened',     summary: 'Gain 1 extra action per turn.',                        hasValue: false },
  { name: 'Restrained',    summary: 'Grabbed and immobilized; cannot use Fly.',             hasValue: false },
  { name: 'Sickened',      summary: 'Penalty to all checks and DCs.',                       hasValue: true  },
  { name: 'Slowed',        summary: 'Fewer actions per turn.',                              hasValue: true  },
  { name: 'Stunned',       summary: 'Lose actions; if stunned X lose X actions.',           hasValue: true  },
  { name: 'Stupefied',     summary: 'Penalty to Int/Wis/Cha checks; spell failure chance.', hasValue: true  },
  { name: 'Unconscious',   summary: 'Unable to act; prone, blinded, flat-footed.',          hasValue: false },
  { name: 'Undetected',    summary: 'Location unknown; attackers must guess.',               hasValue: false },
  { name: 'Unnoticed',     summary: 'Creature is completely unaware of you.',               hasValue: false },
  { name: 'Wounded',       summary: 'Dying value increases by this amount when next dying.', hasValue: true  },
]

// ── Load conditions from DB or fall back ──────────────────────────────────
async function loadConditions() {
  loading.value = true
  availableConditions.value = []
  try {
    if (props.systemId) {
      const db = getDb()

      // Discover entity type IDs that look like conditions in this system
      const sys = await db.systems.get(props.systemId)
      const entityTypes: any[] = sys
        ? (typeof sys.entityTypes === 'string' ? JSON.parse(sys.entityTypes || '[]') : (sys.entityTypes ?? []))
        : []
      const condTypeIds = entityTypes
        .filter((et: any) => /condition/i.test(et.id ?? '') || /condition/i.test(et.name ?? ''))
        .map((et: any) => et.id as string)
      // Always include the bare 'condition' id as fallback
      if (!condTypeIds.includes('condition')) condTypeIds.push('condition')

      const recs = await db.records
        .where('systemId').equals(props.systemId)
        .filter((r: any) => condTypeIds.includes(r.entityTypeId))
        .toArray()

      if (recs.length) {
        const TEXT_KEY = /\b(description|desc|summary|effect|text|body|rules|detail)\b/i
        availableConditions.value = recs.map((r: any) => {
          const data: Record<string, any> = typeof r.data === 'string'
            ? JSON.parse(r.data || '{}')
            : (r.data ?? {})
          const summary: string = data.summary ?? data.effect ?? data.description ?? ''
          let description: string | undefined
          for (const [k, v] of Object.entries(data)) {
            if (TEXT_KEY.test(k) && typeof v === 'string' && v !== summary && v.length > summary.length) {
              description = v
              break
            }
          }
          return {
            name: r.name,
            summary,
            description,
            hasValue: data.hasValue === true || VALUED_CONDITIONS.has(r.name),
          }
        }).sort((a: AvailCondition, b: AvailCondition) => a.name.localeCompare(b.name))
        return
      }
    }
    // No system linked or system has no condition records — use built-in list
    availableConditions.value = FALLBACK_CONDITIONS
  } finally {
    loading.value = false
  }
}

// ── Computed ───────────────────────────────────────────────────────────────
const filteredAvailable = computed(() => {
  const q = search.value.toLowerCase()
  return q
    ? availableConditions.value.filter(c => c.name.toLowerCase().includes(q))
    : availableConditions.value
})

// Shows an "Add 'X'" prompt when the search text doesn't exactly match any known condition
const customConditionEntry = computed<string | null>(() => {
  const q = search.value.trim()
  if (!q) return null
  if (availableConditions.value.some(c => c.name.toLowerCase() === q.toLowerCase())) return null
  return q
})

function isActive(name: string) {
  return localConditions.value.some(c => c.name === name)
}

// ── Mutations — immediately emitted ───────────────────────────────────────
function emit_update() {
  if (!props.token) return
  emit('update', props.token.id, [...localConditions.value])
}

function addCustomCondition() {
  const name = customConditionEntry.value
  if (!name || isActive(name)) return
  localConditions.value.push({ name, value: null })
  emit_update()
  search.value = ''
}

function toggleCondition(cond: AvailCondition) {
  const idx = localConditions.value.findIndex(c => c.name === cond.name)
  if (idx !== -1) {
    localConditions.value.splice(idx, 1)
  } else {
    localConditions.value.push({
      name: cond.name,
      value: cond.hasValue ? 1 : null,
    })
  }
  emit_update()
}

function removeCondition(idx: number) {
  localConditions.value.splice(idx, 1)
  emit_update()
}

function adjustValue(idx: number, delta: number) {
  const c = localConditions.value[idx]
  if (c.value === null) {
    // Null means "no stage" — + assigns stage 1, − does nothing
    if (delta > 0) {
      localConditions.value[idx] = { ...c, value: 1 }
      emit_update()
    }
    return
  }
  const next = c.value + delta
  // Clamp at 1 minimum — use the ✕ button to fully remove the condition
  localConditions.value[idx] = { ...c, value: Math.max(1, next) }
  emit_update()
}


// ── Lifecycle ──────────────────────────────────────────────────────────────
watch(() => props.open, async (open) => {
  if (!open) return
  search.value = ''
  localConditions.value = props.token ? props.token.conditions.map(c => ({ ...c })) : []
  await loadConditions()
  nextTick(() => searchEl.value?.focus())
}, { immediate: false })

watch(() => props.token, (tok) => {
  if (tok && props.open) {
    localConditions.value = tok.conditions.map(c => ({ ...c }))
  }
})
</script>

<style scoped>
.cm-dialog {
  width: 520px;
  max-width: 96vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

/* Header */
.cm-header {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}
.cm-title {
  font-family: 'Cinzel', var(--font-deco);
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}
.cm-sub {
  font-family: var(--font-head);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--ink-ghost);
  text-transform: uppercase;
}
.cm-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 14px;
  color: var(--ink-ghost);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}
.cm-close:hover { color: var(--blood); }

/* Search */
.cm-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}
.cm-search-icon { color: var(--ink-ghost); flex-shrink: 0; }
.cm-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
}
.cm-search-input::placeholder { color: var(--ink-ghost); font-style: italic; }
.cm-search-clear {
  background: none;
  border: none;
  color: var(--ink-ghost);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  transition: color 0.15s;
}
.cm-search-clear:hover { color: var(--blood); }

/* Scrollable body */
.cm-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 8px;
}

/* Section */
.cm-section { padding: 12px 0; border-bottom: 1px dashed var(--parch-line); }
.cm-section:last-child { border-bottom: none; }
.cm-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.cm-section-label {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.cm-section-label--active { color: var(--arcane-l, #9f7abf); }
.cm-section-label--avail  { color: var(--ink-ghost); }
.cm-section-count {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--ink-ghost);
  opacity: 0.6;
}

/* Active conditions list */
.cm-active-list { display: flex; flex-direction: column; gap: 2px; }
.cm-active-item { display: flex; flex-direction: column; }
.cm-active-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  border-radius: 3px;
  transition: background 0.1s;
}
.cm-active-row:hover { background: rgba(159,122,191,0.06); }
.cm-active-name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--arcane-l, #9f7abf);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s;
}
.cm-active-name:hover { color: var(--ink); }
.cm-active-name--open { color: var(--ink); }
.cm-active-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.cm-val-display {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  min-width: 18px;
  text-align: center;
}
.cm-active-detail {
  margin: 2px 4px 6px 12px;
  padding: 6px 10px;
  background: rgba(159,122,191,0.05);
  border-left: 2px solid rgba(159,122,191,0.3);
  border-radius: 0 2px 2px 0;
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--ink-faded);
  line-height: 1.5;
}
.cm-detail-empty { font-style: italic; }

/* Available list */
.cm-list { display: flex; flex-direction: column; gap: 1px; }
.cm-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 2px;
  text-align: left;
  transition: background 0.1s;
}
.cm-row:hover { background: rgba(28,20,16,0.05); }
.cm-row--active { background: rgba(159,122,191,0.07); }
.cm-row--active:hover { background: rgba(159,122,191,0.13); }

.cm-row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.cm-row-top {
  display: flex;
  align-items: center;
  gap: 7px;
}
.cm-cond-name {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  font-weight: 600;
  flex: 1;
}
.cm-row--active .cm-cond-name { color: var(--arcane-l, #9f7abf); }
.cm-cond-summary {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--ink-ghost);
  font-style: italic;
  line-height: 1.4;
}
.cm-cond-desc {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--ink-faded);
  line-height: 1.45;
  margin-top: 1px;
}
.cm-active-check { color: var(--arcane-l, #9f7abf); flex-shrink: 0; }
.cm-toggle-btn {
  flex-shrink: 0;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid var(--parch-line);
  background: none;
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  cursor: pointer;
  transition: all 0.15s;
}
.cm-toggle-btn:hover { border-color: var(--arcane, #7a5abf); color: var(--arcane-l, #9f7abf); }
.cm-row--active .cm-toggle-btn {
  border-color: rgba(159,122,191,0.4);
  color: var(--arcane-l, #9f7abf);
}
.cm-row--active .cm-toggle-btn:hover {
  border-color: var(--blood);
  color: var(--blood);
}

/* Loading / empty */
.cm-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  color: var(--ink-ghost);
}
.cm-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.cm-empty {
  padding: 16px 10px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-ghost);
  font-style: italic;
  text-align: center;
}

/* Free-text add-custom button */
.cm-add-custom {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  margin-bottom: 6px;
  border: 1px dashed rgba(159, 122, 191, 0.4);
  border-radius: 3px;
  background: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--arcane-l, #9f7abf);
  text-align: left;
  transition: background 0.12s, border-color 0.12s;
}
.cm-add-custom:hover {
  background: rgba(159, 122, 191, 0.08);
  border-color: rgba(159, 122, 191, 0.7);
}
.cm-add-custom strong { font-weight: 700; }

/* Footer */
.cm-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 14px 14px;
  border-top: 1px solid var(--parch-line);
  flex-shrink: 0;
}
</style>
