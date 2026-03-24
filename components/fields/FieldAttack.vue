<template>
  <div class="atk-wrap">
    <div v-if="mode === 'view'" class="atk-display">
      <span class="atk-hit">{{ fmtBonus(v.hitBonus) }} to hit</span>
      <span class="atk-sep">·</span>
      <span class="atk-reach">reach {{ v.reach ?? 5 }} ft.</span>
      <span class="atk-sep">·</span>
      <span class="atk-dmg">{{ v.damage || '—' }} <em>{{ v.type }}</em></span>
    </div>
    <div v-else class="atk-fields">
      <label class="atk-group">
        <span class="atk-lbl">Hit bonus</span>
        <input class="atk-input" type="number" :value="v.hitBonus ?? 0"
          @change="set('hitBonus', +($event.target as HTMLInputElement).value)" />
      </label>
      <label class="atk-group">
        <span class="atk-lbl">Damage</span>
        <input class="atk-input atk-input--wide" type="text" :value="v.damage ?? ''"
          placeholder="2d6+3"
          @input="set('damage', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="atk-group">
        <span class="atk-lbl">Type</span>
        <input class="atk-input atk-input--wide" type="text" :value="v.type ?? ''"
          placeholder="piercing"
          @input="set('type', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="atk-group">
        <span class="atk-lbl">Reach (ft)</span>
        <input class="atk-input" type="number" :value="v.reach ?? 5" min="0" step="5"
          @change="set('reach', +($event.target as HTMLInputElement).value)" />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const v = computed(() => props.value ?? { hitBonus: 0, damage: '', type: '', reach: 5 })
const fmtBonus = (n: number) => (n >= 0 ? '+' : '') + (n ?? 0)
function set(key: string, val: any) { emit('update', { ...v.value, [key]: val }) }
</script>

<style scoped>
.atk-display { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-family: var(--font-body); font-size: 14px; }
.atk-hit { font-weight: 700; color: var(--ink); }
.atk-reach { color: var(--ink-faded); }
.atk-dmg { color: var(--ink); }
.atk-dmg em { color: var(--ink-faded); font-style: italic; }
.atk-sep { color: var(--parch-line); }
.atk-fields { display: flex; flex-wrap: wrap; gap: 10px; }
.atk-group { display: flex; flex-direction: column; gap: 3px; }
.atk-lbl { font-family: var(--font-head); font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faded); }
.atk-input { font-family: var(--font-body); font-size: 13px; width: 64px; background: var(--parch-dark); border: 1px solid var(--parch-line); border-radius: 2px; color: var(--ink); padding: 4px 6px; outline: none; }
.atk-input--wide { width: 110px; }
.atk-input:focus { border-color: var(--gold); }
</style>
