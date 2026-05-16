<template>
  <div style="display:flex; flex-direction:column; flex:1; overflow:hidden;">

    <!-- Subnav -->
    <div class="sys-subnav">
      <div class="sys-breadcrumb">
        <NuxtLink :to="`/system/${systemId}/library`" class="sys-breadcrumb-link">{{ system?.name ?? 'System' }}</NuxtLink>
        <span class="sys-breadcrumb-sep">›</span>
        <span class="sys-breadcrumb-cur">Builder</span>
      </div>
      <div class="sys-subnav-actions">
        <NuxtLink :to="`/system/${systemId}/library`" class="btn btn-ghost btn-sm">← Library</NuxtLink>
      </div>
    </div>

    <!-- Three-column builder layout -->
    <div class="bldr-shell">

      <!-- ── Column 1: Entity type list ── -->
      <div class="bldr-types">
        <div class="bldr-col-head">
          <span class="bldr-col-title">Entity Types</span>
          <button class="btn btn-ghost btn-sm" style="padding:2px 8px; font-size:11px" @click="addEntityType" title="New entity type">+</button>
        </div>
        <div class="bldr-type-list">
          <div
            v-for="et in system?.entityTypes ?? []"
            :key="et.id"
            class="bldr-type-row"
            :class="{ active: activeTypeId === et.id }"
            :style="activeTypeId === et.id ? { borderLeftColor: et.color, background: et.color + '11' } : {}"
            @click="activeTypeId = et.id; fieldConfigIdx = null"
          >
            <div class="bldr-type-dot" :style="{ background: et.color }" />
            <div class="bldr-type-info">
              <span class="bldr-type-name">{{ et.name || 'Unnamed' }}</span>
              <span class="bldr-type-count">{{ et.fields.length }} fields</span>
            </div>
            <button class="bldr-type-del" @click.stop="deleteEntityType(et.id)">✕</button>
          </div>
          <div v-if="!system?.entityTypes?.length" class="bldr-empty-hint">
            No entity types yet.<br>Click + to add one.
          </div>
        </div>
      </div>

      <!-- ── Column 2: Fields / Layout editor ── -->
      <div class="bldr-fields" v-if="activeType">

        <!-- Type meta -->
        <div class="bldr-col-head">
          <span class="bldr-col-title">{{ activeType.name || 'Entity Type' }}</span>
          <div class="bldr-mode-toggle">
            <button class="bldr-mode-btn" :class="{ active: middleMode === 'fields' }" @click="middleMode = 'fields'">Fields</button>
            <button class="bldr-mode-btn" :class="{ active: middleMode === 'layout' }" @click="middleMode = 'layout'">Layout</button>
          </div>
          <button v-if="middleMode === 'fields'" class="btn btn-ghost btn-sm" style="padding:2px 8px; font-size:11px" @click="addField" title="Add field">+</button>
        </div>

        <div class="bldr-type-meta">
          <div class="bldr-meta-row">
            <div class="bldr-meta-field">
              <label class="sys-entity-field-label">Name (singular)</label>
              <input class="sys-entity-field-input" :value="activeType.name" placeholder="Spell"
                @input="patchType('name', ($event.target as HTMLInputElement).value)" />
            </div>
            <div class="bldr-meta-field">
              <label class="sys-entity-field-label">Plural</label>
              <input class="sys-entity-field-input" :value="activeType.plural" placeholder="Spells"
                @input="patchType('plural', ($event.target as HTMLInputElement).value)" />
            </div>
          </div>
          <div class="bldr-meta-row">
            <div class="bldr-meta-field" style="flex:2">
              <label class="sys-entity-field-label">Icon</label>
              <IconPicker :model-value="activeType.icon" :color="activeType.color"
                @update:model-value="v => patchType('icon', v)" />
            </div>
            <div class="bldr-meta-field" style="flex:1">
              <label class="sys-entity-field-label">Color</label>
              <div class="bldr-color-row">
                <input type="color" :value="activeType.color" class="bldr-color-input"
                  @input="patchType('color', ($event.target as HTMLInputElement).value)" />
                <input class="sys-entity-field-input" :value="activeType.color"
                  @input="patchType('color', ($event.target as HTMLInputElement).value)" />
              </div>
            </div>
          </div>
        </div>

        <!-- FIELDS MODE -->
        <template v-if="middleMode === 'fields'">
          <div class="bldr-divider"><span>Fields</span></div>
          <div class="bldr-field-list">
            <div
              v-for="(field, i) in activeType.fields" :key="field.key"
              class="bldr-field-row"
              :class="{ active: fieldConfigIdx === i, 'drag-over': dragOverIdx === i }"
              draggable="true"
              @click="fieldConfigIdx = fieldConfigIdx === i ? null : i"
              @dragstart="onDragStart(i, $event)"
              @dragover.prevent="dragOverIdx = i"
              @dragleave="dragOverIdx = null"
              @drop.prevent="onDrop(i)"
              @dragend="dragOverIdx = null"
            >
              <span class="bldr-field-drag">⠿</span>
              <span class="bldr-field-badge" :class="`ftype-${field.component}`">{{ field.component }}</span>
              <span class="bldr-field-label">{{ field.label }}</span>
              <span class="bldr-field-key">{{ field.key }}</span>
              <div class="bldr-field-actions">
                <button class="bldr-flag" :class="{ on: field.showInCard }" title="Show in card"
                  @click.stop="toggleFieldFlag(i, 'showInCard')">◫</button>
                <button class="bldr-flag" :class="{ on: field.required }" title="Required"
                  @click.stop="toggleFieldFlag(i, 'required')">★</button>
                <button class="bldr-field-del" @click.stop="deleteField(i)">✕</button>
              </div>
            </div>
            <div v-if="!activeType.fields.length" class="bldr-empty-hint" style="padding:24px 16px">
              No fields yet. Click + to add one.
            </div>
          </div>
        </template>

        <!-- LAYOUT MODE -->
        <template v-else>
          <div class="bldr-divider">
            <span>Sections</span>
            <button class="btn btn-ghost btn-sm" style="margin-left:auto; padding:2px 8px; font-size:11px" @click="addSection" title="Add section">+</button>
          </div>
          <div class="bldr-section-list">
            <div
              v-for="(sec, si) in activeType.sections ?? []" :key="sec.id"
              class="bldr-sec-card"
              :class="{ 'drag-over': dragOverSectionIdx === si }"
              draggable="true"
              @dragstart="onSectionDragStart(si, $event)"
              @dragover.prevent="dragOverSectionIdx = si"
              @dragleave="dragOverSectionIdx = null"
              @drop.prevent="onSectionDrop(si)"
              @dragend="dragOverSectionIdx = null"
            >
              <div class="bldr-sec-head">
                <span class="bldr-field-drag" style="cursor:grab">⠿</span>
                <input class="bldr-sec-title-input" :value="sec.title ?? ''" placeholder="Section title…"
                  @input="patchSection(sec.id, { title: ($event.target as HTMLInputElement).value || undefined })" />
                <button class="bldr-field-del" @click="deleteSection(sec.id)">✕</button>
              </div>
              <div class="bldr-sec-style-row">
                <button v-for="opt in SECTION_STYLE_OPTIONS" :key="opt.value"
                  class="bldr-sec-style-btn" :class="{ active: sec.style === opt.value }"
                  @click="patchSection(sec.id, { style: opt.value as SectionStyle })">
                  {{ opt.label }}
                </button>
              </div>
              <div class="bldr-sec-chips">
                <div v-for="key in sec.fields" :key="key" class="bldr-sec-chip">
                  <span>{{ fieldLabel(key) }}</span>
                  <button @click="removeFromSection(sec.id, key)">×</button>
                </div>
                <select v-if="unassignedFields.length" class="bldr-sec-add-select"
                  @change="e => { const v = (e.target as HTMLSelectElement).value; if(v) { addFieldToSection(sec.id, v); (e.target as HTMLSelectElement).value = '' } }">
                  <option value="">+ Add field</option>
                  <option v-for="f in unassignedFields" :key="f.key" :value="f.key">{{ f.label }}</option>
                </select>
              </div>
            </div>
            <div v-if="!activeType.sections?.length" class="bldr-empty-hint" style="padding:24px 16px">
              No sections yet. Click + to create one.
            </div>
            <template v-if="unassignedFields.length && activeType.sections?.length">
              <div class="bldr-divider" style="margin:4px 0"><span>Unassigned</span></div>
              <div class="bldr-unassigned-pool">
                <div v-for="f in unassignedFields" :key="f.key" class="bldr-unassigned-chip">{{ f.label }}</div>
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- Column 2 empty state -->
      <div v-else class="bldr-fields bldr-fields--empty">
        <div style="font-size:32px; opacity:0.1; margin-bottom:12px">◎</div>
        <p style="color:var(--text3); font-size:13px">Select or create an entity type</p>
      </div>

      <!-- ── Column 3: Field config / Preview ── -->
      <div class="bldr-preview">

        <!-- Field config panel -->
        <template v-if="fieldConfigIdx !== null && activeField">
          <div class="bldr-col-head">
            <span class="bldr-col-title">Configure Field</span>
            <button class="btn btn-ghost btn-sm" style="padding:2px 8px; font-size:11px" @click="fieldConfigIdx = null">✕</button>
          </div>
          <div class="bldr-config-body">
            <div class="sys-entity-field-group">
              <div class="sys-entity-field-label">Label</div>
              <input class="sys-entity-field-input" v-model="draftLabel" @blur="saveDraftLabel" @keyup.enter="saveDraftLabel" />
            </div>
            <div class="sys-entity-field-group">
              <div class="sys-entity-field-label">Key <span style="color:var(--text3); font-weight:400">(storage key)</span></div>
              <input class="sys-entity-field-input" style="font-family:var(--fm); font-size:12px" v-model="draftKey"
                @blur="saveDraftKey" @keyup.enter="saveDraftKey" @input="keyManuallyEdited = true" />
              <span v-if="keyError" style="font-size:11px; color:var(--danger)">{{ keyError }}</span>
            </div>
            <div class="sys-entity-field-group">
              <div class="sys-entity-field-label">Component Type</div>
              <div class="bldr-component-grid">
                <button v-for="opt in genericFieldOptions" :key="opt.value"
                  class="bldr-component-opt" :class="{ active: activeField.component === opt.value }"
                  @click="patchField(fieldConfigIdx!, { component: opt.value })">
                  <OhVueIcon :name="opt.icon" scale="0.85" />
                  {{ opt.label }}
                </button>
              </div>
              <div class="bldr-section-sep">PF2e</div>
              <div class="bldr-component-grid">
                <button v-for="opt in pf2eFieldOptions" :key="opt.value"
                  class="bldr-component-opt" :class="{ active: activeField.component === opt.value }"
                  @click="patchField(fieldConfigIdx!, { component: opt.value })">
                  <OhVueIcon :name="opt.icon" scale="0.85" />
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Component-specific config -->
            <div v-if="activeField.component === 'select' || activeField.component === 'multiselect'" class="sys-entity-field-group">
              <div class="sys-entity-field-label">Options <span style="color:var(--text3); font-weight:400">(one per line)</span></div>
              <textarea class="sys-entity-field-textarea" rows="6"
                :value="(activeField.config.options ?? []).join('\n')"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, options: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
            </div>
            <div v-if="activeField.component === 'number'" class="bldr-config-row">
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Unit</div>
                <input class="sys-entity-field-input" :value="activeField.config.unit ?? ''" placeholder="ft, gp…"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, unit: ($event.target as HTMLInputElement).value } })" />
              </div>
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Min</div>
                <input class="sys-entity-field-input" type="number" :value="activeField.config.min ?? ''"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, min: Number(($event.target as HTMLInputElement).value) } })" />
              </div>
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Max</div>
                <input class="sys-entity-field-input" type="number" :value="activeField.config.max ?? ''"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, max: Number(($event.target as HTMLInputElement).value) } })" />
              </div>
            </div>
            <div v-if="activeField.component === 'tracker'" class="sys-entity-field-group">
              <div class="sys-entity-field-label">Default Max</div>
              <input class="sys-entity-field-input" type="number" :value="activeField.config.defaultMax ?? 10"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, defaultMax: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
            <div v-if="activeField.component === 'text' || activeField.component === 'textarea'" class="sys-entity-field-group">
              <div class="sys-entity-field-label">Placeholder</div>
              <input class="sys-entity-field-input" :value="activeField.config.placeholder ?? ''"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, placeholder: ($event.target as HTMLInputElement).value } })" />
            </div>
            <div v-if="activeField.component === 'dice'" class="sys-entity-field-group">
              <div class="sys-entity-field-label">Default Expression</div>
              <input class="sys-entity-field-input" style="font-family:var(--fm)" :value="activeField.config.defaultExpression ?? ''" placeholder="2d6"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, defaultExpression: ($event.target as HTMLInputElement).value } })" />
            </div>
            <div v-if="activeField.component === 'clock'" class="sys-entity-field-group">
              <div class="sys-entity-field-label">Segments</div>
              <div class="bldr-component-grid" style="grid-template-columns: repeat(4,1fr)">
                <button v-for="n in [4, 6, 8, 10]" :key="n"
                  class="bldr-component-opt" :class="{ active: (activeField.config.segments ?? 6) === n }"
                  @click="patchField(fieldConfigIdx!, { config: { ...activeField.config, segments: n } })">{{ n }}</button>
              </div>
            </div>
            <div v-if="activeField.component === 'rating'" class="bldr-config-row">
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Max</div>
                <input class="sys-entity-field-input" type="number" min="1" max="10" :value="activeField.config.ratingMax ?? 5"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, ratingMax: Number(($event.target as HTMLInputElement).value) } })" />
              </div>
              <div class="sys-entity-field-group" style="flex:2">
                <div class="sys-entity-field-label">Style</div>
                <div class="bldr-component-grid" style="grid-template-columns: repeat(3,1fr)">
                  <button v-for="s in ['dot','diamond','skull']" :key="s"
                    class="bldr-component-opt" :class="{ active: (activeField.config.ratingStyle ?? 'dot') === s }"
                    @click="patchField(fieldConfigIdx!, { config: { ...activeField.config, ratingStyle: s as any } })">{{ s }}</button>
                </div>
              </div>
            </div>
            <div v-if="activeField.component === 'tags'" class="sys-entity-field-group">
              <div class="sys-entity-field-label">Placeholder</div>
              <input class="sys-entity-field-input" :value="activeField.config.placeholder ?? ''" placeholder="Add tag…"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, placeholder: ($event.target as HTMLInputElement).value } })" />
            </div>
            <div v-if="activeField.component === 'checklist'" class="sys-entity-field-group">
              <div class="sys-entity-field-label">Items <span style="color:var(--text3); font-weight:400">(one per line)</span></div>
              <textarea class="sys-entity-field-textarea" rows="6"
                :value="(activeField.config.checklistItems ?? []).join('\n')"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, checklistItems: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
            </div>
            <template v-if="activeField.component === 'statblock'">
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Stats <span style="color:var(--text3); font-weight:400">(one per line)</span></div>
                <textarea class="sys-entity-field-textarea" rows="6"
                  :value="(activeField.config.stats ?? []).join('\n')"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, stats: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
              </div>
              <div class="bldr-config-row">
                <div class="sys-entity-field-group">
                  <div class="sys-entity-field-label">Min</div>
                  <input class="sys-entity-field-input" type="number" :value="activeField.config.statMin ?? 1"
                    @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, statMin: Number(($event.target as HTMLInputElement).value) } })" />
                </div>
                <div class="sys-entity-field-group">
                  <div class="sys-entity-field-label">Max</div>
                  <input class="sys-entity-field-input" type="number" :value="activeField.config.statMax ?? 30"
                    @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, statMax: Number(($event.target as HTMLInputElement).value) } })" />
                </div>
              </div>
              <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text2)">
                <input type="checkbox" :checked="activeField.config.showModifier !== false"
                  @change="patchField(fieldConfigIdx!, { config: { ...activeField.config, showModifier: ($event.target as HTMLInputElement).checked } })" />
                Show modifier
              </label>
            </template>
            <div v-if="activeField.component === 'conditions'" class="sys-entity-field-group">
              <div class="sys-entity-field-label">Conditions <span style="color:var(--text3); font-weight:400">(one per line)</span></div>
              <textarea class="sys-entity-field-textarea" rows="8"
                :value="(activeField.config.conditions ?? []).join('\n')"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, conditions: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
            </div>
            <template v-if="activeField.component === 'speed'">
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Movement modes <span style="color:var(--text3); font-weight:400">(one per line)</span></div>
                <textarea class="sys-entity-field-textarea" rows="5"
                  :value="(activeField.config.speedModes ?? []).join('\n')"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, speedModes: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
              </div>
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Unit</div>
                <input class="sys-entity-field-input" :value="activeField.config.speedUnit ?? 'ft'" placeholder="ft"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, speedUnit: ($event.target as HTMLInputElement).value } })" />
              </div>
            </template>
            <template v-if="activeField.component === 'spellslots'">
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Number of levels</div>
                <input class="sys-entity-field-input" type="number" min="1" max="20" :value="activeField.config.slotLevels ?? 9"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, slotLevels: Number(($event.target as HTMLInputElement).value) } })" />
              </div>
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Level names <span style="color:var(--text3); font-weight:400">(one per line)</span></div>
                <textarea class="sys-entity-field-textarea" rows="5"
                  :value="(activeField.config.slotLevelNames ?? []).join('\n')"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, slotLevelNames: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
              </div>
            </template>
            <template v-if="activeField.component === 'entity-link'">
              <div class="sys-entity-field-group">
                <div class="sys-entity-field-label">Links to entity type</div>
                <select class="sys-entity-field-input"
                  :value="activeField.config.entityTypeId ?? ''"
                  @change="patchField(fieldConfigIdx!, { config: { ...activeField.config, entityTypeId: ($event.target as HTMLSelectElement).value || undefined } })">
                  <option value="">— choose type —</option>
                  <option v-for="et in (activeType ? system?.entityTypes.filter(t => t.id !== activeType.id) : system?.entityTypes)" :key="et.id" :value="et.id">
                    {{ et.name }}
                  </option>
                </select>
              </div>
            </template>
          </div>
        </template>

        <!-- Preview panel -->
        <template v-else-if="activeType">
          <div class="bldr-col-head">
            <span class="bldr-col-title">Live Preview</span>
            <span style="font-size:10px; color:var(--text3)">{{ middleMode === 'layout' ? 'detail view' : 'sample record' }}</span>
          </div>
          <div class="bldr-preview-body">
            <!-- sys-preview-card style -->
            <div class="sys-preview-card">
              <div class="sys-preview-card-header">
                <div class="sys-preview-card-dot" :style="{ background: activeType.color }" />
                <div class="sys-preview-card-name">{{ activeType.name || 'Untitled' }}</div>
              </div>
              <div class="sys-preview-fields">
                <div class="sys-preview-field">
                  <div class="sys-preview-field-label">Name</div>
                  <div class="sys-preview-field-val" style="color:var(--text)">Sample {{ activeType.name }}</div>
                </div>
                <div v-for="f in activeType.fields.slice(0, 5)" :key="f.key" class="sys-preview-field">
                  <div class="sys-preview-field-label">{{ f.label }}<span v-if="f.required" style="color:var(--accent); margin-left:3px">*</span></div>
                  <div class="sys-preview-field-val">{{ sampleValue(f) }}</div>
                </div>
              </div>
            </div>

            <!-- Full entity layout preview -->
            <div style="margin-top:16px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:var(--text3); margin-bottom:8px">
              Detail View
            </div>
            <EntityLayout
              :entity-type="activeType"
              :data="{}"
              mode="view"
              :accent-color="activeType.color"
            />
          </div>
        </template>

        <!-- Empty state -->
        <template v-else>
          <div class="bldr-preview-empty">
            <div style="font-size:36px; opacity:0.1; margin-bottom:12px">◎</div>
            <span style="color:var(--text3); font-size:13px">Select an entity type<br>to configure or preview it.</span>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSystems } from '~/composables/useSystems'
import { FIELD_COMPONENT_OPTIONS, SECTION_STYLE_OPTIONS, labelToKey } from '~/types/entities'

const genericFieldOptions = FIELD_COMPONENT_OPTIONS.filter(o => !o.section)
const pf2eFieldOptions = FIELD_COMPONENT_OPTIONS.filter(o => o.section === 'PF2e')
import type { FieldSchema, EntityTypeSchema, SectionDef, SectionStyle } from '~/types/entities'
import { GI_ICON_NAMES } from '~/plugins/oh-vue-icons.client'

const VALID_ICONS = new Set(GI_ICON_NAMES)
function safeIcon(name: string | undefined): string {
  if (!name) return 'gi-scroll-unfurled'
  return VALID_ICONS.has(name) ? name : 'gi-scroll-unfurled'
}

const route = useRoute()
const systemsStore = useSystems()
const systemId = Number(route.params.id)

const activeTypeId = ref<string | null>(null)
const fieldConfigIdx = ref<number | null>(null)
const dragSrcIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)
const middleMode = ref<'fields' | 'layout'>('fields')
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
  await systemsStore.loadAll()
  // Support ?type=id query param from library "Edit Type" button
  const qType = route.query.type as string | undefined
  if (qType && system.value?.entityTypes.find(t => t.id === qType)) {
    activeTypeId.value = qType
  } else if (system.value?.entityTypes.length) {
    activeTypeId.value = system.value.entityTypes[0].id
  }
})

watch([fieldConfigIdx, activeTypeId], () => {
  const f = fieldConfigIdx.value !== null ? activeType.value?.fields[fieldConfigIdx.value] : null
  if (f) {
    draftLabel.value = f.label
    draftKey.value = f.key
    keyManuallyEdited.value = !f.key.startsWith('field_') && f.key !== labelToKey(f.label)
  }
}, { immediate: true })

function addEntityType() {
  const et: EntityTypeSchema = {
    id: `type_${Date.now()}`,
    name: 'New Type', plural: 'New Types',
    icon: 'gi-scroll-unfurled', color: '#6b9fe8', fields: [],
  }
  systemsStore.updateSystem(systemId, { entityTypes: [...(system.value?.entityTypes ?? []), et] })
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
  systemsStore.updateSystem(systemId, {
    entityTypes: (system.value?.entityTypes ?? []).map(t =>
      t.id === activeTypeId.value ? { ...t, [key]: value } : t
    )
  })
}

function addField() {
  const f: FieldSchema = {
    key: `field_${Date.now()}`, label: 'New Field', component: 'text',
    config: {}, required: false, showInCard: false, showInHeader: false, sortable: false,
  }
  const fields = [...(activeType.value?.fields ?? []), f]
  patchType('fields', fields)
  fieldConfigIdx.value = fields.length - 1
  draftLabel.value = f.label
  draftKey.value = f.key
  keyManuallyEdited.value = false
}

function deleteField(i: number) {
  const key = activeType.value?.fields[i]?.key
  patchType('fields', (activeType.value?.fields ?? []).filter((_, idx) => idx !== i))
  if (key) removeSectionFieldKey(key)
  if (fieldConfigIdx.value === i) fieldConfigIdx.value = null
}

function patchField(i: number, changes: Partial<FieldSchema>) {
  patchType('fields', (activeType.value?.fields ?? []).map((f, idx) => idx === i ? { ...f, ...changes } : f))
}

function toggleFieldFlag(i: number, flag: 'showInCard' | 'required') {
  const f = activeType.value?.fields[i]
  if (!f) return
  patchField(i, { [flag]: !f[flag] })
}

function saveDraftLabel() {
  if (fieldConfigIdx.value === null) return
  const trimmed = draftLabel.value.trim()
  if (!trimmed) return
  const changes: Partial<FieldSchema> = { label: trimmed }
  if (!keyManuallyEdited.value) {
    const newKey = labelToKey(trimmed)
    draftKey.value = newKey
    changes.key = newKey
  }
  patchField(fieldConfigIdx.value, changes)
}

function saveDraftKey() {
  if (fieldConfigIdx.value === null) return
  const trimmed = draftKey.value.trim()
  if (!trimmed) return
  const oldKey = activeType.value?.fields[fieldConfigIdx.value]?.key
  patchField(fieldConfigIdx.value, { key: trimmed })
  if (oldKey && oldKey !== trimmed) patchSectionFieldKeys(oldKey, trimmed)
}

const unassignedFields = computed(() => {
  const assigned = new Set((activeType.value?.sections ?? []).flatMap(s => s.fields))
  return (activeType.value?.fields ?? []).filter(f => !assigned.has(f.key))
})

function fieldLabel(key: string): string {
  return activeType.value?.fields.find(f => f.key === key)?.label ?? key
}

function addSection() {
  const s: SectionDef = { id: `sec_${Date.now()}`, title: '', style: 'auto', fields: [] }
  patchType('sections', [...(activeType.value?.sections ?? []), s])
}

function deleteSection(id: string) {
  patchType('sections', (activeType.value?.sections ?? []).filter(s => s.id !== id))
}

function patchSection(id: string, changes: Partial<SectionDef>) {
  patchType('sections', (activeType.value?.sections ?? []).map(s => s.id === id ? { ...s, ...changes } : s))
}

function addFieldToSection(sectionId: string, fieldKey: string) {
  let secs = (activeType.value?.sections ?? []).map(s => ({ ...s, fields: s.fields.filter(k => k !== fieldKey) }))
  secs = secs.map(s => s.id === sectionId ? { ...s, fields: [...s.fields, fieldKey] } : s)
  patchType('sections', secs)
}

function removeFromSection(sectionId: string, fieldKey: string) {
  patchType('sections', (activeType.value?.sections ?? []).map(s =>
    s.id === sectionId ? { ...s, fields: s.fields.filter(k => k !== fieldKey) } : s
  ))
}

function patchSectionFieldKeys(oldKey: string, newKey: string) {
  if (!activeType.value?.sections?.length) return
  patchType('sections', activeType.value.sections.map(s => ({ ...s, fields: s.fields.map(k => k === oldKey ? newKey : k) })))
}

function removeSectionFieldKey(key: string) {
  if (!activeType.value?.sections?.length) return
  patchType('sections', activeType.value.sections.map(s => ({ ...s, fields: s.fields.filter(k => k !== key) })))
}

const dragSrcSectionIdx = ref<number | null>(null)
const dragOverSectionIdx = ref<number | null>(null)

function onSectionDragStart(i: number, e: DragEvent) {
  dragSrcSectionIdx.value = i
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onSectionDrop(targetIdx: number) {
  if (dragSrcSectionIdx.value === null || dragSrcSectionIdx.value === targetIdx) {
    dragSrcSectionIdx.value = null; dragOverSectionIdx.value = null; return
  }
  const secs = [...(activeType.value?.sections ?? [])]
  const [moved] = secs.splice(dragSrcSectionIdx.value, 1)
  secs.splice(targetIdx, 0, moved)
  patchType('sections', secs)
  dragSrcSectionIdx.value = null; dragOverSectionIdx.value = null
}

function onDragStart(i: number, e: DragEvent) {
  dragSrcIdx.value = i
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDrop(targetIdx: number) {
  if (dragSrcIdx.value === null || dragSrcIdx.value === targetIdx) {
    dragSrcIdx.value = null; dragOverIdx.value = null; return
  }
  const fields = [...(activeType.value?.fields ?? [])]
  const [moved] = fields.splice(dragSrcIdx.value, 1)
  fields.splice(targetIdx, 0, moved)
  patchType('fields', fields)
  if (fieldConfigIdx.value === dragSrcIdx.value) fieldConfigIdx.value = targetIdx
  dragSrcIdx.value = null; dragOverIdx.value = null
}

function sampleValue(f: FieldSchema): string {
  switch (f.component) {
    case 'text':        return f.config.placeholder ?? f.label
    case 'number':      return `10${f.config.unit ? ' ' + f.config.unit : ''}`
    case 'select':      return f.config.options?.[0] ?? 'Option A'
    case 'multiselect': return (f.config.options?.slice(0, 2) ?? ['Tag A', 'Tag B']).join(', ')
    case 'toggle':      return 'Yes'
    case 'tracker':     return `${f.config.defaultMax ?? 10} / ${f.config.defaultMax ?? 10}`
    case 'textarea':    return '(description…)'
    case 'dice':        return f.config.defaultExpression ?? '2d6'
    case 'clock':       return `0 / ${f.config.segments ?? 6}`
    case 'rating':      return `— / ${f.config.ratingMax ?? 5}`
    case 'tags':        return 'tag · tag'
    case 'checklist':   return `${f.config.checklistItems?.length ?? 0} items`
    default:            return '—'
  }
}
</script>

<style scoped>
/* ── Three-column builder shell ── */
.bldr-shell {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Column 1: Entity type list */
.bldr-types {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--surface);
}

/* Column 2: Fields / Sections editor */
.bldr-fields {
  width: 340px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}
.bldr-fields--empty {
  align-items: center;
  justify-content: center;
}

/* Column 3: Config / Preview */
.bldr-preview {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
  backdrop-filter: blur(24px);
}

/* Column header */
.bldr-col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.bldr-col-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text3);
  flex: 1;
}

/* Type list */
.bldr-type-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.bldr-type-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--r1);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 1px;
}
.bldr-type-row:hover { background: var(--surface-hi); }
.bldr-type-dot { width: 8px; height: 8px; border-radius: 3px; flex-shrink: 0; }
.bldr-type-info { flex: 1; min-width: 0; }
.bldr-type-name { display: block; font-size: 13px; font-weight: 500; color: var(--text); }
.bldr-type-count { font-size: 10px; color: var(--text3); font-family: var(--fm); }
.bldr-type-del {
  width: 18px; height: 18px; border-radius: var(--r1);
  background: none; border: none; color: var(--text3);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 11px; opacity: 0; transition: opacity 0.15s;
}
.bldr-type-row:hover .bldr-type-del { opacity: 1; }
.bldr-type-del:hover { color: var(--danger); }

/* Type meta */
.bldr-type-meta {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bldr-meta-row { display: flex; gap: 10px; }
.bldr-meta-field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.bldr-color-row { display: flex; align-items: center; gap: 6px; }
.bldr-color-input { width: 32px; height: 28px; border-radius: var(--r1); border: 1px solid var(--border); padding: 2px; cursor: pointer; background: none; }

/* Mode toggle */
.bldr-mode-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: var(--r1);
  overflow: hidden;
}
.bldr-mode-btn {
  padding: 3px 9px;
  font-size: 11px; font-weight: 500;
  color: var(--text3); background: none; border: none;
  cursor: pointer; transition: all 0.12s; font-family: var(--fu);
}
.bldr-mode-btn + .bldr-mode-btn { border-left: 1px solid var(--border); }
.bldr-mode-btn.active { background: var(--accent-bg); color: var(--accent); }

/* Divider */
.bldr-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  flex-shrink: 0;
}
.bldr-divider span {
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text3); white-space: nowrap;
}
.bldr-divider::before, .bldr-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--border);
}

/* Field list */
.bldr-field-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
}
.bldr-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.12s;
  border-left: 2px solid transparent;
}
.bldr-field-row:hover { background: var(--surface-hi); }
.bldr-field-row.active { background: var(--accent-bg); border-left-color: var(--accent); }
.bldr-field-row.drag-over { border-bottom-color: var(--accent); }
.bldr-field-drag { color: var(--text3); font-size: 12px; cursor: grab; flex-shrink: 0; opacity: 0.5; }
.bldr-field-badge {
  font-size: 9px; font-weight: 600;
  padding: 1px 5px; border: 1px solid currentColor;
  border-radius: var(--r1); text-transform: uppercase;
  letter-spacing: 0.06em; flex-shrink: 0; opacity: 0.85;
}
.ftype-text { color: #6b9fe8; }
.ftype-textarea { color: #a87de8; }
.ftype-number { color: var(--accent-l); }
.ftype-select { color: #7cc44e; }
.ftype-multiselect { color: #4ab8e8; }
.ftype-toggle { color: var(--danger); }
.ftype-image { color: #e8924a; }
.ftype-tracker { color: var(--success); }
.bldr-field-label { font-size: 13px; color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bldr-field-key { font-family: var(--fm); font-size: 10px; color: var(--text3); flex-shrink: 0; }
.bldr-field-actions { display: flex; align-items: center; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.bldr-field-row:hover .bldr-field-actions { opacity: 1; }
.bldr-flag {
  width: 20px; height: 20px; border-radius: var(--r1);
  background: none; border: none; color: var(--text3);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 11px; transition: all 0.12s;
}
.bldr-flag.on { color: var(--accent); }
.bldr-flag:hover { color: var(--text2); }
.bldr-field-del {
  width: 20px; height: 20px; border-radius: var(--r1);
  background: none; border: none; color: var(--text3);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 11px; transition: all 0.12s;
}
.bldr-field-del:hover { color: var(--danger); background: var(--danger-bg); }

/* Config body */
.bldr-config-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.bldr-config-row { display: flex; gap: 10px; }
.bldr-component-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
}
.bldr-component-opt {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 6px;
  border-radius: var(--r1);
  background: var(--surface-hi);
  border: 1px solid var(--border);
  color: var(--text3);
  font-size: 10px; font-weight: 500;
  cursor: pointer; transition: all 0.12s;
  font-family: var(--fu);
}
.bldr-component-opt.active { background: var(--accent-bg); border-color: oklch(58% 0.24 295/0.4); color: var(--accent); }
.bldr-component-opt:hover:not(.active) { color: var(--text2); border-color: var(--border-hi); }

.bldr-section-sep {
  margin: 6px 0 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text3);
  display: flex;
  align-items: center;
  gap: 6px;
}
.bldr-section-sep::before,
.bldr-section-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* Section list */
.bldr-section-list {
  flex: 1; overflow-y: auto;
  padding: 8px; display: flex; flex-direction: column; gap: 6px;
}
.bldr-sec-card {
  border: 1px solid var(--border);
  border-radius: var(--r2);
  background: var(--surface);
  padding: 10px;
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color 0.14s;
}
.bldr-sec-card.drag-over { border-color: var(--accent); }
.bldr-sec-head { display: flex; align-items: center; gap: 6px; }
.bldr-sec-title-input {
  flex: 1; background: transparent; border: none;
  border-bottom: 1px solid var(--border);
  font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--text);
  padding: 2px 0; outline: none; font-family: var(--fu);
}
.bldr-sec-title-input:focus { border-bottom-color: var(--accent); }
.bldr-sec-title-input::placeholder { color: var(--text3); font-weight: 400; text-transform: none; letter-spacing: 0; }
.bldr-sec-style-row { display: flex; gap: 4px; }
.bldr-sec-style-btn {
  padding: 2px 8px; font-size: 10px; font-weight: 500;
  background: none; border: 1px solid var(--border);
  border-radius: var(--r1); color: var(--text3);
  cursor: pointer; transition: all 0.12s; font-family: var(--fu);
}
.bldr-sec-style-btn.active { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }
.bldr-sec-chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.bldr-sec-chip {
  display: flex; align-items: center; gap: 3px;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 99px; padding: 2px 6px 2px 8px;
  font-size: 11px; color: var(--text2);
}
.bldr-sec-chip button { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 13px; line-height: 1; padding: 0 1px; }
.bldr-sec-chip button:hover { color: var(--danger); }
.bldr-sec-add-select {
  background: transparent; border: 1px dashed var(--border);
  border-radius: 99px; padding: 2px 8px;
  font-size: 11px; color: var(--text3);
  cursor: pointer; outline: none; font-family: var(--fu);
}
.bldr-sec-add-select:hover { border-color: var(--accent); color: var(--accent); }
.bldr-unassigned-pool { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
.bldr-unassigned-chip {
  border: 1px dashed var(--border); border-radius: 99px;
  padding: 2px 10px; font-size: 11px; color: var(--text3); font-style: italic;
}

/* Preview body */
.bldr-preview-body {
  flex: 1; overflow-y: auto; padding: 16px;
}
.bldr-preview-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 24px; text-align: center;
}
.bldr-empty-hint {
  font-size: 13px; color: var(--text3); text-align: center; line-height: 1.6;
}
</style>
