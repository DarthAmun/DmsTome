<template>
  <div class="f-atk">
    <!-- View -->
    <div v-if="mode === 'view'" class="f-atk-view">
      <div class="f-atk-row f-atk-row--main">
        <span class="f-atk-bonus">{{ fmtBonus(v.hitBonus) }}</span>
        <template v-if="v.map">
          <span class="f-atk-sep">/</span>
          <span class="f-atk-bonus f-atk-bonus--map">{{ fmtBonus(v.hitBonus - 5) }}</span>
          <span class="f-atk-sep">/</span>
          <span class="f-atk-bonus f-atk-bonus--map">{{ fmtBonus(v.hitBonus - 10) }}</span>
        </template>
        <span class="f-atk-label">to hit</span>
        <span v-if="v.range" class="f-atk-meta">· {{ v.range }}</span>
      </div>

      <div v-if="damageRows.length" class="f-atk-row f-atk-dmg-view">
        <template v-for="(row, i) in damageRows" :key="i">
          <span v-if="i > 0" class="f-atk-plus">+</span>
          <span class="f-atk-dice">{{ row.dice }}</span>
          <span class="f-atk-type">{{ row.type }}</span>
          <span v-if="row.condition" class="f-atk-cond">({{ row.condition }})</span>
        </template>
      </div>

      <div v-if="traitList.length" class="f-atk-traits">
        <span v-for="t in traitList" :key="t" class="f-trait-badge">{{ t }}</span>
      </div>
    </div>

    <!-- Edit -->
    <div v-else class="f-atk-edit">
      <!-- Hit bonus row -->
      <div class="f-atk-field-row">
        <label class="f-atk-group">
          <span class="f-atk-lbl">Hit bonus</span>
          <input class="f-atk-input f-mono" type="number"
            :value="v.hitBonus ?? 0"
            @change="set('hitBonus', +($event.target as HTMLInputElement).value)" />
        </label>
        <label class="f-atk-group f-atk-group--map">
          <span class="f-atk-lbl">MAP</span>
          <input type="checkbox" :checked="v.map ?? false"
            @change="set('map', ($event.target as HTMLInputElement).checked)" />
        </label>
        <label class="f-atk-group">
          <span class="f-atk-lbl">Range / Reach</span>
          <input class="f-atk-input f-atk-input--wide" type="text"
            :value="v.range ?? ''"
            placeholder="5 ft. reach"
            @input="set('range', ($event.target as HTMLInputElement).value)" />
        </label>
      </div>

      <!-- Damage rows -->
      <div class="f-atk-dmg-label">Damage</div>
      <div class="f-atk-dmg-rows">
        <div v-for="(row, i) in damageRows" :key="i" class="f-atk-dmg-row">
          <input class="f-atk-input f-mono" :value="row.dice" placeholder="1d8+4"
            @input="setDmg(i, 'dice', ($event.target as HTMLInputElement).value)" />
          <input class="f-atk-input" :value="row.type" placeholder="type"
            @input="setDmg(i, 'type', ($event.target as HTMLInputElement).value)" />
          <input class="f-atk-input f-atk-input--cond" :value="row.condition || ''" placeholder="on crit…"
            @input="setDmg(i, 'condition', ($event.target as HTMLInputElement).value)" />
          <button class="f-atk-rm" @click="removeDmg(i)">×</button>
        </div>
        <button class="f-atk-add" @click="addDmg">+ damage</button>
      </div>

      <!-- Traits -->
      <div class="f-atk-field-row" style="margin-top:6px">
        <label class="f-atk-group" style="flex:1">
          <span class="f-atk-lbl">Traits (comma-separated)</span>
          <input class="f-atk-input f-atk-input--wide" type="text"
            :value="traitList.join(', ')"
            placeholder="Agile, Finesse…"
            @input="setTraits(($event.target as HTMLInputElement).value)" />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

interface DmgRow { dice: string; type: string; condition?: string }
interface AtkValue {
  hitBonus?: number
  map?: boolean
  damageRows?: DmgRow[]
  traits?: string[]
  range?: string
}

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const v = computed<AtkValue>(() => props.value ?? { hitBonus: 0, map: false, damageRows: [], traits: [], range: '' })
const damageRows = computed<DmgRow[]>(() => v.value.damageRows ?? [])
const traitList = computed<string[]>(() => v.value.traits ?? [])

const fmtBonus = (n: number) => (n >= 0 ? '+' : '') + n

function set(key: keyof AtkValue, val: any) { emit('update', { ...v.value, [key]: val }) }

function setDmg(i: number, key: keyof DmgRow, val: string) {
  const rows = damageRows.value.map((r, idx) => idx === i ? { ...r, [key]: val } : r)
  set('damageRows', rows)
}
function addDmg() { set('damageRows', [...damageRows.value, { dice: '', type: '', condition: '' }]) }
function removeDmg(i: number) { set('damageRows', damageRows.value.filter((_, idx) => idx !== i)) }
function setTraits(raw: string) { set('traits', raw.split(',').map(t => t.trim()).filter(Boolean)) }
</script>

<style scoped>
.f-atk-view { display: flex; flex-direction: column; gap: 5px; }

.f-atk-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px; font-size: 14px; }

.f-atk-bonus {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.f-atk-bonus--map { font-size: 13px; color: var(--ink-faded); }
.f-atk-sep { color: var(--parch-line); font-size: 13px; }
.f-atk-label { font-family: var(--font-head); font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-ghost); }
.f-atk-meta { font-size: 12px; color: var(--ink-ghost); }

.f-atk-dmg-view { gap: 4px; }
.f-atk-plus { color: var(--ink-ghost); }
.f-atk-dice { font-family: var(--font-mono); font-weight: 600; color: var(--ink); }
.f-atk-type { color: var(--ink-faded); font-style: italic; }
.f-atk-cond { font-size: 11px; color: var(--ink-ghost); }

.f-atk-traits { display: flex; flex-wrap: wrap; gap: 4px; }
.f-trait-badge {
  padding: 1px 8px;
  background: color-mix(in srgb, var(--gold) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--gold) 30%, transparent);
  border-radius: 2px;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold);
}

.f-atk-edit { display: flex; flex-direction: column; gap: 8px; }
.f-atk-field-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
.f-atk-group { display: flex; flex-direction: column; gap: 3px; }
.f-atk-group--map { flex-direction: row; align-items: center; gap: 6px; }
.f-atk-lbl { font-family: var(--font-head); font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faded); }

.f-atk-input {
  font-family: var(--font-body);
  font-size: 13px;
  width: 72px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  color: var(--ink);
  padding: 4px 6px;
  outline: none;
}
.f-atk-input:focus { border-color: var(--gold); }
.f-atk-input--wide { width: 140px; }
.f-atk-input--cond { flex: 1; min-width: 80px; color: var(--ink-faded); font-size: 12px; }

.f-atk-dmg-label { font-family: var(--font-head); font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faded); }
.f-atk-dmg-rows { display: flex; flex-direction: column; gap: 4px; }
.f-atk-dmg-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }

.f-atk-rm { background: none; border: none; color: var(--ink-ghost); font-size: 16px; cursor: pointer; padding: 0 4px; transition: color 0.12s; }
.f-atk-rm:hover { color: var(--blood); }

.f-atk-add { align-self: flex-start; padding: 3px 10px; background: none; border: 1px dashed var(--parch-line); border-radius: 2px; color: var(--ink-ghost); font-size: 12px; cursor: pointer; transition: all 0.12s; }
.f-atk-add:hover { border-color: var(--gold); color: var(--gold); }

.f-mono { font-family: var(--font-mono) !important; }
</style>
