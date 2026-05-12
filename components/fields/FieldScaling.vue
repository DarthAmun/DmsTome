<template>
  <div class="f-scale">
    <!-- View -->
    <div v-if="mode === 'view'" class="f-scale-view">
      <span v-if="!rows.length" class="f-view-empty">—</span>
      <div v-for="(row, i) in rows" :key="i" class="f-scale-entry">
        <span class="f-scale-trigger">{{ row.trigger }}</span>
        <span class="f-scale-effect">{{ row.effect }}</span>
      </div>
    </div>

    <!-- Edit -->
    <div v-else class="f-scale-edit">
      <div v-for="(row, i) in rows" :key="i" class="f-scale-row">
        <input
          class="f-scale-input f-scale-input--trigger"
          :value="row.trigger"
          :placeholder="triggerPlaceholder"
          @input="setRow(i, 'trigger', ($event.target as HTMLInputElement).value)"
        />
        <input
          class="f-scale-input f-scale-input--effect"
          :value="row.effect"
          placeholder="effect…"
          @input="setRow(i, 'effect', ($event.target as HTMLInputElement).value)"
        />
        <button class="f-scale-rm" title="Remove" @click="removeRow(i)">×</button>
      </div>
      <button class="f-scale-add" @click="addRow">+ level</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

interface ScaleRow { trigger: string; effect: string }

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const rows = computed<ScaleRow[]>(() => Array.isArray(props.value) ? props.value : [])

const triggerPlaceholder = computed(() => {
  switch (props.field.config.scalingType) {
    case 'heighten': return '+N'
    case 'level': return 'Level N'
    default: return 'trigger…'
  }
})

function setRow(i: number, key: keyof ScaleRow, val: string) {
  emit('update', rows.value.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
}
function addRow() { emit('update', [...rows.value, { trigger: '', effect: '' }]) }
function removeRow(i: number) { emit('update', rows.value.filter((_, idx) => idx !== i)) }
</script>

<style scoped>
.f-scale-view { display: flex; flex-direction: column; gap: 4px; }

.f-scale-entry {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 13px;
}
.f-scale-trigger {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--gold);
  min-width: 64px;
  flex-shrink: 0;
  white-space: nowrap;
}
.f-scale-effect { color: var(--ink); }

.f-view-empty { font-size: 13px; color: var(--ink-ghost); }

.f-scale-edit { display: flex; flex-direction: column; gap: 5px; }

.f-scale-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.f-scale-input {
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  padding: 4px 7px;
  color: var(--ink);
  font-size: 13px;
  outline: none;
  transition: border-color 0.12s;
}
.f-scale-input:focus { border-color: var(--gold); }
.f-scale-input--trigger {
  width: 80px;
  font-family: var(--font-mono);
  font-size: 12px;
  flex-shrink: 0;
}
.f-scale-input--effect { flex: 1; }

.f-scale-rm {
  background: none;
  border: none;
  color: var(--ink-ghost);
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.12s;
}
.f-scale-rm:hover { color: var(--blood); }

.f-scale-add {
  align-self: flex-start;
  padding: 3px 10px;
  background: none;
  border: 1px dashed var(--parch-line);
  border-radius: 2px;
  color: var(--ink-ghost);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}
.f-scale-add:hover { border-color: var(--gold); color: var(--gold); }
</style>
