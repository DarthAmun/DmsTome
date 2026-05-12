<template>
  <div class="f-prof">
    <div v-if="mode === 'view'" class="f-prof-view">
      <span class="f-prof-pips">
        <span
          v-for="i in maxPips"
          :key="i"
          class="f-prof-pip"
          :class="{ 'f-prof-pip--filled': i <= rankIdx }"
        />
      </span>
      <span class="f-prof-name">{{ currentRank || '—' }}</span>
    </div>
    <div v-else class="f-prof-btns">
      <button
        v-for="(rank, ri) in ranks"
        :key="rank"
        class="f-prof-btn"
        :class="{ 'f-prof-btn--active': currentRank === rank }"
        :title="rank"
        @click="emit('update', rank)"
      >
        <span class="f-prof-pips f-prof-pips--sm">
          <span
            v-for="j in maxPips"
            :key="j"
            class="f-prof-pip f-prof-pip--sm"
            :class="{ 'f-prof-pip--filled': j <= ri }"
          />
        </span>
        <span class="f-prof-btn-lbl">{{ rank }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const DEFAULT_RANKS = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary']

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const ranks = computed(() =>
  props.field.config.options?.length ? props.field.config.options : DEFAULT_RANKS
)
const maxPips = computed(() => ranks.value.length - 1)
const currentRank = computed(() => props.value || ranks.value[0])
const rankIdx = computed(() => {
  const i = ranks.value.indexOf(currentRank.value)
  return i === -1 ? 0 : i
})
</script>

<style scoped>
.f-prof-view {
  display: flex;
  align-items: center;
  gap: 10px;
}

.f-prof-pips {
  display: flex;
  gap: 4px;
  align-items: center;
}

.f-prof-pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--parch-line);
  background: var(--parch-dark);
  transition: all 0.15s;
  flex-shrink: 0;
}
.f-prof-pip--filled {
  background: var(--gold);
  border-color: var(--gold);
  box-shadow: 0 0 5px color-mix(in srgb, var(--gold) 50%, transparent);
}
.f-prof-pip--sm {
  width: 7px;
  height: 7px;
}

.f-prof-name {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-faded);
}

.f-prof-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.f-prof-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: var(--r);
  color: var(--ink-ghost);
  cursor: pointer;
  transition: all 0.15s;
}
.f-prof-btn:hover {
  border-color: var(--gold);
  color: var(--ink);
}
.f-prof-btn--active {
  background: color-mix(in srgb, var(--gold) 12%, transparent);
  border-color: var(--gold);
  color: var(--gold);
}

.f-prof-pips--sm {
  gap: 3px;
}

.f-prof-btn-lbl {
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
