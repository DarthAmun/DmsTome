<template>
  <div class="f-cur">
    <div v-if="mode === 'view'" class="f-cur-view">
      <span v-if="v.amount != null" class="f-cur-amount">{{ v.amount }}</span>
      <span v-if="v.denomination" class="f-cur-denom" :style="{ color: denomColor }">{{ v.denomination }}</span>
      <span v-if="v.amount == null && !v.denomination" class="f-view-empty">—</span>
    </div>
    <div v-else class="f-cur-edit">
      <input
        class="f-cur-input f-mono"
        type="number"
        min="0"
        step="1"
        :value="v.amount ?? 0"
        @change="set('amount', +($event.target as HTMLInputElement).value)"
      />
      <div class="f-cur-denoms">
        <button
          v-for="d in denoms"
          :key="d"
          class="f-cur-btn"
          :class="{ 'f-cur-btn--active': v.denomination === d }"
          :style="v.denomination === d ? { borderColor: denomColors[d], color: denomColors[d] } : {}"
          @click="set('denomination', d)"
        >{{ d }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const DEFAULT_DENOMS = ['cp', 'sp', 'gp', 'pp']
const DENOM_COLORS: Record<string, string> = {
  cp: '#b87333',
  sp: '#aaa9ad',
  gp: '#c9973a',
  pp: '#a8c4d0',
}

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const denoms = computed(() =>
  props.field.config.denominationOptions?.length ? props.field.config.denominationOptions : DEFAULT_DENOMS
)
const denomColors = computed(() => DENOM_COLORS)

const v = computed(() => {
  if (props.value && typeof props.value === 'object') return props.value
  return { amount: props.value ?? null, denomination: denoms.value[2] ?? 'gp' }
})

const denomColor = computed(() => DENOM_COLORS[v.value.denomination] ?? 'var(--gold)')

function set(key: string, val: any) { emit('update', { ...v.value, [key]: val }) }
</script>

<style scoped>
.f-cur-view {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 15px;
}
.f-cur-amount {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--ink);
}
.f-cur-denom {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.f-view-empty { font-size: 13px; color: var(--ink-ghost); }

.f-cur-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.f-cur-input {
  width: 80px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  padding: 5px 8px;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 14px;
  outline: none;
  transition: border-color 0.12s;
}
.f-cur-input:focus { border-color: var(--gold); }

.f-cur-denoms { display: flex; gap: 3px; }

.f-cur-btn {
  padding: 4px 10px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  cursor: pointer;
  transition: all 0.12s;
}
.f-cur-btn:hover { color: var(--ink); border-color: var(--ink-faded); }
.f-cur-btn--active { background: color-mix(in srgb, currentColor 10%, transparent); }

.f-mono { font-family: var(--font-mono) !important; }
</style>
