<template>
  <div class="field-wrap">
    <div class="f-tracker">
      <button class="f-track-btn" @click="adjust(-1)" :disabled="current <= 0">−</button>
      <div class="f-track-display">
        <input v-if="editingCurrent" ref="curInput" class="f-track-input"
          type="number" :value="current"
          @change="setCurrent(Number(($event.target as HTMLInputElement).value))"
          @blur="editingCurrent = false" />
        <span v-else class="f-track-cur" @click="editingCurrent = true; nextTick(() => curInput?.focus())">
          {{ current }}
        </span>
        <span class="f-track-sep">/</span>
        <input v-if="editingMax" ref="maxInput" class="f-track-input"
          type="number" :value="maximum"
          @change="setMax(Number(($event.target as HTMLInputElement).value))"
          @blur="editingMax = false" />
        <span v-else class="f-track-max" @click="editingMax = true; nextTick(() => maxInput?.focus())">
          {{ maximum }}
        </span>
      </div>
      <button class="f-track-btn" @click="adjust(1)" :disabled="current >= maximum">+</button>
    </div>
    <!-- Bar -->
    <div class="f-track-bar">
      <div class="f-track-fill" :style="{ width: pct + '%', background: barColor }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

// value format: { current: number, max: number }
const current = computed(() => props.value?.current ?? 0)
const maximum = computed(() => props.value?.max ?? (props.field.config.defaultMax ?? 10))
const pct = computed(() => maximum.value > 0 ? Math.max(0, Math.min(100, (current.value / maximum.value) * 100)) : 0)
const barColor = computed(() => pct.value > 50 ? '#7cc44e' : pct.value > 25 ? '#ebbd34' : '#e05555')

const editingCurrent = ref(false)
const editingMax = ref(false)
const curInput = ref<HTMLInputElement | null>(null)
const maxInput = ref<HTMLInputElement | null>(null)

function adjust(delta: number) {
  const next = Math.max(0, Math.min(maximum.value, current.value + delta))
  emit('update', { current: next, max: maximum.value })
}
function setCurrent(v: number) {
  editingCurrent.value = false
  emit('update', { current: Math.max(0, Math.min(maximum.value, v)), max: maximum.value })
}
function setMax(v: number) {
  editingMax.value = false
  const newMax = Math.max(1, v)
  emit('update', { current: Math.min(current.value, newMax), max: newMax })
}
</script>

<style scoped>
.f-tracker { display:flex;align-items:center;gap:10px; }
.f-track-btn { width:28px;height:28px;border-radius:50%;background:var(--forge-raised);border:1px solid var(--forge-border);color:var(--forge-text);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s; }
.f-track-btn:hover:not(:disabled) { background:var(--forge-hover); }
.f-track-btn:disabled { opacity:0.3;cursor:not-allowed; }
.f-track-display { display:flex;align-items:baseline;gap:4px; }
.f-track-cur { font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--forge-text);cursor:pointer;min-width:28px;text-align:center; }
.f-track-sep { font-size:16px;color:var(--forge-muted); }
.f-track-max { font-size:14px;color:var(--forge-muted);cursor:pointer;min-width:24px;text-align:center; }
.f-track-input { font-family:'Syne',sans-serif;font-size:22px;font-weight:800;width:48px;background:var(--forge-raised);border:1px solid var(--forge-accent);border-radius:4px;color:var(--forge-text);text-align:center;outline:none; }
.f-track-bar { height:4px;background:var(--forge-raised);border-radius:999px;overflow:hidden;margin-top:6px; }
.f-track-fill { height:100%;border-radius:999px;transition:width 0.3s,background 0.3s; }
</style>
