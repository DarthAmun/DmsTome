<template>
  <div class="builder-folio">
    <div class="open-book">

      <!-- LEFT PAGE -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <div class="page-header">
            <div class="page-chapter-num">{{ system?.name ?? 'System' }}</div>
            <h1 class="page-title">Builder</h1>
            <div class="page-rule" />
          </div>
          <div class="builder-left-split">

            <!-- Entity type list -->
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
          <OhVueIcon :name="safeIcon(et.icon)" scale="0.9" :style="{ color: et.color }" />
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

            <!-- Fields / Layout editor -->
    <div class="builder-fields" v-if="activeType">
      <!-- Type meta -->
      <div class="panel-header">
        <span class="panel-title">{{ activeType.name || 'Entity Type' }}</span>
        <div class="mode-toggle">
          <button class="mode-btn" :class="{ active: middleMode === 'fields' }" @click="middleMode = 'fields'">Fields</button>
          <button class="mode-btn" :class="{ active: middleMode === 'layout' }" @click="middleMode = 'layout'">Layout</button>
        </div>
        <button v-if="middleMode === 'fields'" class="icon-btn" @click="addField" title="Add field">
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

      <!-- FIELDS MODE -->
      <template v-if="middleMode === 'fields'">
        <div class="fields-divider"><span>Fields</span></div>
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
              <OhVueIcon name="md-draghandle" scale="0.9" style="color:var(--ink-ghost);cursor:grab" @mousedown.stop />
              <span class="field-type-badge" :class="`ftype-${field.component}`">{{ field.component }}</span>
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
      </template>

      <!-- LAYOUT MODE -->
      <template v-else>
        <div class="fields-divider">
          <span>Sections</span>
          <button class="icon-btn" style="margin-left:auto" @click="addSection" title="Add section">
            <OhVueIcon name="md-add" scale="0.9" />
          </button>
        </div>
        <div class="section-list">
          <div
            v-for="(sec, si) in activeType.sections ?? []" :key="sec.id"
            class="sec-card"
            :class="{ 'drag-over': dragOverSectionIdx === si }"
            draggable="true"
            @dragstart="onSectionDragStart(si, $event)"
            @dragover.prevent="dragOverSectionIdx = si"
            @dragleave="dragOverSectionIdx = null"
            @drop.prevent="onSectionDrop(si)"
            @dragend="dragOverSectionIdx = null"
          >
            <div class="sec-card-head">
              <OhVueIcon name="md-draghandle" scale="0.9" style="color:var(--ink-ghost);cursor:grab;flex-shrink:0" @mousedown.stop />
              <input class="sec-title-input" :value="sec.title ?? ''" placeholder="Section title…"
                @input="patchSection(sec.id, { title: ($event.target as HTMLInputElement).value || undefined })" />
              <button class="field-delete" style="opacity:1" @click="deleteSection(sec.id)" title="Delete section">
                <OhVueIcon name="md-close" scale="0.8" />
              </button>
            </div>
            <div class="sec-style-row">
              <button v-for="opt in SECTION_STYLE_OPTIONS" :key="opt.value"
                class="sec-style-btn" :class="{ active: sec.style === opt.value }"
                @click="patchSection(sec.id, { style: opt.value as SectionStyle })">
                {{ opt.label }}
              </button>
            </div>
            <div class="sec-chips">
              <div v-for="key in sec.fields" :key="key" class="sec-chip">
                <span class="sec-chip-label">{{ fieldLabel(key) }}</span>
                <button class="sec-chip-del" @click="removeFromSection(sec.id, key)" title="Remove">×</button>
              </div>
              <select v-if="unassignedFields.length" class="sec-add-select"
                @change="e => { const v = (e.target as HTMLSelectElement).value; if(v) { addFieldToSection(sec.id, v); (e.target as HTMLSelectElement).value = '' } }">
                <option value="">+ Add field</option>
                <option v-for="f in unassignedFields" :key="f.key" :value="f.key">{{ f.label }}</option>
              </select>
            </div>
          </div>

          <div v-if="!activeType.sections?.length" class="field-empty">
            No sections yet.<br>Click + to create one, then add fields to it.
          </div>

          <!-- Unassigned fields pool -->
          <template v-if="unassignedFields.length && activeType.sections?.length">
            <div class="fields-divider" style="margin: 4px 0"><span>Unassigned</span></div>
            <div class="unassigned-pool">
              <div v-for="f in unassignedFields" :key="f.key" class="unassigned-chip">
                {{ f.label }}
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>

            <div v-else class="builder-fields builder-fields--empty">
              <OhVueIcon name="gi-book-aura" scale="3" style="opacity:0.1;margin-bottom:12px" />
              <p style="color:var(--ink-ghost);font-size:13px">Select or create an entity type</p>
            </div>

          </div><!-- /builder-left-split -->
        </div><!-- /book-leaf--left -->
      </div><!-- /book-stack--left -->

      <div class="book-binding"></div>

      <!-- RIGHT PAGE -->
      <div class="book-stack book-stack--right">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--right">
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
                @click="patchField(fieldConfigIdx!, { component: opt.value })">
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
              @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, options: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
          </div>
          <div v-if="activeField.component === 'number'" class="config-row">
            <div class="config-field">
              <label class="f-label">Unit</label>
              <input class="f-input" :value="activeField.config.unit ?? ''"
                placeholder="ft, gp…"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, unit: ($event.target as HTMLInputElement).value } })" />
            </div>
            <div class="config-field">
              <label class="f-label">Min</label>
              <input class="f-input" type="number" :value="activeField.config.min ?? ''"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, min: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
            <div class="config-field">
              <label class="f-label">Max</label>
              <input class="f-input" type="number" :value="activeField.config.max ?? ''"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, max: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
          </div>
          <div v-if="activeField.component === 'tracker'" class="config-field">
            <label class="f-label">Default Max</label>
            <input class="f-input" type="number" :value="activeField.config.defaultMax ?? 10"
              @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, defaultMax: Number(($event.target as HTMLInputElement).value) } })" />
          </div>
          <div v-if="activeField.component === 'text' || activeField.component === 'textarea'" class="config-field">
            <label class="f-label">Placeholder</label>
            <input class="f-input" :value="activeField.config.placeholder ?? ''"
              @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, placeholder: ($event.target as HTMLInputElement).value } })" />
          </div>

          <!-- Dice config -->
          <div v-if="activeField.component === 'dice'" class="config-field">
            <label class="f-label">Default Expression <span class="f-hint">(e.g. 2d6, 1d20+5)</span></label>
            <input class="f-input f-mono" :value="activeField.config.defaultExpression ?? ''"
              placeholder="2d6"
              @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, defaultExpression: ($event.target as HTMLInputElement).value } })" />
          </div>

          <!-- Clock config -->
          <div v-if="activeField.component === 'clock'" class="config-field">
            <label class="f-label">Segments</label>
            <div class="component-grid" style="grid-template-columns: repeat(4,1fr)">
              <button v-for="n in [4, 6, 8, 10]" :key="n"
                class="component-opt" :class="{ active: (activeField.config.segments ?? 6) === n }"
                @click="patchField(fieldConfigIdx!, { config: { ...activeField.config, segments: n } })">
                {{ n }}
              </button>
            </div>
          </div>

          <!-- Rating config -->
          <div v-if="activeField.component === 'rating'" class="config-row">
            <div class="config-field">
              <label class="f-label">Max</label>
              <input class="f-input" type="number" min="1" max="10"
                :value="activeField.config.ratingMax ?? 5"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, ratingMax: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
            <div class="config-field" style="flex:2">
              <label class="f-label">Style</label>
              <div class="component-grid" style="grid-template-columns: repeat(3,1fr)">
                <button v-for="s in ['dot','diamond','skull']" :key="s"
                  class="component-opt" :class="{ active: (activeField.config.ratingStyle ?? 'dot') === s }"
                  @click="patchField(fieldConfigIdx!, { config: { ...activeField.config, ratingStyle: s as any } })">
                  {{ s }}
                </button>
              </div>
            </div>
          </div>

          <!-- Tags config -->
          <div v-if="activeField.component === 'tags'" class="config-field">
            <label class="f-label">Placeholder</label>
            <input class="f-input" :value="activeField.config.placeholder ?? ''"
              placeholder="Add tag…"
              @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, placeholder: ($event.target as HTMLInputElement).value } })" />
          </div>

          <!-- Checklist config -->
          <div v-if="activeField.component === 'checklist'" class="config-field">
            <label class="f-label">Items <span class="f-hint">(one per line)</span></label>
            <textarea class="f-textarea" rows="6"
              :value="(activeField.config.checklistItems ?? []).join('\n')"
              @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, checklistItems: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
          </div>

          <!-- Stat Block config -->
          <template v-if="activeField.component === 'statblock'">
            <div class="config-field">
              <label class="f-label">Stats <span class="f-hint">(one per line, default: STR DEX CON INT WIS CHA)</span></label>
              <textarea class="f-textarea" rows="6"
                :value="(activeField.config.stats ?? []).join('\n')"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, stats: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
            </div>
            <div class="config-row">
              <div class="config-field">
                <label class="f-label">Min</label>
                <input class="f-input" type="number" :value="activeField.config.statMin ?? 1"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, statMin: Number(($event.target as HTMLInputElement).value) } })" />
              </div>
              <div class="config-field">
                <label class="f-label">Max</label>
                <input class="f-input" type="number" :value="activeField.config.statMax ?? 30"
                  @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, statMax: Number(($event.target as HTMLInputElement).value) } })" />
              </div>
            </div>
            <div class="config-field">
              <label class="f-label">
                <input type="checkbox" :checked="activeField.config.showModifier !== false"
                  @change="patchField(fieldConfigIdx!, { config: { ...activeField.config, showModifier: ($event.target as HTMLInputElement).checked } })" />
                Show modifier (floor((val−10)/2))
              </label>
            </div>
          </template>

          <!-- Conditions config -->
          <div v-if="activeField.component === 'conditions'" class="config-field">
            <label class="f-label">Conditions <span class="f-hint">(one per line, leave blank for D&D 5e defaults)</span></label>
            <textarea class="f-textarea" rows="8"
              :value="(activeField.config.conditions ?? []).join('\n')"
              @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, conditions: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
          </div>

          <!-- Speed config -->
          <template v-if="activeField.component === 'speed'">
            <div class="config-field">
              <label class="f-label">Movement modes <span class="f-hint">(one per line, default: Walk Fly Swim Climb Burrow)</span></label>
              <textarea class="f-textarea" rows="5"
                :value="(activeField.config.speedModes ?? []).join('\n')"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, speedModes: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
            </div>
            <div class="config-field">
              <label class="f-label">Unit <span class="f-hint">(e.g. ft, m, squares)</span></label>
              <input class="f-input" :value="activeField.config.speedUnit ?? 'ft'"
                placeholder="ft"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, speedUnit: ($event.target as HTMLInputElement).value } })" />
            </div>
          </template>

          <!-- Spell Slots / Resource Levels config -->
          <template v-if="activeField.component === 'spellslots'">
            <div class="config-field">
              <label class="f-label">Number of levels <span class="f-hint">(default 9)</span></label>
              <input class="f-input" type="number" min="1" max="20"
                :value="activeField.config.slotLevels ?? 9"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, slotLevels: Number(($event.target as HTMLInputElement).value) } })" />
            </div>
            <div class="config-field">
              <label class="f-label">Level names <span class="f-hint">(one per line, leave blank for 1st 2nd 3rd…)</span></label>
              <textarea class="f-textarea" rows="5"
                :value="(activeField.config.slotLevelNames ?? []).join('\n')"
                @input="patchField(fieldConfigIdx!, { config: { ...activeField.config, slotLevelNames: ($event.target as HTMLTextAreaElement).value.split('\n').map(s => s.trim()).filter(Boolean) } })" />
            </div>
          </template>

          <!-- Entity Link config -->
          <template v-if="activeField.component === 'entity-link'">
            <div class="config-field">
              <label class="f-label">Links to entity type</label>
              <select class="f-select"
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

      <!-- Layout preview (shown when in layout mode with no field config open) -->
      <template v-else-if="activeType && middleMode === 'layout'">
        <div class="panel-header">
          <span class="panel-title">Preview</span>
          <span class="panel-hint">detail view</span>
        </div>
        <div class="preview-body">
          <div class="prev-detail">
            <div class="prev-detail-header" :style="{ borderColor: activeType.color + '55' }">
              <OhVueIcon :name="safeIcon(activeType.icon)" scale="1" :style="{ color: activeType.color }" />
              <h2 class="prev-rec-name">Sample {{ activeType.name }}</h2>
              <span class="prev-type-tag" :style="{ color: activeType.color, borderColor: activeType.color }">
                {{ activeType.name }}
              </span>
              <div style="flex:1" />
              <span class="prev-btn">Edit</span>
              <span class="prev-btn prev-btn--danger"><OhVueIcon name="md-delete" scale="0.8" /></span>
            </div>
            <EntityLayout
              :entity-type="activeType"
              :data="{}"
              mode="view"
              :accent-color="activeType.color"
            />
          </div>
        </div>
      </template>

      <!-- Record preview (fields mode) -->
      <template v-else-if="activeType">
        <div class="panel-header">
          <span class="panel-title">Preview</span>
          <span class="panel-hint">sample record</span>
        </div>
        <div class="preview-body">
          <!-- Overview preview -->
          <div class="preview-label">Overview</div>
          <div class="prev-list" :style="{ '--et-color': activeType.color }">
            <div class="prev-entry prev-entry--active">
              <span class="prev-entry-num">1</span>
              <div class="prev-entry-icon">
                <div class="prev-entry-badge">
                  <OhVueIcon :name="safeIcon(activeType.icon)" scale="0.75" :style="{ color: activeType.color }" />
                </div>
              </div>
              <div class="prev-entry-body">
                <div class="prev-entry-top">
                  <span class="prev-entry-name">Sample {{ activeType.name }}</span>
                  <span class="prev-entry-leader" />
                  <span class="prev-entry-date">today</span>
                </div>
                <div v-if="activeType.fields.filter(f => f.showInCard).length" class="prev-entry-attrs">
                  <template v-for="(f, fi) in activeType.fields.filter(f => f.showInCard).slice(0, 3)" :key="f.key">
                    <span v-if="fi > 0" class="prev-ea-sep">✦</span>
                    <span class="prev-ea-pill" :style="{ color: activeType.color, borderColor: activeType.color, background: `color-mix(in srgb, ${activeType.color} 10%, transparent)` }">
                      {{ sampleValue(f) }}
                    </span>
                  </template>
                </div>
              </div>
            </div>
            <div class="prev-entry">
              <span class="prev-entry-num">2</span>
              <div class="prev-entry-icon">
                <div class="prev-entry-badge">
                  <OhVueIcon :name="safeIcon(activeType.icon)" scale="0.75" :style="{ color: activeType.color }" />
                </div>
              </div>
              <div class="prev-entry-body">
                <div class="prev-entry-top">
                  <span class="prev-entry-name">Another {{ activeType.name }}</span>
                  <span class="prev-entry-leader" />
                  <span class="prev-entry-date">2d ago</span>
                </div>
              </div>
            </div>
            <div class="prev-entry">
              <span class="prev-entry-num">3</span>
              <div class="prev-entry-icon">
                <div class="prev-entry-badge">
                  <OhVueIcon :name="safeIcon(activeType.icon)" scale="0.75" :style="{ color: activeType.color }" />
                </div>
              </div>
              <div class="prev-entry-body">
                <div class="prev-entry-top">
                  <span class="prev-entry-name">Third {{ activeType.name }}</span>
                  <span class="prev-entry-leader" />
                  <span class="prev-entry-date">5d ago</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Detail view preview -->
          <div class="preview-label" style="margin-top:20px">Detail View</div>
          <div class="prev-detail">
            <div class="prev-detail-header" :style="{ borderColor: activeType.color + '55' }">
              <OhVueIcon :name="safeIcon(activeType.icon)" scale="1" :style="{ color: activeType.color }" />
              <h2 class="prev-rec-name">Sample {{ activeType.name }}</h2>
              <span class="prev-type-tag" :style="{ color: activeType.color, borderColor: activeType.color }">
                {{ activeType.name }}
              </span>
              <div style="flex:1" />
              <span class="prev-btn">Edit</span>
              <span class="prev-btn prev-btn--danger"><OhVueIcon name="md-delete" scale="0.8" /></span>
            </div>
            <EntityLayout :entity-type="activeType" :data="{}" mode="view" :accent-color="activeType.color" />
          </div>
        </div>
      </template>

      <!-- Empty state: no entity type selected -->
      <template v-if="!activeType && fieldConfigIdx === null">
        <div class="preview-empty">
          <OhVueIcon name="gi-book-aura" scale="3" style="opacity:0.07;margin-bottom:16px" />
          <em class="preview-empty-hint">Select an entity type<br>to configure or preview it.</em>
        </div>
      </template>
          </div><!-- /builder-preview -->
        </div><!-- /book-leaf--right -->
      </div><!-- /book-stack--right -->

    </div><!-- /open-book -->
  </div><!-- /builder-folio -->
</template>

<script setup lang="ts">
import { useSystemsStore } from '~/stores/systems'
import { FIELD_COMPONENT_OPTIONS, SECTION_STYLE_OPTIONS, labelToKey } from '~/types/entities'
import type { FieldSchema, EntityTypeSchema, FieldComponentType, SectionDef, SectionStyle } from '~/types/entities'
import { GI_ICON_NAMES } from '~/plugins/oh-vue-icons.client'

const VALID_ICONS = new Set(GI_ICON_NAMES)
function safeIcon(name: string | undefined): string {
  if (!name) return 'gi-scroll-unfurled'
  return VALID_ICONS.has(name) ? name : 'gi-scroll-unfurled'
}

const route = useRoute()
const systemsStore = useSystemsStore()
const systemId = Number(route.params.id)

const activeTypeId = ref<string | null>(null)
const fieldConfigIdx = ref<number | null>(null)
const dragSrcIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)
const middleMode = ref<'fields' | 'layout'>('fields')
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
  await systemsStore.loadAll()
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
  const key = activeType.value?.fields[i]?.key
  const fields = (activeType.value?.fields ?? []).filter((_, idx) => idx !== i)
  patchType('fields', fields)
  if (key) removeSectionFieldKey(key)
  if (fieldConfigIdx.value === i) fieldConfigIdx.value = null
}

function patchField(i: number, changes: Partial<FieldSchema>) {
  const fields = (activeType.value?.fields ?? []).map((f, idx) =>
    idx === i ? { ...f, ...changes } : f
  )
  patchType('fields', fields)
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
  // Batch label + key into a single store write to avoid race condition
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

// ── Section mutations ─────────────────────────────────────────────────────
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
  patchType('sections', (activeType.value?.sections ?? []).map(s =>
    s.id === id ? { ...s, ...changes } : s
  ))
}

function addFieldToSection(sectionId: string, fieldKey: string) {
  // Remove from any existing section first
  let secs = (activeType.value?.sections ?? []).map(s => ({
    ...s, fields: s.fields.filter(k => k !== fieldKey)
  }))
  secs = secs.map(s => s.id === sectionId ? { ...s, fields: [...s.fields, fieldKey] } : s)
  patchType('sections', secs)
}

function removeFromSection(sectionId: string, fieldKey: string) {
  patchType('sections', (activeType.value?.sections ?? []).map(s =>
    s.id === sectionId ? { ...s, fields: s.fields.filter(k => k !== fieldKey) } : s
  ))
}

function moveSectionField(sectionId: string, fromIdx: number, toIdx: number) {
  const secs = (activeType.value?.sections ?? []).map(s => {
    if (s.id !== sectionId) return s
    const fields = [...s.fields]
    const [moved] = fields.splice(fromIdx, 1)
    fields.splice(toIdx, 0, moved)
    return { ...s, fields }
  })
  patchType('sections', secs)
}

// When a field key is renamed, update all section references
function patchSectionFieldKeys(oldKey: string, newKey: string) {
  if (!activeType.value?.sections?.length) return
  patchType('sections', activeType.value.sections.map(s => ({
    ...s, fields: s.fields.map(k => k === oldKey ? newKey : k)
  })))
}

// When a field is deleted, remove it from sections
function removeSectionFieldKey(key: string) {
  if (!activeType.value?.sections?.length) return
  patchType('sections', activeType.value.sections.map(s => ({
    ...s, fields: s.fields.filter(k => k !== key)
  })))
}

// Section drag state
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
    case 'dice':        return f.config.defaultExpression ?? '2d6'
    case 'clock':       return `0 / ${f.config.segments ?? 6} segments`
    case 'rating':      return `— / ${f.config.ratingMax ?? 5} ${f.config.ratingStyle ?? 'dots'}`
    case 'tags':        return 'tag · tag · tag'
    case 'checklist':   return `${f.config.checklistItems?.length ?? 0} items`
    default:            return '—'
  }
}
</script>

<style scoped>
/* ── Builder — open-book layout ── */

.builder-folio {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: visible;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
}

/* Left leaf: horizontal split between types list and fields editor */
.builder-left-split {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.builder-types {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid var(--parch-line);
  display: flex;
  flex-direction: column;
}

.builder-fields {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.builder-fields--empty {
  align-items: center;
  justify-content: center;
}

/* Right leaf: takes full leaf space, scrolls internally */
.builder-preview {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Panel headers — like chapter headings */
.panel-header {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid var(--parch-line);
  gap: 8px;
  flex-shrink: 0;
}

.panel-title {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--ink-ghost);
  flex: 1;
}

.panel-hint { font-size: 10px; color: var(--ink-ghost); font-family: var(--font-ui); }

.icon-btn {
  width: 22px; height: 22px;
  border-radius: 3px;
  background: transparent;
  border: 1px solid var(--parch-line);
  color: var(--ink-faded);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.icon-btn:hover { background: var(--parch-line); color: var(--ink); }

/* Type list — index entries */
.type-list { flex: 1; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 2px; }

.type-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border-radius: 3px;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  background: transparent;
  border-top: none; border-right: none; border-bottom: 1px dashed var(--parch-line);
}
.type-row:last-child { border-bottom: none; }
.type-row:hover { background: rgba(28,20,16,0.04); }
.type-row.active { border-left-color: var(--blood); background: rgba(139,26,26,0.04); }

.type-row-info { flex: 1; min-width: 0; }
.type-row-name { display: block; font-family: var(--font-body); font-size: 15px; color: var(--ink); }
.type-row-count { font-size: 9px; color: var(--ink-ghost); font-family: var(--font-head); letter-spacing: 0.1em; text-transform: uppercase; }

.type-delete { width: 18px; height: 18px; border-radius: 2px; background: none; border: none; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.type-row:hover .type-delete { opacity: 1; }
.type-delete:hover { color: var(--blood); }

.type-empty { font-family: var(--font-body); font-size: 14px; color: var(--ink-ghost); font-style: italic; text-align: center; padding: 24px 16px; line-height: 1.6; }

/* Type meta — form fields on parchment */
.type-meta { padding: 14px 16px; border-bottom: 1px solid var(--parch-line); flex-shrink: 0; }
.meta-row { display: flex; gap: 12px; margin-bottom: 12px; }
.meta-field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.color-row { display: flex; align-items: center; gap: 8px; }
.color-input { width: 34px; height: 30px; border-radius: 3px; border: 1px solid var(--ink-ghost); padding: 2px; cursor: pointer; background: none; }

/* Fields divider */
.fields-divider { display: flex; align-items: center; gap: 10px; padding: 8px 16px; flex-shrink: 0; }
.fields-divider span { font-family: var(--font-head); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: var(--ink-ghost); white-space: nowrap; }
.fields-divider::before, .fields-divider::after { content: ''; flex: 1; height: 1px; background: var(--parch-line); }

/* Field list */
.field-list { flex: 1; overflow-y: auto; padding: 6px 10px; display: flex; flex-direction: column; gap: 0; }

.field-row {
  display: flex; align-items: center;
  padding: 8px 6px;
  border-bottom: 1px dashed var(--parch-line);
  cursor: pointer;
  transition: all 0.15s;
  gap: 8px;
  background: transparent;
  border-left: 2px solid transparent;
}
.field-row:hover { background: rgba(28,20,16,0.03); padding-left: 10px; }
.field-row.active { background: rgba(139,26,26,0.04); border-left-color: var(--blood); padding-left: 10px; }
.field-row.drag-over { border-bottom-color: var(--gold); background: rgba(184,134,11,0.05); }

.field-row-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.field-row-right { display: flex; align-items: center; gap: 3px; }

.field-type-badge {
  font-family: var(--font-head);
  font-size: 8px; font-weight: 600;
  padding: 1px 5px;
  border: 1px solid currentColor;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
  opacity: 0.8;
}
.ftype-text        { color: #6b9fe8; }
.ftype-textarea    { color: #a87de8; }
.ftype-number      { color: var(--gold); }
.ftype-select      { color: #5a8a3a; }
.ftype-multiselect { color: #3a8aaa; }
.ftype-toggle      { color: var(--blood); }
.ftype-image       { color: #c07040; }
.ftype-tracker     { color: #3a8a5a; }

.field-row-label { font-family: var(--font-body); font-size: 15px; color: var(--ink); }
.field-row-key { font-family: var(--font-mono); font-size: 10px; color: var(--ink-ghost); }

.field-flag { width: 20px; height: 20px; border-radius: 2px; background: none; border: 1px solid transparent; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.field-flag.on { color: var(--gold); }
.field-flag:hover { color: var(--ink-faded); }

.field-delete { width: 20px; height: 20px; border-radius: 2px; background: none; border: none; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.15s; }
.field-row:hover .field-delete { opacity: 1; }
.field-delete:hover { color: var(--blood); }

.field-empty { font-family: var(--font-body); font-size: 14px; color: var(--ink-ghost); font-style: italic; text-align: center; padding: 24px; }

/* Config body — writing in the book */
.config-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; flex: 1; }
.config-field { display: flex; flex-direction: column; gap: 5px; }
.config-row { display: flex; gap: 10px; }

.component-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }
.component-opt {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 8px;
  border-radius: 2px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  color: var(--ink-ghost);
  font-family: var(--font-head); font-size: 9px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  cursor: pointer; transition: all 0.15s;
}
.component-opt.active { background: rgba(184,134,11,0.08); border-color: var(--gold); color: var(--gold); }
.component-opt:hover:not(.active) { color: var(--ink-faded); background: var(--parch-line); }

.f-mono { font-family: var(--font-mono); font-size: 12px; }
.f-hint { font-size: 10px; color: var(--ink-ghost); font-weight: 400; font-family: var(--font-ui); }
.f-error { font-size: 11px; color: var(--blood); font-family: var(--font-ui); }

.f-textarea {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--parch-line);
  padding: 6px 0;
  color: var(--ink);
  font-family: var(--font-ui); font-size: 13px;
  outline: none;
  resize: vertical;
  min-height: 80px;
}
.f-textarea:focus { border-bottom-color: var(--gold); }

/* Preview / right leaf content */
.preview-body { padding: 14px; overflow-y: auto; flex: 1; }
.preview-label { font-family: var(--font-head); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: var(--ink-ghost); margin-bottom: 8px; }

/* Overview entry list preview */
.prev-list {
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  overflow: hidden;
}
.prev-entry {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 7px 8px;
  border-bottom: 1px dashed var(--parch-line);
  border-left: 2px solid transparent;
  transition: border-color 0.15s, background 0.15s;
}
.prev-entry:last-child { border-bottom: none; }
.prev-entry--active {
  border-left-color: var(--et-color, var(--blood));
  background: color-mix(in srgb, var(--et-color, var(--blood)) 7%, transparent);
}
.prev-entry-num {
  font-family: var(--font-mono); font-size: 9px;
  color: var(--ink-ghost); opacity: 0.4;
  width: 14px; flex-shrink: 0; text-align: right; padding-top: 2px; line-height: 1;
}
.prev-entry-icon { width: 28px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.prev-entry-badge {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 13%, transparent);
  border: 1px solid color-mix(in srgb, var(--et-color, var(--ink-ghost)) 30%, transparent);
  flex-shrink: 0;
}
.prev-entry-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.prev-entry-top { display: flex; align-items: center; gap: 5px; }
.prev-entry-name { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prev-entry--active .prev-entry-name { color: var(--et-color, var(--ink)); }
.prev-entry-leader { flex: 1; min-width: 6px; border-bottom: 1px dotted var(--ink-ghost); opacity: 0.3; align-self: center; position: relative; top: 1px; }
.prev-entry-date { font-family: var(--font-head); font-size: 8px; color: var(--ink-ghost); letter-spacing: 0.05em; white-space: nowrap; flex-shrink: 0; }
.prev-entry-attrs { display: flex; flex-wrap: nowrap; align-items: center; gap: 4px; overflow: hidden; padding-bottom: 2px; }
.prev-ea-pill { display: inline-flex; align-items: center; font-family: var(--font-head); font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; padding: 1px 6px; border: 1px solid; border-radius: 2px; white-space: nowrap; flex-shrink: 0; }
.prev-ea-sep { color: var(--gold); font-size: 7px; opacity: 0.6; flex-shrink: 0; align-self: center; user-select: none; }

/* Detail view preview */
.prev-detail {
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  overflow: hidden;
  padding: 14px;
}
.prev-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.prev-rec-name { font-family: var(--font-deco); font-size: 18px; font-weight: 700; color: var(--ink); flex: 1; line-height: 1.2; margin: 0; }
.prev-type-tag { font-family: var(--font-head); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; padding: 2px 7px; border: 1px solid; border-radius: 2px; }
.prev-btn { display: inline-flex; align-items: center; gap: 3px; padding: 4px 10px; border-radius: 2px; background: var(--parch-dark); border: 1px solid var(--parch-line); font-family: var(--font-head); font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faded); }
.prev-btn--danger { color: var(--blood); border-color: rgba(139,26,26,0.2); }

.preview-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 24px; text-align: center;
}
.preview-empty-hint {
  font-family: var(--font-body); font-size: 14px;
  color: var(--ink-ghost); font-style: italic; line-height: 1.7;
}

/* Override global page-title inside the builder page header */
.builder-folio .page-title {
  font-family: var(--font-deco);
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.04em;
  text-transform: none;
  margin-bottom: 0;
}

/* Mode toggle (Fields | Layout) */
.mode-toggle { display: flex; border: 1px solid var(--parch-line); border-radius: 3px; overflow: hidden; }
.mode-btn {
  padding: 3px 8px;
  font-family: var(--font-head); font-size: 8px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  background: transparent; border: none;
  color: var(--ink-ghost); cursor: pointer; transition: all 0.15s;
}
.mode-btn + .mode-btn { border-left: 1px solid var(--parch-line); }
.mode-btn.active { background: var(--gold); color: var(--parch); }

/* Section list */
.section-list { flex: 1; overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; }

.sec-card {
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  background: var(--parch-dark);
  padding: 8px;
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color 0.15s;
}
.sec-card.drag-over { border-color: var(--gold); background: rgba(184,134,11,0.04); }

.sec-card-head { display: flex; align-items: center; gap: 6px; }
.sec-title-input {
  flex: 1; background: transparent; border: none;
  border-bottom: 1px solid var(--parch-line);
  font-family: var(--font-head); font-size: 11px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--ink); padding: 2px 0; outline: none;
}
.sec-title-input:focus { border-bottom-color: var(--gold); }
.sec-title-input::placeholder { color: var(--ink-ghost); font-weight: 400; text-transform: none; letter-spacing: 0; }

.sec-style-row { display: flex; gap: 4px; }
.sec-style-btn {
  padding: 2px 7px;
  font-family: var(--font-head); font-size: 8px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  background: transparent;
  border: 1px solid var(--parch-line);
  border-radius: 2px; color: var(--ink-ghost);
  cursor: pointer; transition: all 0.15s;
}
.sec-style-btn.active { border-color: var(--gold); color: var(--gold); background: rgba(184,134,11,0.08); }
.sec-style-btn:hover:not(.active) { color: var(--ink-faded); }

.sec-chips { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; min-height: 24px; }
.sec-chip {
  display: flex; align-items: center; gap: 3px;
  background: var(--parch); border: 1px solid var(--parch-line);
  border-radius: 999px; padding: 2px 6px 2px 8px;
  font-family: var(--font-head); font-size: 9px;
  color: var(--ink-faded);
}
.sec-chip-label { font-weight: 600; letter-spacing: 0.06em; }
.sec-chip-del {
  background: none; border: none; color: var(--ink-ghost);
  cursor: pointer; font-size: 13px; line-height: 1;
  padding: 0 1px; transition: color 0.15s;
}
.sec-chip-del:hover { color: var(--blood); }
.sec-add-select {
  background: transparent; border: 1px dashed var(--parch-line);
  border-radius: 999px; padding: 2px 6px;
  font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost);
  cursor: pointer; outline: none;
}
.sec-add-select:hover { border-color: var(--gold); color: var(--gold); }

/* Unassigned pool */
.unassigned-pool { display: flex; flex-wrap: wrap; gap: 5px; padding: 6px 0; }
.unassigned-chip {
  border: 1px dashed var(--parch-line);
  border-radius: 999px; padding: 2px 10px;
  font-family: var(--font-head); font-size: 9px; letter-spacing: 0.06em;
  color: var(--ink-ghost); font-style: italic;
}
</style>