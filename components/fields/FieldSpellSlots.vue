<template>
  <div class="ss-wrap">
    <div v-for="lvl in LEVELS" :key="lvl" class="ss-row">
      <span class="ss-lvl">{{ levelLabel(lvl) }}</span>
      <div class="ss-pips">
        <button v-for="n in slotMax(lvl)" :key="n" class="ss-pip"
          :class="{ used: n <= slotUsed(lvl) }"
          @click="toggle(lvl, n)" :title="n <= slotUsed(lvl) ? 'Restore' : 'Expend'" />
      </div>
      <div v-if="mode === 'edit'" class="ss-max-edit">
        <button class="ss-adj" @click="adjustMax(lvl, -1)">−</button>
        <span class="ss-max-val">{{ slotMax(lvl) }}</span>
        <button class="ss-adj" @click="adjustMax(lvl, 1)">+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const DEFAULT_LEVEL_NAMES = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th']

const numLevels = computed(() => props.field.config.slotLevels ?? 9)
const LEVELS = computed(() => Array.from({ length: numLevels.value }, (_, i) => i + 1))
const levelNames = computed(() =>
  props.field.config.slotLevelNames?.length ? props.field.config.slotLevelNames : DEFAULT_LEVEL_NAMES
)
const levelLabel = (l: number) => levelNames.value[l - 1] ?? String(l)

const data = computed(() => props.value ?? {})
const slotMax  = (l: number) => data.value[l]?.max  ?? 0
const slotUsed = (l: number) => data.value[l]?.used ?? 0

function emit_(lvl: number, patch: object) {
  emit('update', { ...data.value, [lvl]: { ...data.value[lvl], ...patch } })
}
function toggle(lvl: number, n: number) {
  const used = slotUsed(lvl)
  emit_(lvl, { max: slotMax(lvl), used: n <= used ? n - 1 : n })
}
function adjustMax(lvl: number, d: number) {
  const newMax = Math.max(0, slotMax(lvl) + d)
  emit_(lvl, { max: newMax, used: Math.min(slotUsed(lvl), newMax) })
}
</script>

<style scoped>
.ss-wrap { display: flex; flex-direction: column; gap: 6px; }
.ss-row { display: flex; align-items: center; gap: 10px; min-height: 22px; }
.ss-lvl { font-family: var(--font-head); font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: var(--ink-faded); text-transform: uppercase; width: 32px; flex-shrink: 0; }
.ss-pips { display: flex; gap: 4px; flex-wrap: wrap; flex: 1; }
.ss-pip {
  width: 14px; height: 14px; border-radius: 50%;
  border: 1.5px solid var(--ink-faded);
  background: transparent; cursor: pointer; transition: all 0.15s; padding: 0;
}
.ss-pip.used { background: var(--ink-faded); border-color: var(--ink-faded); }
.ss-pip:hover { border-color: var(--gold); }
.ss-pip.used:hover { background: transparent; }
.ss-max-edit { display: flex; align-items: center; gap: 4px; }
.ss-adj { background: none; border: 1px solid var(--parch-line); border-radius: 2px; color: var(--ink-ghost); cursor: pointer; font-size: 12px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; padding: 0; }
.ss-adj:hover { color: var(--ink); border-color: var(--ink-ghost); }
.ss-max-val { font-size: 11px; color: var(--ink-ghost); width: 14px; text-align: center; }
</style>
