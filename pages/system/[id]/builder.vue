<template>
  <div class="builder-shell">
    <!-- Left: Entity type list -->
    <div class="builder-types">
      <div class="panel-header">
        <span class="panel-title">Entity Types</span>
        <button class="icon-btn" @click="addEntityType" title="New entity type">
          <OhVueIcon name="md-add" scale="0.9" />
        </button>
      </div>
      <div class="type-list">
        <div
          v-for="et in system?.entityTypes ?? []" :key="et.id"
          class="type-row" :class="{ active: activeTypeId === et.id }"
          :style="activeTypeId === et.id ? { borderColor: et.color + '88', background: et.color + '11' } : {}"
          @click="activeTypeId = et.id; fieldConfigIdx = null"
        >
          <OhVueIcon :name="et.icon || 'gi-scroll-unfurled'" scale="0.9" :style="{ color: et.color }" />
          <div class="type-row-info">
            <span class="type-row-name">{{ et.name || 'Unnamed' }}</span>
            <span class="type-row-count">{{ et.fields.length }} fields</span>
          </div>
          <button class="type-delete" @click.stop="deleteEntityType(et.id)">
            <OhVueIcon name="md-delete" scale="0.75" />
          </button>
        </div>
        <div v-if="!system?.entityTypes?.length" class="type-empty">
          No entity types yet.<br>Click + to add one.
        </div>
      </div>
    </div>

    <!-- Middle: Field list (or type meta editor) -->
    <div class="builder-fields" v-if="activeType">
      <!-- Type meta -->
      <div class="panel-header">
        <span class="panel-title">{{ activeType.name || 'Entity Type' }}</span>
        <button class="icon-btn" @click="addField" title="Add field">
          <OhVueIcon name="md-add" scale="0.9" />
        </button>
      </div>

      <!-- Type identity fields -->
      <div class="type-meta">
        <div class="meta-row">
          <div class="meta-field">
            <label class="f-label">Name (singular)</label>
            <input class="f-input" :value="activeType.name" placeholder="Spell"
              @input="patchType('name', ($event.target as HTMLInputElement).value)" />
          </div>
          <div class="meta-field">
            <label class="f-label">Plural</label>
            <input class="f-input" :value="activeType.plural" placeholder="Spells"
              @input="patchType('plural', ($event.target as HTMLInputElement).value)" />
          </div>
        </div>
        <div class="meta-row">
          <div class="meta-field" style="flex:2">
            <label class="f-label">Icon</label>
            <IconPicker :model-value="activeType.icon" :color="activeType.color"
              @update:model-value="v => patchType('icon', v)" />
          </div>
          <div class="meta-field" style="flex:1">
            <label class="f-label">Color</label>
            <div class="color-row">
              <input type="color" :value="activeType.color" class="color-input"
                @input="patchType('color', ($event.target as HTMLInputElement).value)" />
              <input class="f-input" :value="activeType.color"
                @input="patchType('color', ($event.target as HTMLInputElement).value)" />
            </div>
          </div>
        </div>
      </div>

      <div class="fields-divider">
        <span>Fields</span>
      </div>

      <!-- Field rows -->
      <div class="field-list">
        <div
          v-for="(field, i) in activeType.fields" :key="field.key"
          class="field-row" :class="{ active: fieldConfigIdx === i, 'drag-over': dragOverIdx === i }"
          draggable="true"
          @click="fieldConfigIdx = fieldConfigIdx === i ? null : i"
          @dragstart="onDragStart(i, $event)"
          @dragover.prevent="dragOverIdx = i"
          @dragleave="dragOverIdx = null"
          @drop.prevent="onDrop(i)"
          @dragend="dragOverIdx = null"
        >
          <div class="field-row-left">
            <OhVueIcon name="md-draghandle" scale="0.9" style="color:var(--forge-muted);cursor:grab" @mousedown.stop />
            <span class="field-type-badge" :class="`ftype-${field.component}`">
              {{ field.component }}
            </span>
            <span class="field-row-label">{{ field.label }}</span>
            <span class="field-row-key">{{ field.key }}</span>
          </div>
          <div class="field-row-right">
            <button class="field-flag" :class="{ on: field.showInCard }" title="Show in card"
              @click.stop="toggleFieldFlag(i, 'showInCard')">
              <OhVueIcon name="md-viewmodule" scale="0.75" />
            </button>
            <button class="field-flag" :class="{ on: field.required }" title="Required"
              @click.stop="toggleFieldFlag(i, 'required')">
              <OhVueIcon name="md-shield" scale="0.75" />
            </button>
            <button class="field-delete" @click.stop="deleteField(i)">
              <OhVueIcon name="md-delete" scale="0.75" />
            </button>
          </div>
        </div>
        <div v-if="!activeType.fields.length" class="field-empty">
          No fields yet. Click + to add one.
        </div>
      </div>
    </div>

    <div v-else class="builder-fields builder-fields--empty">
      <OhVueIcon name="gi-book-aura" scale="3" style="opacity:0.1;margin-bottom:12px" />
      <p style="color:var(--forge-muted);font-size:13px">Select or create an entity type</p>
    </div>

    <!-- Right: Field config OR record preview -->
    <div class="builder-preview">
      <!-- Field config panel -->
      <template v-if="fieldConfigIdx !== null && activeField">
        <div class="panel-header">
          <span class="panel-title">Configure Field</span>
          <button class="icon-btn" @click="fieldConfigIdx = null">
            <OhVueIcon name="md-close" scale="0.9" />
          </button>
        </div>
        <div class="config-body">
          <div class="config-field">
            <label class="f-label">Label</label>
            <input class="f-input" v-model="draftLabel"
              @blur="saveDraftLabel"
              @keyup.enter="saveDraftLabel" />
          </div>
          <div class="config-field">
            <label class="f-label">Key <span class="f-hint">(used in data storage)</span></label>
            <input class="f-input f-mono" v-model="draftKey"
              @blur="saveDraftKey"
              @keyup.enter="saveDraftKey"
              @input="keyManuallyEdited = true" />
            <span v-if="keyError" class="f-error">{{ keyError }}</span>
          </div>
          <div class="config-field">
            <label class="f-label">Component Type</label>
            <div class="component-grid">
              <button v-for="opt in FIELD_COMPONENT_OPTIONS" :key="opt.value"
                class="component-opt" :class="{ active: activeField.component === opt.value }"
                @click="patchField(fieldConfigIdx, 'component', opt.value)">
                <OhVueIcon :name="opt.icon" scale="0.9" />
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Component-specific config -->
          <div v-if="activeField.component === 'select' || activeField.component === 'multiselect'">
            <label class="f-label">Options <span class="f-hint">(one per line)</span></label>
            <textarea class="f-textarea" rows="6"
              :value="(activeField.config.options ?? []).join('\n')"
              @input="patchField(fieldConfigIdx, 'config', { ...activeField.config, options: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) })" />
          </div>
          <div v-if="activeField.component === 'number'" class="config-row">
            <div class="config-field">
              <label class="f-label">Unit</label>
              <input class="f-input" :value="activeField.config.unit ?? ''"
                placeholder="ft, gp…"
                @input="patchField(fieldConfigIdx, 'config', { ...activeField.config, unit: ($event.target as HTMLInputElement).value })" />
            </div>
            <div class="config-field">
              <label class="f-label">Min</label>
              <input class="f-input" type="number" :value="activeField.config.min ?? ''"
                @input="patchField(fieldConfigIdx, 'config', { ...activeField.config, min: Number(($event.target as HTMLInputElement).value) })" />
            </div>
            <div class="config-field">
              <label class="f-label">Max</label>
              <input class="f-input" type="number" :value="activeField.config.max ?? ''"
                @input="patchField(fieldConfigIdx, 'config', { ...activeField.config, max: Number(($event.target as HTMLInputElement).value) })" />
            </div>
          </div>
          <div v-if="activeField.component === 'tracker'" class="config-field">
            <label class="f-label">Default Max</label>
            <input class="f-input" type="number" :value="activeField.config.defaultMax ?? 10"
              @input="patchField(fieldConfigIdx, 'config', { ...activeField.config, defaultMax: Number(($event.target as HTMLInputElement).value) })" />
          </div>
          <div v-if="activeField.component === 'text' || activeField.component === 'textarea'" class="config-field">
            <label class="f-label">Placeholder</label>
            <input class="f-input" :value="activeField.config.placeholder ?? ''"
              @input="patchField(fieldConfigIdx, 'config', { ...activeField.config, placeholder: ($event.target as HTMLInputElement).value })" />
          </div>
        </div>
      </template>

      <!-- Record preview -->
      <template v-else-if="activeType">
        <div class="panel-header">
          <span class="panel-title">Preview</span>
          <span class="panel-hint">sample record</span>
        </div>
        <div class="preview-body">
          <!-- Card preview -->
          <div class="preview-label">Card</div>
          <div class="preview-card v6-card">
            <div class="preview-card-inner">
              <div class="preview-icon-col" :style="{ background: activeType.color + '18' }">
                <OhVueIcon :name="activeType.icon || 'gi-scroll-unfurled'" scale="1.4"
                  :style="{ color: activeType.color }" />
              </div>
              <div class="preview-card-info">
                <div class="preview-card-name">Sample {{ activeType.name }}</div>
                <div v-for="f in activeType.fields.filter(f => f.showInCard).slice(0, 3)" :key="f.key"
                  class="preview-card-field">
                  <span class="preview-field-label">{{ f.label }}:</span>
                  <span class="preview-field-val">{{ sampleValue(f) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Full record preview -->
          <div class="preview-label" style="margin-top:20px">Full Record</div>
          <div class="preview-record">
            <div class="preview-record-header" :style="{ borderColor: activeType.color + '55' }">
              <OhVueIcon :name="activeType.icon || 'gi-scroll-unfurled'" scale="1.2"
                :style="{ color: activeType.color }" />
              <span class="preview-record-name">Sample {{ activeType.name }}</span>
              <span class="preview-type-tag" :style="{ background: activeType.color + '22', color: activeType.color }">
                {{ activeType.name }}
              </span>
            </div>
            <div class="preview-record-fields">
              <div v-for="f in activeType.fields" :key="f.key" class="preview-record-field">
                <label class="preview-field-label">{{ f.label }}</label>
                <span class="preview-field-val">{{ sampleValue(f) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
import { FIELD_COMPONENT_OPTIONS, labelToKey } from '~/types/entities'
import type { FieldSchema, EntityTypeSchema, FieldComponentType } from '~/types/entities'

const route = useRoute()
const systemsStore = useSystemsStore()
const systemId = Number(route.params.id)

const activeTypeId = ref<string | null>(null)
const fieldConfigIdx = ref<number | null>(null)
const dragSrcIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)
// Local draft values for the field label/key inputs to avoid reactive overwrite on keystroke
const draftLabel = ref('')
const draftKey = ref('')
const keyManuallyEdited = ref(false)

const system = computed(() => systemsStore.getSystem(systemId))
const activeType = computed(() => system.value?.entityTypes.find(t => t.id === activeTypeId.value) ?? null)
const activeField = computed(() => fieldConfigIdx.value !== null ? activeType.value?.fields[fieldConfigIdx.value] ?? null : null)

const keyError = computed(() => {
  if (fieldConfigIdx.value === null) return ''
  const key = draftKey.value
  if (!key) return 'Key is required'
  const others = (activeType.value?.fields ?? []).filter((_, i) => i !== fieldConfigIdx.value)
  if (others.some(f => f.key === key)) return 'Duplicate key'
  return ''
})

onMounted(async () => {
  if (!systemsStore.systems.length) await systemsStore.loadAll()
  if (system.value?.entityTypes.length) activeTypeId.value = system.value.entityTypes[0].id
})

// Sync draft inputs when field selection changes
watch([fieldConfigIdx, activeTypeId], () => {
  const f = fieldConfigIdx.value !== null ? activeType.value?.fields[fieldConfigIdx.value] : null
  if (f) {
    draftLabel.value = f.label
    draftKey.value = f.key
    keyManuallyEdited.value = !f.key.startsWith('field_') && f.key !== labelToKey(f.label)
  }
}, { immediate: true })

// ── Entity type mutations ──────────────────────────────────────────────────
function addEntityType() {
  const et: EntityTypeSchema = {
    id: `type_${Date.now()}`,
    name: 'New Type',
    plural: 'New Types',
    icon: 'gi-scroll-unfurled',
    color: '#6b9fe8',
    fields: [],
  }
  const types = [...(system.value?.entityTypes ?? []), et]
  systemsStore.updateSystem(systemId, { entityTypes: types })
  activeTypeId.value = et.id
  fieldConfigIdx.value = null
}

function deleteEntityType(id: string) {
  if (!confirm('Delete this entity type? All its fields will be removed.')) return
  const types = (system.value?.entityTypes ?? []).filter(t => t.id !== id)
  systemsStore.updateSystem(systemId, { entityTypes: types })
  if (activeTypeId.value === id) activeTypeId.value = types[0]?.id ?? null
}

function patchType(key: keyof EntityTypeSchema, value: any) {
  if (!activeType.value) return
  const types = (system.value?.entityTypes ?? []).map(t =>
    t.id === activeTypeId.value ? { ...t, [key]: value } : t
  )
  systemsStore.updateSystem(systemId, { entityTypes: types })
}

// ── Field mutations ───────────────────────────────────────────────────────
function addField() {
  const f: FieldSchema = {
    key: `field_${Date.now()}`,
    label: 'New Field',
    component: 'text',
    config: {},
    required: false,
    showInCard: false,
    showInHeader: false,
    sortable: false,
  }
  const fields = [...(activeType.value?.fields ?? []), f]
  patchType('fields', fields)
  const idx = fields.length - 1
  fieldConfigIdx.value = idx
  // Reset drafts immediately so they reflect the new blank field
  draftLabel.value = f.label
  draftKey.value = f.key
  keyManuallyEdited.value = false
}

function deleteField(i: number) {
  const fields = (activeType.value?.fields ?? []).filter((_, idx) => idx !== i)
  patchType('fields', fields)
  if (fieldConfigIdx.value === i) fieldConfigIdx.value = null
}

function patchField(i: number, key: keyof FieldSchema, value: any) {
  const fields = (activeType.value?.fields ?? []).map((f, idx) =>
    idx === i ? { ...f, [key]: value } : f
  )
  patchType('fields', fields)
}

function toggleFieldFlag(i: number, flag: 'showInCard' | 'required') {
  const f = activeType.value?.fields[i]
  if (!f) return
  patchField(i, flag, !f[flag])
}

function saveDraftLabel() {
  if (fieldConfigIdx.value === null) return
  const trimmed = draftLabel.value.trim()
  if (!trimmed) return
  patchField(fieldConfigIdx.value, 'label', trimmed)
  // Auto-update key if user hasn't manually edited it
  if (!keyManuallyEdited.value) {
    const newKey = labelToKey(trimmed)
    draftKey.value = newKey
    patchField(fieldConfigIdx.value, 'key', newKey)
  }
}

function saveDraftKey() {
  if (fieldConfigIdx.value === null) return
  const trimmed = draftKey.value.trim()
  if (!trimmed) return
  patchField(fieldConfigIdx.value, 'key', trimmed)
}

function autoKey(i: number) {
  const f = activeType.value?.fields[i]
  if (!f) return
  patchField(i, 'key', labelToKey(f.label))
}

function autoKeyIfUntouched(i: number | null) {
  if (i === null) return
  const f = activeType.value?.fields[i]
  if (!f) return
  // Only auto-update key if it still looks auto-generated (matches a previous label derivation)
  // or starts with 'field_' (the default placeholder)
  const currentKey = f.key
  if (currentKey.startsWith('field_') || currentKey === labelToKey(f.label)) {
    patchField(i, 'key', labelToKey(f.label))
  }
}

// ── Drag to reorder fields ────────────────────────────────────────────────
function onDragStart(i: number, e: DragEvent) {
  dragSrcIdx.value = i
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDrop(targetIdx: number) {
  if (dragSrcIdx.value === null || dragSrcIdx.value === targetIdx) {
    dragSrcIdx.value = null
    dragOverIdx.value = null
    return
  }
  const fields = [...(activeType.value?.fields ?? [])]
  const [moved] = fields.splice(dragSrcIdx.value, 1)
  fields.splice(targetIdx, 0, moved)
  patchType('fields', fields)
  // Update fieldConfigIdx to follow the moved field
  if (fieldConfigIdx.value === dragSrcIdx.value) fieldConfigIdx.value = targetIdx
  dragSrcIdx.value = null
  dragOverIdx.value = null
}

// ── Sample values for preview ─────────────────────────────────────────────
function sampleValue(f: FieldSchema): string {
  switch (f.component) {
    case 'text':        return f.config.placeholder ?? f.label
    case 'number':      return `10${f.config.unit ? ' ' + f.config.unit : ''}`
    case 'select':      return f.config.options?.[0] ?? 'Option A'
    case 'multiselect': return (f.config.options?.slice(0, 2) ?? ['Tag A', 'Tag B']).join(', ')
    case 'toggle':      return 'Yes'
    case 'tracker':     return `${f.config.defaultMax ?? 10} / ${f.config.defaultMax ?? 10}`
    case 'textarea':    return '(description…)'
    case 'image':       return '(image)'
    default:            return '—'
  }
}
</script>

<style scoped>
.builder-shell {
  display: flex; height: 100%; overflow: hidden;
}

/* Panels */
.builder-types { width: 220px; flex-shrink: 0; border-right: 1px solid var(--forge-border); display: flex; flex-direction: column; background: var(--forge-surface); }
.builder-fields { flex: 1; min-width: 0; border-right: 1px solid var(--forge-border); display: flex; flex-direction: column; overflow: hidden; }
.builder-fields--empty { align-items: center; justify-content: center; }
.builder-preview { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; overflow-y: auto; }

.panel-header { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--forge-border); gap: 8px; flex-shrink: 0; background: var(--forge-surface); }
.panel-title { font-family: var(--font-display); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--forge-muted); flex: 1; }
.panel-hint { font-size: 11px; color: var(--forge-muted); }
.icon-btn { width: 26px; height: 26px; border-radius: 6px; background: var(--forge-raised); border: 1px solid var(--forge-border); color: var(--forge-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.icon-btn:hover { color: var(--forge-text); }

/* Type list */
.type-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
.type-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: var(--forge-raised); border: 1px solid transparent; cursor: pointer; transition: all 0.15s; text-align: left; }
.type-row:hover { border-color: var(--forge-border); }
.type-row.active { }
.type-row-info { flex: 1; min-width: 0; }
.type-row-name { display: block; font-size: 13px; font-weight: 600; color: var(--forge-text); }
.type-row-count { font-size: 10px; color: var(--forge-muted); }
.type-delete { width: 20px; height: 20px; border-radius: 4px; background: none; border: none; color: var(--forge-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.type-row:hover .type-delete { opacity: 1; }
.type-empty { font-size: 12px; color: var(--forge-muted); text-align: center; padding: 24px 16px; line-height: 1.6; }

/* Type meta */
.type-meta { padding: 16px; border-bottom: 1px solid var(--forge-border); flex-shrink: 0; }
.meta-row { display: flex; gap: 12px; margin-bottom: 12px; }
.meta-field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.color-row { display: flex; align-items: center; gap: 8px; }
.color-input { width: 36px; height: 34px; border-radius: 6px; border: 1px solid var(--forge-border); padding: 2px; cursor: pointer; background: none; }

.fields-divider { display: flex; align-items: center; gap: 8px; padding: 10px 16px; flex-shrink: 0; }
.fields-divider span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--forge-muted); }
.fields-divider::before, .fields-divider::after { content: ''; flex: 1; height: 1px; background: var(--forge-border); }

/* Field list */
.field-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
.field-row { display: flex; align-items: center; padding: 8px 10px; border-radius: 10px; background: var(--forge-raised); border: 1px solid transparent; cursor: pointer; transition: all 0.15s; gap: 8px; }
.field-row:hover { border-color: var(--forge-border); }
.field-row.active { background: var(--forge-border); border-color: var(--forge-border-l); }
.field-row.drag-over { border-color: var(--forge-accent) !important; background: rgba(235,189,52,0.08); }
.field-row-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.field-row-right { display: flex; align-items: center; gap: 4px; }
.field-type-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; }
.ftype-text        { background: rgba(107,159,232,0.15); color: #6b9fe8; }
.ftype-textarea    { background: rgba(168,125,232,0.15); color: #a87de8; }
.ftype-number      { background: rgba(235,189,52,0.15);  color: #ebbd34; }
.ftype-select      { background: rgba(124,196,78,0.15);  color: #7cc44e; }
.ftype-multiselect { background: rgba(74,184,232,0.15);  color: #4ab8e8; }
.ftype-toggle      { background: rgba(224,85,85,0.15);   color: #e05555; }
.ftype-image       { background: rgba(232,146,74,0.15);  color: #e8924a; }
.ftype-tracker     { background: rgba(124,196,78,0.2);   color: #7cc44e; }
.field-row-label { font-size: 13px; color: var(--forge-text); font-weight: 500; }
.field-row-key { font-size: 11px; color: var(--forge-muted); font-family: 'JetBrains Mono', monospace; }
.field-flag { width: 22px; height: 22px; border-radius: 4px; background: none; border: 1px solid transparent; color: var(--forge-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.field-flag.on { color: var(--forge-accent); background: rgba(235,189,52,0.1); border-color: rgba(235,189,52,0.3); }
.field-flag:hover { border-color: var(--forge-border); }
.field-delete { width: 22px; height: 22px; border-radius: 4px; background: none; border: none; color: var(--forge-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.field-row:hover .field-delete { opacity: 1; }
.field-empty { font-size: 12px; color: var(--forge-muted); text-align: center; padding: 24px; }

/* Config panel */
.config-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; flex: 1; }
.config-field { display: flex; flex-direction: column; gap: 5px; }
.config-row { display: flex; gap: 10px; }
.component-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.component-opt { display: flex; align-items: center; gap: 7px; padding: 7px 10px; border-radius: 8px; background: var(--forge-raised); border: 1px solid var(--forge-border); color: var(--forge-secondary); font-size: 12px; cursor: pointer; transition: all 0.15s; }
.component-opt.active { background: rgba(235,189,52,0.12); border-color: rgba(235,189,52,0.4); color: var(--forge-accent); }
.component-opt:hover:not(.active) { color: var(--forge-text); }
.f-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.f-hint { font-size: 10px; color: var(--forge-muted); font-weight: 400; }
.f-error { font-size: 11px; color: var(--forge-danger); }
.f-textarea { width: 100%; background: var(--forge-raised); border: 1px solid var(--forge-border); border-radius: var(--r-md); padding: 8px 10px; color: var(--forge-text); font-size: 12px; font-family: 'JetBrains Mono', monospace; outline: none; resize: vertical; }

/* Preview */
.preview-body { padding: 16px; overflow-y: auto; flex: 1; }
.preview-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--forge-muted); margin-bottom: 8px; }
.preview-card { overflow: hidden; }
.preview-card-inner { display: flex; min-height: 80px; }
.preview-icon-col { width: 56px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.preview-card-info { flex: 1; padding: 10px 12px; }
.preview-card-name { font-size: 13px; font-weight: 600; color: var(--forge-text); margin-bottom: 5px; }
.preview-card-field { font-size: 11px; color: var(--forge-muted); }
.preview-field-label { margin-right: 4px; color: var(--forge-secondary); }
.preview-field-val { color: var(--forge-text); }
.preview-record { background: var(--forge-surface); border-radius: 12px; overflow: hidden; }
.preview-record-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid; }
.preview-record-name { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--forge-text); flex: 1; }
.preview-type-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; }
.preview-record-fields { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.preview-record-field { display: flex; flex-direction: column; gap: 2px; }
</style>
