<template>
  <div class="spd-wrap">
    <div v-if="mode === 'view'" class="spd-display">
      <template v-for="(m, i) in activeModes" :key="m.key">
        <span v-if="i > 0" class="spd-sep">,</span>
        <span class="spd-entry">
          <OhVueIcon :name="m.icon" scale="0.75" class="spd-icon" />
          <span v-if="m.key !== MODES[0]?.key" class="spd-mode">{{ m.label }}</span>
          {{ vals[m.key] }} {{ speedUnit }}.
        </span>
      </template>
      <span v-if="!activeModes.length" class="spd-empty">—</span>
    </div>
    <div v-else class="spd-fields">
      <label v-for="m in MODES" :key="m.key" class="spd-group">
        <span class="spd-lbl">
          <OhVueIcon :name="m.icon" scale="0.7" />
          {{ m.label }}
        </span>
        <div class="spd-input-row">
          <input class="spd-input" type="number" :value="vals[m.key]" min="0" step="5"
            @change="set(m.key, +($event.target as HTMLInputElement).value)" />
          <span class="spd-unit">{{ speedUnit }}</span>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>(  )

const ICON_MAP: Record<string, string> = {
  walk: 'gi-boot-stomp', fly: 'gi-feathered-wing', swim: 'gi-wave-strike',
  climb: 'gi-mountain-climbing', burrow: 'gi-dig-dug',
}
const DEFAULT_MODES = ['Walk', 'Fly', 'Swim', 'Climb', 'Burrow']

const speedUnit = computed(() => props.field.config.speedUnit || 'ft')

const MODES = computed(() => {
  const names = props.field.config.speedModes?.length ? props.field.config.speedModes : DEFAULT_MODES
  return names.map(name => ({
    key: name.toLowerCase().replace(/\s+/g, '_'),
    label: name,
    icon: ICON_MAP[name.toLowerCase()] ?? 'gi-run',
  }))
})

const defaults = computed(() => Object.fromEntries(
  MODES.value.map((m, i) => [m.key, i === 0 ? 30 : 0])
))
const vals = computed(() => ({ ...defaults.value, ...(props.value ?? {}) }))
const activeModes = computed(() => MODES.value.filter(m => vals.value[m.key] > 0))
function set(key: string, v: number) { emit('update', { ...vals.value, [key]: Math.max(0, v) }) }
</script>

<style scoped>
.spd-display { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-family: var(--font-body); font-size: 14px; color: var(--ink); }
.spd-entry { display: flex; align-items: center; gap: 3px; }
.spd-mode { color: var(--ink-faded); font-style: italic; }
.spd-icon { color: var(--ink-ghost); }
.spd-sep { color: var(--ink-ghost); }
.spd-empty { color: var(--ink-ghost); font-style: italic; }
.spd-fields { display: flex; flex-wrap: wrap; gap: 10px; }
.spd-group { display: flex; flex-direction: column; gap: 3px; }
.spd-lbl { display: flex; align-items: center; gap: 3px; font-family: var(--font-head); font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faded); }
.spd-input-row { display: flex; align-items: center; gap: 3px; }
.spd-input { font-family: var(--font-body); font-size: 13px; width: 56px; background: var(--parch-dark); border: 1px solid var(--parch-line); border-radius: 2px; color: var(--ink); padding: 4px 6px; outline: none; }
.spd-input:focus { border-color: var(--gold); }
.spd-unit { font-size: 11px; color: var(--ink-ghost); }
</style>
