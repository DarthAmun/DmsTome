<template>
  <div class="field-wrap">
    <div class="f-dice">
      <div class="f-dice-row">
        <input v-if="mode === 'edit'" class="f-input f-mono" :value="value || field.config.defaultExpression || ''"
          placeholder="e.g. 2d6+3"
          @input="emit('update', ($event.target as HTMLInputElement).value.trim())" />
        <span v-else class="f-dice-expr">{{ expr || '—' }}</span>
        <button v-if="expr" class="f-dice-btn" :class="{ rolling }" @click="roll" title="Roll">
          <OhVueIcon name="gi-dice-six" scale="1.1" />
        </button>
      </div>
      <Transition name="dice-pop">
        <div v-if="result !== null" class="f-dice-result">
          <span class="f-dice-equals">＝</span>
          <span class="f-dice-num">{{ result }}</span>
          <span class="f-dice-breakdown" v-if="breakdown">{{ breakdown }}</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const result = ref<number | null>(null)
const breakdown = ref('')
const rolling = ref(false)
let clearTimer: ReturnType<typeof setTimeout> | null = null

const expr = computed(() => (props.value || props.field.config.defaultExpression || '').toString().trim())

function roll() {
  const str = expr.value.toLowerCase()
  const match = str.match(/^(\d+)d(\d+)\s*([+-]\s*\d+)?$/)
  if (!match) return
  const count = Math.min(parseInt(match[1]), 100)
  const sides = Math.min(parseInt(match[2]), 1000)
  const mod = match[3] ? parseInt(match[3].replace(/\s/g, '')) : 0
  const rolls: number[] = []
  for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1)
  const sum = rolls.reduce((a, b) => a + b, 0)
  rolling.value = true
  setTimeout(() => { rolling.value = false }, 300)
  result.value = sum + mod
  breakdown.value = count > 1
    ? `[${rolls.join(' + ')}]${mod !== 0 ? (mod > 0 ? ' +' : ' ') + mod : ''}`
    : mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : ''
  if (clearTimer) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => { result.value = null; breakdown.value = '' }, 4000)
}
</script>

<style scoped>
.f-dice { display: flex; flex-direction: column; gap: 8px; }

.f-dice-row { display: flex; align-items: center; gap: 8px; }

.f-dice-expr {
  font-family: var(--font-mono);
  font-size: 15px;
  color: var(--ink);
  min-width: 60px;
}

.f-dice-btn {
  width: 32px; height: 32px;
  border-radius: 4px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  color: var(--ink-ghost);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.f-dice-btn:hover { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }
.f-dice-btn.rolling { transform: rotate(180deg); color: var(--gold); }

.f-dice-result {
  display: flex; align-items: baseline; gap: 6px;
  padding: 6px 10px;
  background: var(--parch-dark);
  border: 1px solid var(--gold);
  border-radius: 3px;
}
.f-dice-equals { font-family: var(--font-head); font-size: 11px; color: var(--ink-ghost); }
.f-dice-num {
  font-family: var(--font-deco);
  font-size: 24px;
  font-weight: 700;
  color: var(--gold);
  line-height: 1;
}
.f-dice-breakdown {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-ghost);
}

.dice-pop-enter-active { animation: dice-pop 0.25s ease-out; }
.dice-pop-leave-active { transition: opacity 0.4s; }
.dice-pop-leave-to   { opacity: 0; }

@keyframes dice-pop {
  from { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.08); }
  to   { transform: scale(1); opacity: 1; }
}
</style>
