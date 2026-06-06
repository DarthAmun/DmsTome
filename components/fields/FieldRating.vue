<template>
  <div class="field-wrap">
    <div class="f-rating" :class="`f-rating--${style}`">
      <button
        v-for="i in max" :key="i"
        class="f-pip"
        :class="{ filled: i <= val }"
        :style="i <= val ? { background: color, borderColor: color, boxShadow: `0 0 6px ${color}55` } : {}"
        :disabled="mode !== 'edit'"
        @click="mode === 'edit' && toggle(i)"
        :title="i <= val ? `${val}/${max}` : `Set to ${i}`"
      >
        <OhVueIcon v-if="style === 'skull'" name="fa-skull" scale="0.7"
          :style="{ color: i <= val ? 'var(--parch)' : 'var(--ink-ghost)' }" />
        <OhVueIcon v-else-if="style === 'star'" name="gi-star-formation" scale="0.75"
          :style="{ color: i <= val ? 'var(--parch)' : 'var(--ink-ghost)' }" />
      </button>
      <span class="f-rating-val">{{ val > 0 ? `${val} / ${max}` : '—' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const max = computed(() => Math.max(1, Math.min(10, props.field.config.ratingMax ?? 5)))
const style = computed(() => props.field.config.ratingStyle ?? 'dot')
const val = computed(() => Math.max(0, Math.min(max.value, props.value ?? 0)))

// Use the entity type color passed via CSS var if available, else fallback to gold
const color = 'var(--gold)'

function toggle(i: number) {
  emit('update', val.value === i ? 0 : i)
}
</script>

<style scoped>
.f-rating {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
}

.f-pip {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid var(--parch-line);
  background: var(--parch-dark);
  cursor: pointer;
  transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
}

.f-rating--diamond .f-pip {
  border-radius: 3px;
  transform: rotate(45deg);
}
.f-rating--diamond .f-pip > * {
  transform: rotate(-45deg);
}

.f-pip:not(:disabled):hover {
  border-color: var(--gold);
  transform: scale(1.15);
}
.f-rating--diamond .f-pip:not(:disabled):hover {
  transform: rotate(45deg) scale(1.15);
}

.f-pip:disabled { cursor: default; }

.f-rating-val {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--ink-ghost);
  margin-left: 4px;
  text-transform: uppercase;
}
</style>
