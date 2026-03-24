<template>
  <div class="sb-grid" :style="{ gridTemplateColumns: `repeat(${STATS.length}, 1fr)` }">
    <div v-for="stat in STATS" :key="stat.key" class="sb-cell">
      <span class="sb-label">{{ stat.label }}</span>
      <input v-if="mode === 'edit'" class="sb-input" type="number" :min="statMin" :max="statMax"
        :value="vals[stat.key]" @change="set(stat.key, +($event.target as HTMLInputElement).value)" />
      <span v-else class="sb-score">{{ vals[stat.key] }}</span>
      <span v-if="showModifier" class="sb-mod">{{ fmtMod(vals[stat.key]) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const DEFAULT_STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

const STATS = computed(() => {
  const names = props.field.config.stats?.length ? props.field.config.stats : DEFAULT_STATS
  return names.map(n => ({ key: n.toLowerCase().replace(/\s+/g, '_'), label: n }))
})
const statMin = computed(() => props.field.config.statMin ?? 1)
const statMax = computed(() => props.field.config.statMax ?? 30)
const showModifier = computed(() => props.field.config.showModifier !== false)

const defaults = computed(() => Object.fromEntries(STATS.value.map(s => [s.key, 10])))
const vals = computed(() => ({ ...defaults.value, ...(props.value ?? {}) }))
const fmtMod = (v: number) => { const m = Math.floor((v - 10) / 2); return (m >= 0 ? '+' : '') + m }
function set(key: string, v: number) {
  emit('update', { ...vals.value, [key]: Math.max(statMin.value, Math.min(statMax.value, v || 10)) })
}
</script>

<style scoped>
.sb-grid { display: grid; gap: 6px; }
.sb-cell {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: var(--parch-dark); border: 1px solid var(--parch-line);
  border-radius: 3px; padding: 8px 4px;
}
.sb-label { font-family: var(--font-head); font-size: 8px; font-weight: 700; letter-spacing: 0.15em; color: var(--ink-faded); text-transform: uppercase; }
.sb-score { font-family: var(--font-head); font-size: 18px; font-weight: 700; color: var(--ink); line-height: 1; }
.sb-input { font-family: var(--font-head); font-size: 16px; font-weight: 700; width: 36px; text-align: center; background: transparent; border: none; border-bottom: 1px solid var(--gold); color: var(--ink); outline: none; }
.sb-mod { font-size: 11px; color: var(--ink-faded); font-family: var(--font-body); }
</style>
