<template>
  <div class="field-wrap">
    <div v-if="items.length" class="f-checklist">
      <label
        v-for="(item, i) in items" :key="i"
        class="f-check-row"
        :class="{ checked: isChecked(i), readonly: mode !== 'edit' }"
        @click.prevent="toggle(i)"
      >
        <span class="f-check-box" :class="{ filled: isChecked(i) }">
          <svg v-if="isChecked(i)" viewBox="0 0 12 12" width="10" height="10">
            <polyline points="2,6 5,9 10,3" stroke="currentColor" stroke-width="2"
              fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="f-check-label">{{ item }}</span>
      </label>
    </div>
    <div v-else class="f-check-empty">
      <em>No items — add them in the builder config.</em>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const items = computed<string[]>(() => props.field.config.checklistItems ?? [])
// value is boolean[] indexed by item position
const checked = computed<boolean[]>(() => Array.isArray(props.value) ? props.value : [])

function isChecked(i: number): boolean { return checked.value[i] ?? false }

function toggle(i: number) {
  if (props.mode !== 'edit') return
  const next = [...checked.value]
  while (next.length <= i) next.push(false)
  next[i] = !next[i]
  emit('update', next)
}
</script>

<style scoped>
.f-checklist { display: flex; flex-direction: column; gap: 4px; }

.f-check-row {
  display: flex; align-items: center; gap: 9px;
  padding: 5px 4px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.12s;
  user-select: none;
}
.f-check-row:not(.readonly):hover { background: rgba(28,20,16,0.04); }
.f-check-row.readonly { cursor: default; }

.f-check-box {
  width: 16px; height: 16px; flex-shrink: 0;
  border: 1.5px solid var(--parch-line);
  border-radius: 2px;
  background: var(--parch-dark);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  color: var(--parch);
}
.f-check-box.filled {
  background: var(--blood);
  border-color: var(--blood);
}
.f-check-row:not(.readonly):hover .f-check-box:not(.filled) {
  border-color: var(--ink-ghost);
}

.f-check-label {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  transition: opacity 0.15s;
}
.f-check-row.checked .f-check-label {
  text-decoration: line-through;
  opacity: 0.45;
  color: var(--ink-ghost);
}

.f-check-empty {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-ghost);
  font-style: italic;
}
</style>
