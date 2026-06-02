<template>
  <Teleport to="body">
    <div v-if="open && token" class="pv-dialog-mask" style="z-index:var(--z-modal-top)" @click.self="$emit('close')">
      <div class="pv-dialog tem-dialog" @keydown.esc="$emit('close')">

        <!-- Header -->
        <div class="tem-header">
          <span class="tem-title">{{ localLabel || token.name }}</span>
          <span class="tem-sub">— Edit Token</span>
          <button class="tem-close" @click="$emit('close')">✕</button>
        </div>

        <div class="tem-body">

          <!-- ── IDENTITY ─────────────────────────────────────────────────── -->
          <div class="tem-section">
            <div class="tem-section-label">Identity</div>

            <div class="tem-field">
              <label class="tem-label">Label</label>
              <input v-model="localLabel" class="tem-text-input" :placeholder="token.name" />
            </div>

            <div class="tem-field">
              <label class="tem-label">Linked Creature</label>
              <div v-if="linkedRecordName && !changingLink" class="tem-linked-row">
                <span class="tem-linked-badge">{{ linkedRecordName }}</span>
                <button class="tem-clear-link" @click="changingLink = true">Change</button>
                <button class="tem-clear-link tem-clear-link--danger" @click="clearLink">× Clear</button>
              </div>
              <div v-else>
                <input
                  v-model="linkSearch"
                  class="tem-text-input"
                  placeholder="Search creatures…"
                  @input="filterRecords"
                  @focus="filterRecords"
                />
                <div v-if="filteredRecords.length" class="tem-dropdown">
                  <button
                    v-for="rec in filteredRecords.slice(0, 8)"
                    :key="rec.id"
                    class="tem-dropdown-row"
                    @click="selectRecord(rec)"
                  >
                    <span class="tem-rec-type">{{ rec.entityTypeId }}</span>
                    {{ rec.name }}
                  </button>
                </div>
              </div>
              <label v-if="pendingLink" class="tem-sync-row">
                <input type="checkbox" v-model="syncHpAc" class="tem-checkbox" />
                <span>Update HP, AC and conditions from this record</span>
              </label>
            </div>
          </div>

          <!-- ── COMBAT ──────────────────────────────────────────────────── -->
          <div class="tem-section">
            <div class="tem-section-label">Combat</div>
            <div class="tem-combat-cols">
              <!-- Left -->
              <div class="tem-col">
                <label class="tem-label">HP Current</label>
                <div class="tem-stepper">
                  <button class="tem-step-btn" @click="localHpCurrent = Math.max(0, (localHpCurrent ?? 0) - 1)">−</button>
                  <input v-model.number="localHpCurrent" type="number" class="tem-num-input" />
                  <button class="tem-step-btn" @click="localHpCurrent = (localHpCurrent ?? 0) + 1">+</button>
                </div>

                <label class="tem-label" style="margin-top:10px">HP Max</label>
                <input v-model.number="localHpMax" type="number" class="tem-num-input" />

                <label class="tem-label" style="margin-top:12px">Quick HP Change</label>
                <div class="tem-damage-row">
                  <input v-model.number="damageAmt" type="number" min="0" class="tem-num-input tem-damage-input" placeholder="Amt" />
                  <button class="tem-dmg-btn tem-dmg-btn--dmg" @click="applyDamage">− Dmg</button>
                  <button class="tem-dmg-btn tem-dmg-btn--heal" @click="applyHealing">+ Heal</button>
                </div>
              </div>

              <!-- Right -->
              <div class="tem-col">
                <label class="tem-label">AC</label>
                <input v-model.number="localAc" type="number" class="tem-num-input" />

                <label class="tem-label" style="margin-top:10px">Size</label>
                <select v-model="localSize" class="tem-select">
                  <option v-for="opt in tokenSizeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ── INITIATIVE ───────────────────────────────────────────────── -->
          <div class="tem-section">
            <div class="tem-section-label">Initiative</div>
            <div class="tem-field" style="max-width:160px">
              <label class="tem-label">
                Initiative
                <span class="tem-hint-inline">Higher goes first</span>
              </label>
              <input v-model.number="localInitiative" type="number" class="tem-num-input" />
            </div>
          </div>

          <!-- ── VISION ─────────────────────────────────────────────────────── -->
          <div class="tem-section">
            <div class="tem-section-label">Vision</div>
            <label class="tem-sync-row" style="margin-bottom:12px">
              <input type="checkbox" v-model="localIsPlayerToken" class="tem-checkbox" />
              <span>Player Character Token</span>
            </label>
            <div class="tem-field">
              <label class="tem-label">
                Vision Range
                <span class="tem-hint-inline">tiles · blank = unlimited</span>
              </label>
              <input
                v-model.number="localVisionRange"
                type="number"
                min="1"
                class="tem-num-input"
                placeholder="∞"
              />
            </div>
          </div>

          <!-- ── CONDITIONS ───────────────────────────────────────────────── -->
          <div class="tem-section">
            <div class="tem-section-label">Conditions</div>
            <div class="enc-conditions-list">
              <div v-for="cond in token.conditions" :key="cond.name" class="condition-tag">
                <span class="condition-tag-name">{{ cond.name }}</span>
                <span v-if="cond.value !== null" class="condition-value-display">{{ cond.value }}</span>
              </div>
              <span v-if="!token.conditions.length" class="enc-no-conditions">None</span>
            </div>
            <button class="tem-add-cond-btn" style="margin-top:8px" @click="$emit('open-conditions')">
              Edit Conditions →
            </button>
          </div>

          <!-- ── NOTES ─────────────────────────────────────────────────────── -->
          <div class="tem-section">
            <div class="tem-section-label">Notes</div>
            <textarea
              v-model="localNotes"
              class="tem-textarea"
              rows="3"
              placeholder="Notes visible to DM only…"
            />
          </div>

        </div><!-- /tem-body -->

        <!-- Footer -->
        <div class="tem-footer">
          <button class="link-btn link-btn--skip" @click="$emit('close')">Cancel</button>
          <button class="link-btn link-btn--link" @click="save">Save Changes</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { EncounterToken, TokenCondition } from '~/stores/encounter'
import { getDb } from '~/composables/useDb'
import { useSystems } from '~/composables/useSystems'
import { useStatBlockLinker, SIZE_STRING_MAP } from '~/composables/useStatBlockLinker'

const { extractStatsFromData } = useStatBlockLinker()

const props = defineProps<{
  token: EncounterToken | null
  systemId: number | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  update: [tokenId: number, changes: Partial<EncounterToken>]
  'open-conditions': []
}>()

// ── Local editable state ───────────────────────────────────────────────────
const localLabel      = ref('')
const localHpCurrent  = ref<number | null>(null)
const localHpMax      = ref<number | null>(null)
const localAc         = ref<number | null>(null)
const localInitiative = ref<number | null>(null)
const localSize       = ref(1)
const localNotes      = ref('')
const localConditions = ref<TokenCondition[]>([])
const localLinkedRecordId = ref<number | null>(null)
const localIsPlayerToken = ref(false)
const localVisionRange = ref<number | null>(null)

// Reset local state whenever the token changes
watch(() => props.token, (tok) => {
  if (!tok) return
  localLabel.value      = tok.label ?? ''
  localHpCurrent.value  = tok.hpCurrent
  localHpMax.value      = tok.hpMax
  localAc.value         = tok.ac
  localInitiative.value = tok.initiative
  localSize.value       = tok.size
  localNotes.value      = tok.notes ?? ''
  localLinkedRecordId.value = tok.linkedRecordId
  localIsPlayerToken.value = tok.isPlayerToken ?? false
  localVisionRange.value = tok.visionRange ?? null
  linkedRecordName.value = null
  changingLink.value = false
  linkSearch.value = ''
  filteredRecords.value = []
  pendingLink.value = null
  syncHpAc.value = true
  damageAmt.value = null
  if (tok.linkedRecordId) loadLinkedRecordName(tok.linkedRecordId)
  if (props.systemId) loadAllRecords()
}, { immediate: true })

// ── Linked record ──────────────────────────────────────────────────────────
const linkedRecordName = ref<string | null>(null)
const changingLink = ref(false)
const linkSearch = ref('')
const allRecords = ref<Array<{ id: number; name: string; entityTypeId: string; data: string }>>([])
const filteredRecords = ref<typeof allRecords.value>([])
const pendingLink = ref<{ id: number; name: string; data: string } | null>(null)
const syncHpAc = ref(true)

const CREATURE_TYPES = new Set(['creature', 'npc', 'monster', 'character', 'enemy', 'boss', 'humanoid', 'beast'])

async function loadLinkedRecordName(id: number) {
  const rec = await getDb().records.get(id)
  linkedRecordName.value = rec?.name ?? '(unknown)'
}

async function loadAllRecords() {
  if (!props.systemId) return
  const recs = await getDb().records.where('systemId').equals(props.systemId).toArray()
  allRecords.value = recs.filter(r =>
    CREATURE_TYPES.has(r.entityTypeId.toLowerCase()) ||
    /creature|npc|monster|character|enemy|beast/i.test(r.entityTypeId)
  ).map(r => ({ id: r.id!, name: r.name, entityTypeId: r.entityTypeId, data: r.data as string }))
}

function filterRecords() {
  const q = linkSearch.value.toLowerCase()
  filteredRecords.value = q
    ? allRecords.value.filter(r => r.name.toLowerCase().includes(q) || r.entityTypeId.toLowerCase().includes(q))
    : allRecords.value
}

function selectRecord(rec: typeof allRecords.value[0]) {
  pendingLink.value = rec
  linkedRecordName.value = rec.name
  localLinkedRecordId.value = rec.id
  changingLink.value = false
  linkSearch.value = ''
  filteredRecords.value = []
}

function clearLink() {
  localLinkedRecordId.value = null
  linkedRecordName.value = null
  pendingLink.value = null
  changingLink.value = false
  linkSearch.value = ''
}

// ── Damage / healing quick row ─────────────────────────────────────────────
const damageAmt = ref<number | null>(null)

function applyDamage() {
  if (!damageAmt.value) return
  const current = localHpCurrent.value ?? 0
  localHpCurrent.value = Math.max(0, current - damageAmt.value)
  damageAmt.value = null
}

function applyHealing() {
  if (!damageAmt.value) return
  const current = localHpCurrent.value ?? 0
  const max = localHpMax.value ?? current + damageAmt.value
  localHpCurrent.value = Math.min(max, current + damageAmt.value)
  damageAmt.value = null
}


// ── Save ───────────────────────────────────────────────────────────────────
const SIZE_LABELS: Record<number, string> = {
  1: 'medium', 2: 'large', 3: 'huge', 4: 'gargantuan',
}
const tokenSizeOptions = [...new Set(Object.values(SIZE_STRING_MAP))]
  .sort((a, b) => a - b)
  .map(v => ({ label: `${v}×${v} (${SIZE_LABELS[v] ?? v})`, value: v }))

function save() {
  if (!props.token) return
  const changes: Partial<EncounterToken> = {}

  if (localLabel.value !== (props.token.label ?? '')) changes.label = localLabel.value || null
  if (localHpCurrent.value !== props.token.hpCurrent) changes.hpCurrent = localHpCurrent.value
  if (localHpMax.value !== props.token.hpMax) changes.hpMax = localHpMax.value
  if (localAc.value !== props.token.ac) changes.ac = localAc.value
  if (localInitiative.value !== props.token.initiative) changes.initiative = localInitiative.value
  if (localSize.value !== props.token.size) changes.size = localSize.value
  if (localNotes.value !== (props.token.notes ?? '')) changes.notes = localNotes.value || null
  if (localLinkedRecordId.value !== props.token.linkedRecordId) changes.linkedRecordId = localLinkedRecordId.value
  if (localIsPlayerToken.value !== (props.token.isPlayerToken ?? false)) changes.isPlayerToken = localIsPlayerToken.value
  if (localVisionRange.value !== props.token.visionRange) changes.visionRange = localVisionRange.value || null

  // Optionally sync HP/AC from newly linked record
  if (pendingLink.value && syncHpAc.value) {
    const data: Record<string, any> = typeof pendingLink.value.data === 'string'
      ? JSON.parse(pendingLink.value.data || '{}')
      : (pendingLink.value.data ?? {})
    const extracted = extractStatsFromData(data)
    if (extracted.hpMax !== null) {
      changes.hpMax = extracted.hpMax
      changes.hpCurrent = extracted.hpCurrent
    }
    if (extracted.ac !== null) changes.ac = extracted.ac
  }

  if (Object.keys(changes).length) emit('update', props.token.id, changes)
  emit('close')
}
</script>

<style scoped>
.tem-dialog {
  width: 480px;
  max-width: 96vw;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

/* Header */
.tem-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}
.tem-title {
  font-family: 'Cinzel', var(--font-deco);
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.tem-sub {
  font-family: var(--font-head);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--ink-ghost);
  text-transform: uppercase;
}
.tem-close {
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
.tem-close:hover { color: var(--blood); }

/* Scrollable body */
.tem-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 18px 8px;
}

/* Section */
.tem-section {
  padding: 14px 0;
  border-bottom: 1px dashed var(--parch-line);
}
.tem-section:last-child { border-bottom: none; }
.tem-section-label {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  margin-bottom: 12px;
}

/* Field */
.tem-field { margin-bottom: 10px; }
.tem-field:last-child { margin-bottom: 0; }
.f-field { margin-bottom: 14px; }
.tem-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  margin-bottom: 5px;
}
.tem-hint-inline {
  font-family: var(--font-body);
  font-size: 10px;
  letter-spacing: 0;
  text-transform: none;
  font-weight: 400;
  color: var(--ink-ghost);
  font-style: italic;
}

/* Text input */
.tem-text-input {
  width: 100%;
  padding: 6px 9px;
  background: var(--parch);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink);
  box-sizing: border-box;
}
.tem-text-input:focus { outline: 1px solid var(--gold); border-color: var(--gold); }
.tem-text-input::placeholder { color: var(--ink-ghost); font-style: italic; }

/* Number input */
.tem-num-input {
  width: 100%;
  padding: 5px 8px;
  background: var(--parch);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink);
  box-sizing: border-box;
  text-align: center;
}
.tem-num-input:focus { outline: 1px solid var(--gold); border-color: var(--gold); }

/* Stepper row */
.tem-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tem-step-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  background: var(--parch);
  color: var(--ink-ghost);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, color 0.15s;
}
.tem-step-btn:hover { border-color: var(--gold); color: var(--gold); }

/* Select */
.tem-select {
  width: 100%;
  padding: 5px 8px;
  background: var(--parch);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink);
}

/* Two-column combat layout */
.tem-combat-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.tem-col { display: flex; flex-direction: column; }

/* Quick damage row */
.tem-damage-row {
  display: flex;
  gap: 4px;
  align-items: center;
}
.tem-damage-input { flex: 1; }
.tem-dmg-btn {
  padding: 5px 8px;
  border-radius: 2px;
  border: 1px solid;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.tem-dmg-btn--dmg { background: rgba(139,0,0,0.08); color: var(--blood); border-color: rgba(139,0,0,0.35); }
.tem-dmg-btn--dmg:hover { background: rgba(139,0,0,0.18); }
.tem-dmg-btn--heal { background: rgba(74,143,90,0.1); color: #4a8f5a; border-color: rgba(74,143,90,0.35); }
.tem-dmg-btn--heal:hover { background: rgba(74,143,90,0.2); }

/* Linked record row */
.tem-linked-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tem-linked-badge {
  flex: 1;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink);
  font-style: italic;
}
.tem-clear-link {
  background: none;
  border: none;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 2px;
  color: var(--ink-ghost);
  border: 1px solid var(--parch-line);
  transition: all 0.15s;
}
.tem-clear-link:hover { color: var(--ink); border-color: var(--ink-ghost); }
.tem-clear-link--danger:hover { color: var(--blood); border-color: var(--blood); }

/* Dropdown list */
.tem-dropdown {
  border: 1px solid var(--parch-line);
  border-top: none;
  border-radius: 0 0 2px 2px;
  background: var(--parch);
  max-height: 160px;
  overflow-y: auto;
}
.tem-dropdown-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.1s;
}
.tem-dropdown-row:hover { background: rgba(184,134,11,0.08); }
.tem-rec-type {
  font-family: var(--font-head);
  font-size: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  background: rgba(28,20,16,0.06);
  padding: 1px 5px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* Sync checkbox */
.tem-sync-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--ink-ghost);
  cursor: pointer;
}
.tem-checkbox { accent-color: var(--gold); cursor: pointer; }

/* Condition value badge (read-only display) */
.condition-value-display {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--arcane-l, #9f7abf);
  background: rgba(159,122,191,0.12);
  border-radius: 2px;
  padding: 0 4px;
}

/* Add / edit condition button */
.tem-add-cond-btn {
  background: none;
  border: 1px dashed var(--parch-line);
  border-radius: 2px;
  padding: 4px 12px;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  cursor: pointer;
  transition: all 0.15s;
}
.tem-add-cond-btn:hover { border-color: var(--ink-ghost); color: var(--ink); }

.tem-cond-adder { margin-top: 8px; }

/* Notes textarea */
.tem-textarea {
  width: 100%;
  padding: 7px 9px;
  background: var(--parch);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink);
  resize: vertical;
  box-sizing: border-box;
}
.tem-textarea:focus { outline: 1px solid var(--gold); border-color: var(--gold); }
.tem-textarea::placeholder { color: var(--ink-ghost); font-style: italic; }

/* Footer */
.tem-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 18px 14px;
  border-top: 1px solid var(--parch-line);
  flex-shrink: 0;
}
</style>
