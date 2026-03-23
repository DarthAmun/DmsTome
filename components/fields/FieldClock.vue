<template>
  <div class="field-wrap">
    <div class="f-clock-wrap">
      <svg
        :width="SIZE" :height="SIZE"
        :viewBox="`0 0 ${SIZE} ${SIZE}`"
        class="f-clock-svg"
        @click="advance"
        @contextmenu.prevent="retreat"
        :title="`${filled}/${segs} — click to advance, right-click to retreat`"
      >
        <!-- Outer ring -->
        <circle :cx="C" :cy="C" :r="R + 2" class="f-clock-ring" />
        <!-- Background -->
        <circle :cx="C" :cy="C" :r="R" class="f-clock-bg" />
        <!-- Filled segments -->
        <path
          v-for="i in filled" :key="'f' + i"
          :d="segPath(i - 1)"
          class="f-clock-filled"
        />
        <!-- Dividers -->
        <line
          v-for="i in segs" :key="'d' + i"
          :x1="C" :y1="C"
          :x2="C + R * Math.cos(toRad(-90 + i * (360 / segs)))"
          :y2="C + R * Math.sin(toRad(-90 + i * (360 / segs)))"
          class="f-clock-div"
        />
        <!-- Inner cap -->
        <circle :cx="C" :cy="C" :r="R * 0.26" class="f-clock-cap" />
        <!-- Count -->
        <text :x="C" :y="C + 5" text-anchor="middle" dominant-baseline="middle" class="f-clock-count">
          {{ filled }}
        </text>
      </svg>
      <div class="f-clock-meta">
        <span class="f-clock-fraction">{{ filled }} / {{ segs }}</span>
        <div class="f-clock-btns">
          <button class="f-clock-btn" @click.stop="retreat" :disabled="filled <= 0">−</button>
          <button class="f-clock-btn" @click.stop="advance" :disabled="filled >= segs">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const SIZE = 100
const C = 50
const R = 42

const segs = computed(() => Math.max(2, Math.min(20, props.field.config.segments ?? 6)))
const filled = computed(() => Math.max(0, Math.min(segs.value, props.value ?? 0)))

function toRad(deg: number) { return (deg * Math.PI) / 180 }

function segPath(i: number): string {
  const n = segs.value
  const a1 = toRad(-90 + i * (360 / n))
  const a2 = toRad(-90 + (i + 1) * (360 / n))
  const x1 = C + R * Math.cos(a1)
  const y1 = C + R * Math.sin(a1)
  const x2 = C + R * Math.cos(a2)
  const y2 = C + R * Math.sin(a2)
  const large = 360 / n > 180 ? 1 : 0
  return `M ${C} ${C} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

function advance() {
  if (filled.value < segs.value) emit('update', filled.value + 1)
}
function retreat() {
  if (filled.value > 0) emit('update', filled.value - 1)
}
</script>

<style scoped>
.f-clock-wrap {
  display: flex; align-items: center; gap: 16px;
}

.f-clock-svg {
  cursor: pointer;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
  transition: transform 0.1s;
}
.f-clock-svg:hover { transform: scale(1.04); }

.f-clock-ring {
  fill: none;
  stroke: var(--ink-ghost);
  stroke-width: 1.5;
  opacity: 0.4;
}
.f-clock-bg { fill: var(--parch-dark); }
.f-clock-filled {
  fill: var(--blood);
  opacity: 0.85;
  transition: opacity 0.15s;
}
.f-clock-filled:last-child { opacity: 1; }
.f-clock-div {
  stroke: var(--parch);
  stroke-width: 1.5;
}
.f-clock-cap { fill: var(--parch); }
.f-clock-count {
  font-family: var(--font-deco);
  font-size: 14px;
  font-weight: 700;
  fill: var(--ink);
}

.f-clock-meta {
  display: flex; flex-direction: column; gap: 8px;
}
.f-clock-fraction {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--ink-ghost);
}
.f-clock-btns { display: flex; gap: 4px; }
.f-clock-btn {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  color: var(--ink);
  font-size: 16px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; line-height: 1;
}
.f-clock-btn:hover:not(:disabled) { background: var(--blood); color: var(--parch); border-color: var(--blood); }
.f-clock-btn:disabled { opacity: 0.25; cursor: not-allowed; }
</style>
