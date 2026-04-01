<template>
  <div class="el-layout">
    <template v-for="sec in resolvedSections" :key="sec.id">
      <div v-if="sec.title" class="el-section-title" :style="{ borderColor: accentColor ?? 'var(--parch-line)' }">
        {{ sec.title }}
      </div>
      <div class="el-section-grid" :style="gridStyle(sec.style)">
        <template v-for="key in sec.fields" :key="key">
          <div v-if="fieldByKey(key)" class="el-field-wrap"
            :class="{ 'el-field-wide': isWideField(fieldByKey(key)!) }">
            <label class="el-field-label">{{ fieldByKey(key)!.label }}</label>
            <FieldRenderer
              :field="fieldByKey(key)!"
              :value="data[key]"
              :mode="mode"
              :system-id="systemId"
              @update="v => $emit('update', key, v)"
            />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EntityTypeSchema, SectionDef, SectionStyle, FieldSchema } from '~/types/entities'

const props = defineProps<{
  entityType: EntityTypeSchema
  data: Record<string, any>
  mode: 'view' | 'edit'
  accentColor?: string
  systemId?: number
}>()
defineEmits<{ update: [key: string, value: any] }>()

const WIDE_COMPONENTS = new Set(['textarea', 'tracker', 'statblock', 'abilities', 'spellslots', 'conditions', 'checklist'])

function fieldByKey(key: string): FieldSchema | undefined {
  return props.entityType.fields.find(f => f.key === key)
}

function isWideField(f: FieldSchema): boolean {
  return WIDE_COMPONENTS.has(f.component)
}

function gridStyle(style: SectionStyle): string {
  switch (style) {
    case 'full':      return 'grid-template-columns: 1fr'
    case 'two-col':   return 'grid-template-columns: 1fr 1fr'
    case 'three-col': return 'grid-template-columns: 1fr 1fr 1fr'
    default:          return 'grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr))'
  }
}

const resolvedSections = computed<SectionDef[]>(() => {
  const s = props.entityType.sections
  if (!s || s.length === 0) {
    return [{ id: '__flat', style: 'auto', fields: props.entityType.fields.map(f => f.key) }]
  }
  const assigned = new Set(s.flatMap(sec => sec.fields))
  const orphans = props.entityType.fields.map(f => f.key).filter(k => !assigned.has(k))
  if (!orphans.length) return s
  return [...s, { id: '__orphans', title: 'Other', style: 'auto', fields: orphans }]
})
</script>

<style scoped>
.el-layout { display: flex; flex-direction: column; gap: 20px; }

.el-section-title {
  font-family: var(--font-head);
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.2em;
  color: var(--ink-faded);
  padding-bottom: 6px;
  border-bottom: 1px solid;
  margin-bottom: -8px;
}

.el-section-grid {
  display: grid;
  gap: 18px;
}

.el-field-wrap {
  display: flex; flex-direction: column; gap: 5px;
  min-width: 0; overflow: hidden;
}

.el-field-wide { grid-column: 1 / -1; }

.el-field-label {
  font-family: var(--font-head);
  font-size: 9px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.15em;
  color: var(--ink-ghost);
}
</style>
