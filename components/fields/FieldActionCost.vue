<template>
  <div class="f-ac">
    <div v-if="mode === 'view'" class="f-ac-view">
      <span v-if="current" class="f-ac-symbol">{{ current.symbol }}</span>
      <span class="f-ac-label">{{ current?.label || '—' }}</span>
    </div>
    <div v-else class="f-ac-btns">
      <button
        v-for="opt in actions"
        :key="opt.value"
        class="f-ac-btn"
        :class="{ 'f-ac-btn--active': props.value === opt.value }"
        :title="opt.label"
        @click="emit('update', opt.value)"
      >
        <span class="f-ac-symbol">{{ opt.symbol }}</span>
        <span class="f-ac-sublabel">{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

interface ActionOption { value: string; label: string; symbol: string }

const PF2E_ACTIONS: ActionOption[] = [
  { value: 'free',     label: 'Free',     symbol: '◇' },
  { value: 'reaction', label: 'Reaction', symbol: '↺' },
  { value: 'one',      label: '1 Action', symbol: '◆' },
  { value: 'two',      label: '2 Actions',symbol: '◆◆' },
  { value: 'three',    label: '3 Actions',symbol: '◆◆◆' },
]

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const actions = computed<ActionOption[]>(() => {
  if (props.field.config.options?.length) {
    return props.field.config.options.map(o => ({ value: o, label: o, symbol: o }))
  }
  return PF2E_ACTIONS
})

const current = computed(() => actions.value.find(a => a.value === props.value))
</script>

<style scoped>
.f-ac-view {
  display: flex;
  align-items: center;
  gap: 8px;
}

.f-ac-symbol {
  font-size: 16px;
  color: var(--gold);
  letter-spacing: -1px;
  line-height: 1;
}

.f-ac-label {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faded);
}

.f-ac-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.f-ac-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 10px;
  min-width: 52px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: var(--r);
  cursor: pointer;
  transition: all 0.15s;
}
.f-ac-btn:hover {
  border-color: var(--gold);
}
.f-ac-btn--active {
  background: color-mix(in srgb, var(--gold) 12%, transparent);
  border-color: var(--gold);
}
.f-ac-btn--active .f-ac-symbol,
.f-ac-btn--active .f-ac-sublabel {
  color: var(--gold);
}

.f-ac-btn .f-ac-symbol {
  font-size: 15px;
  color: var(--ink);
  letter-spacing: -1px;
  line-height: 1;
}

.f-ac-sublabel {
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  white-space: nowrap;
}
</style>
