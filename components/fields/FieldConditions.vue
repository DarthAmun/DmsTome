<template>
  <div class="cond-wrap">
    <button v-for="c in CONDITIONS" :key="c.name" class="cond-badge"
      :class="{ active: active.includes(c.name) }"
      :style="active.includes(c.name) ? { background: c.color + '33', borderColor: c.color, color: c.color } : {}"
      @click="toggle(c.name)" :title="c.name">
      <OhVueIcon :name="c.icon" scale="0.7" />
      <span>{{ c.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const KNOWN: Record<string, { icon: string; color: string }> = {
  'Blinded':       { icon: 'gi-dead-eye',       color: '#6b6b6b' },
  'Charmed':       { icon: 'gi-love-mystery',    color: '#e05599' },
  'Deafened':      { icon: 'gi-ear',             color: '#6b6b6b' },
  'Exhausted':     { icon: 'gi-tired-eye',       color: '#c07840' },
  'Frightened':    { icon: 'gi-screaming',       color: '#9b4fd8' },
  'Grappled':      { icon: 'gi-grab',            color: '#7a5c3a' },
  'Incapacitated': { icon: 'gi-knockout',        color: '#e05555' },
  'Invisible':     { icon: 'gi-invisible',       color: '#4a8ccc' },
  'Paralyzed':     { icon: 'gi-frozen-body',     color: '#4a8ccc' },
  'Petrified':     { icon: 'gi-stone-pile',      color: '#888' },
  'Poisoned':      { icon: 'gi-poison',          color: '#4ab84a' },
  'Prone':         { icon: 'gi-falling',         color: '#c07840' },
  'Restrained':    { icon: 'gi-chain',           color: '#7a5c3a' },
  'Stunned':       { icon: 'gi-knockout',        color: '#e0c050' },
  'Unconscious':   { icon: 'gi-sleeping',        color: '#6b6b6b' },
}
const DEFAULT_CONDITIONS = Object.keys(KNOWN)

const CONDITIONS = computed(() => {
  const names = props.field.config.conditions?.length ? props.field.config.conditions : DEFAULT_CONDITIONS
  return names.map(name => KNOWN[name] ?? { name, icon: 'gi-health-decrease', color: '#888' }).map((c, i) => ({
    ...c,
    name: (props.field.config.conditions?.length ? props.field.config.conditions : DEFAULT_CONDITIONS)[i]
  }))
})

const active = computed<string[]>(() => props.value ?? [])
function toggle(name: string) {
  const next = active.value.includes(name)
    ? active.value.filter(c => c !== name)
    : [...active.value, name]
  emit('update', next)
}
</script>

<style scoped>
.cond-wrap { display: flex; flex-wrap: wrap; gap: 5px; }
.cond-badge {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 999px;
  border: 1px solid var(--parch-line);
  background: transparent; color: var(--ink-ghost);
  font-family: var(--font-head); font-size: 9px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  cursor: pointer; transition: all 0.15s;
}
.cond-badge:hover { border-color: var(--ink-ghost); color: var(--ink); }
.cond-badge.active { font-weight: 700; }
</style>
