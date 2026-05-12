<template>
  <div class="f-dmg">
    <!-- View -->
    <div v-if="mode === 'view'" class="f-dmg-view">
      <span v-if="!rows.length" class="f-view-empty">—</span>
      <template v-for="(row, i) in rows" :key="i">
        <span v-if="i > 0" class="f-dmg-plus">+</span>
        <span class="f-dmg-expr">{{ row.dice }}</span>
        <span class="f-dmg-type">{{ row.type }}</span>
        <span v-if="row.condition" class="f-dmg-cond">({{ row.condition }})</span>
      </template>
    </div>

    <!-- Edit -->
    <div v-else class="f-dmg-edit">
      <div v-for="(row, i) in rows" :key="i" class="f-dmg-row">
        <input
          class="f-dmg-input f-dmg-input--dice f-mono"
          :value="row.dice"
          placeholder="1d6+3"
          @input="setRow(i, 'dice', ($event.target as HTMLInputElement).value)"
        />
        <input
          class="f-dmg-input f-dmg-input--type"
          :value="row.type"
          placeholder="type"
          @input="setRow(i, 'type', ($event.target as HTMLInputElement).value)"
        />
        <input
          class="f-dmg-input f-dmg-input--cond"
          :value="row.condition || ''"
          placeholder="on crit…"
          @input="setRow(i, 'condition', ($event.target as HTMLInputElement).value)"
        />
        <button class="f-dmg-rm" title="Remove" @click="removeRow(i)">×</button>
      </div>
      <button class="f-dmg-add" @click="addRow">+ damage</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

interface DmgRow { dice: string; type: string; condition?: string }

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const rows = computed<DmgRow[]>(() => Array.isArray(props.value) ? props.value : [])

function setRow(i: number, key: keyof DmgRow, val: string) {
  const next = rows.value.map((r, idx) => idx === i ? { ...r, [key]: val } : r)
  emit('update', next)
}
function addRow() {
  emit('update', [...rows.value, { dice: '', type: '', condition: '' }])
}
function removeRow(i: number) {
  emit('update', rows.value.filter((_, idx) => idx !== i))
}
</script>

<style scoped>
.f-dmg-view {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  font-size: 14px;
}
.f-dmg-plus { color: var(--ink-ghost); padding: 0 2px; }
.f-dmg-expr { font-family: var(--font-mono); color: var(--ink); font-weight: 600; }
.f-dmg-type { color: var(--ink-faded); font-style: italic; }
.f-dmg-cond { font-size: 11px; color: var(--ink-ghost); }

.f-view-empty { font-size: 13px; color: var(--ink-ghost); }

.f-dmg-edit { display: flex; flex-direction: column; gap: 5px; }

.f-dmg-row {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.f-dmg-input {
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  padding: 4px 7px;
  color: var(--ink);
  font-size: 13px;
  outline: none;
  transition: border-color 0.12s;
}
.f-dmg-input:focus { border-color: var(--gold); }
.f-dmg-input--dice { width: 90px; font-family: var(--font-mono); }
.f-dmg-input--type { width: 90px; }
.f-dmg-input--cond { flex: 1; min-width: 80px; color: var(--ink-faded); font-size: 12px; }

.f-dmg-rm {
  background: none;
  border: none;
  color: var(--ink-ghost);
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.12s;
}
.f-dmg-rm:hover { color: var(--blood); }

.f-dmg-add {
  align-self: flex-start;
  margin-top: 2px;
  padding: 4px 10px;
  background: none;
  border: 1px dashed var(--parch-line);
  border-radius: 2px;
  color: var(--ink-ghost);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}
.f-dmg-add:hover { border-color: var(--gold); color: var(--gold); }

.f-mono { font-family: var(--font-mono) !important; }
</style>
