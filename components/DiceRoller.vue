<template>
  <Teleport to="body">
    <!-- Pill trigger -->
    <button
      class="dice-fab"
      :class="{ 'dice-fab--open': panelOpen }"
      @click="panelOpen = !panelOpen"
    >
      <OhVueIcon name="fa-dice-d20" scale="1.1" />
      <span>Dice</span>
    </button>

    <!-- Panel -->
    <Transition name="dp">
      <div v-if="panelOpen" class="dice-panel" @mousedown.stop @keydown.escape="panelOpen = false">
        <!-- Header -->
        <div class="dp-header">
          <span class="dp-title">Dice Roller</span>
          <button class="dp-close" @click="panelOpen = false">✕</button>
        </div>

        <!-- Dice grid: 4+3 layout, d100 spans 2 cols -->
        <div class="dp-dice-grid">
          <button
            v-for="d in DICE"
            :key="d"
            class="dp-die-btn"
            :class="{ 'dp-die-btn--active': pool[d] > 0, 'dp-die-btn--wide': d === 100 }"
            @click="addDie(d)"
            @contextmenu.prevent="removeDie(d)"
          >
            <OhVueIcon v-if="DIE_SHAPES[d] === null" :name="DIE_ICON[d]" scale="1.5" class="die-oh-icon" />
            <svg v-else class="die-svg" viewBox="0 0 44 44" v-html="DIE_SHAPES[d]" />
            <span class="die-label">d{{ d }}</span>
            <span v-if="pool[d] > 0" class="die-count">{{ pool[d] }}</span>
          </button>
        </div>

        <!-- Pool summary + modifier -->
        <div class="dp-middle">
          <div class="dp-pool-row">
            <span v-if="poolLabel" class="dp-pool-text">{{ poolLabel }}</span>
            <span v-else class="dp-pool-hint">Click dice · right-click to remove</span>
          </div>
          <div class="dp-modifier-row">
            <span class="dp-mod-label">Modifier</span>
            <button class="dp-mod-btn" @click="modifier--">−</button>
            <input
              type="number"
              class="dp-mod-val"
              :class="modifier > 0 ? 'dp-mod--pos' : modifier < 0 ? 'dp-mod--neg' : 'dp-mod--zero'"
              v-model.number="modifier"
            />
            <button class="dp-mod-btn" @click="modifier++">+</button>
          </div>
        </div>

        <!-- Actions -->
        <div class="dp-actions">
          <button class="dp-btn-clear" @click="clearAll">Clear</button>
          <button class="dp-btn-roll" :disabled="!hasDice" @click="rollDice">
            Roll!
          </button>
        </div>

        <!-- Result -->
        <Transition name="dp-res">
          <div v-if="result" class="dp-result" :class="{ 'dp-result--crit': result.isCrit, 'dp-result--fail': result.isFail }">
            <div v-if="result.isCrit" class="dp-result-badge dp-result-badge--crit">NAT 20 ✦</div>
            <div v-else-if="result.isFail" class="dp-result-badge dp-result-badge--fail">NAT 1</div>
            <div class="dp-result-total">{{ result.total }}</div>
            <div class="dp-result-breakdown">{{ result.breakdown }}</div>
          </div>
        </Transition>

        <!-- History -->
        <div v-if="history.length > 0" class="dp-history">
          <div class="dp-history-head">History</div>
          <div v-for="h in history" :key="h.id" class="dp-history-row">
            <span class="dp-history-dice">{{ h.label }}</span>
            <span class="dp-history-total" :class="{ 'dp-his--crit': h.isCrit, 'dp-his--fail': h.isFail }">{{ h.total }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useDiceRoll } from '~/composables/useDiceRoll'

const DICE = [4, 6, 8, 10, 12, 20, 100] as const
type DieSides = typeof DICE[number]

// null = use OhVueIcon instead of inline SVG
const DIE_SHAPES: Record<number, string | null> = {
  4:   '<polygon points="22,2 43,43 1,43" />',
  6:   '<rect x="2" y="2" width="40" height="40" rx="6" />',
  8:   '<polygon points="22,2 42,22 22,42 2,22" />',
  10:  '<polygon points="22,1 41,20 32,43 12,43 3,20" />',
  12:  '<polygon points="22,2 40,15 36,38 8,38 4,15" />',
  20:  null,
  100: '<circle cx="22" cy="22" r="19" /><text x="22" y="27.5" text-anchor="middle" font-size="14" font-weight="bold" class="die-text">%</text>',
}

const DIE_ICON: Record<number, string> = {
  20: 'fa-dice-d20',
}

const panelOpen = ref(false)

const pool = reactive<Record<number, number>>({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 })
const modifier = ref(0)

interface RollResult {
  total: number
  breakdown: string
  label: string
  isCrit: boolean
  isFail: boolean
  id: number
}
const result = ref<RollResult | null>(null)
const history = ref<RollResult[]>([])
let nextId = 0

const hasDice = computed(() => DICE.some(d => pool[d] > 0))

const poolLabel = computed(() => {
  const parts = DICE.filter(d => pool[d] > 0).map(d => `${pool[d]}d${d}`)
  if (!parts.length) return ''
  let s = parts.join(' + ')
  if (modifier.value > 0) s += ` + ${modifier.value}`
  else if (modifier.value < 0) s += ` − ${Math.abs(modifier.value)}`
  return s
})


function addDie(sides: DieSides) {
  pool[sides]++
}
function removeDie(sides: DieSides) {
  if (pool[sides] > 0) pool[sides]--
}
function clearAll() {
  DICE.forEach(d => { pool[d] = 0 })
  modifier.value = 0
  result.value = null
}

// ── External roll trigger ─────────────────────────────────────
const { pendingRoll, clearPendingRoll } = useDiceRoll()

function parseDiceExpression(expr: string): boolean {
  // Normalise: remove spaces, uppercase D → d
  const s = expr.replace(/\s/g, '').replace(/D/g, 'd')
  const tokenRe = /([+-]?)(\d*)d(\d+)|([+-]?\d+)/g
  let matched = false
  const newPool: Record<number, number> = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 }
  let newMod = 0
  let m: RegExpExecArray | null
  while ((m = tokenRe.exec(s)) !== null) {
    if (m[3] !== undefined) {
      // dice term: e.g. 2d6, d20, -1d8
      const sign = m[1] === '-' ? -1 : 1
      const count = (m[2] ? parseInt(m[2]) : 1) * sign
      const sides = parseInt(m[3])
      if (sides in newPool) newPool[sides] += count
      matched = true
    } else if (m[4] !== undefined) {
      // flat modifier: e.g. +5, -3
      newMod += parseInt(m[4])
      matched = true
    }
  }
  if (!matched) return false
  DICE.forEach(d => { pool[d] = Math.max(0, newPool[d]) })
  modifier.value = newMod
  return true
}

watch(pendingRoll, (expr) => {
  if (!expr) return
  clearPendingRoll()
  if (parseDiceExpression(expr)) {
    panelOpen.value = true
    nextTick(rollDice)
  }
})

function rollDice() {
  const rolls: { sides: number; values: number[] }[] = []
  let total = modifier.value

  DICE.forEach(sides => {
    if (!pool[sides]) return
    const values: number[] = []
    for (let i = 0; i < pool[sides]; i++) values.push(Math.floor(Math.random() * sides) + 1)
    rolls.push({ sides, values })
    total += values.reduce((a, b) => a + b, 0)
  })

  const d20Roll = rolls.find(r => r.sides === 20)
  const isCrit = !!d20Roll && d20Roll.values.includes(20)
  const isFail = !!d20Roll && pool[20] === 1 && d20Roll.values[0] === 1

  const breakdown = [
    ...rolls.map(r => `d${r.sides}: [${r.values.join(', ')}]`),
    ...(modifier.value ? [`${modifier.value > 0 ? '+' : ''}${modifier.value}`] : []),
  ].join('  ·  ')

  const r: RollResult = { total, breakdown, label: poolLabel.value, isCrit, isFail, id: ++nextId }
  result.value = r
  history.value = [r, ...history.value].slice(0, 8)
}

</script>

<style scoped>
/* ── Pill trigger ────────────────────────────────────────────── */
.dice-fab {
  position: fixed;
  bottom: 68px;
  right: 20px;
  z-index: 199;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px 8px 12px;
  border-radius: 99px;
  background: var(--surface-solid, var(--bg2));
  border: 1px solid var(--border);
  box-shadow: var(--sh-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  transition: all 0.18s;
  user-select: none;
}
.dice-fab:hover {
  border-color: var(--border-hi, var(--border));
  color: var(--text);
}
.dice-fab--open {
  border-color: var(--border-hi, var(--border));
  color: var(--text);
}

/* ── Panel ───────────────────────────────────────────────────── */
.dice-panel {
  position: fixed;
  bottom: 116px;
  right: 20px;
  z-index: 198;
  width: 300px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  background: var(--parch-dark, #1c140e);
  border: 1px solid rgba(184,134,11,0.3);
  border-radius: 12px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(184,134,11,0.08);
}

.dp-header {
  display: flex;
  align-items: center;
  padding: 11px 14px;
  border-bottom: 1px solid rgba(184,134,11,0.13);
  background: rgba(0,0,0,0.22);
}
.dp-title {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold, #c9973a);
}
.dp-close {
  background: none;
  border: none;
  color: rgba(200,185,165,0.65);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s;
  line-height: 1;
}
.dp-close:hover { color: var(--ink, #d4c5a9); }

/* ── Dice grid ───────────────────────────────────────────────── */
.dp-dice-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
  padding: 12px 12px 8px;
}
.dp-die-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 8px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(184,134,11,0.2);
  border-radius: 8px;
  cursor: pointer;
  color: #9a8a72;
  transition: all 0.15s;
}
.dp-die-btn--wide { grid-column: span 2; }
.dp-die-btn:hover {
  background: rgba(184,134,11,0.1);
  border-color: rgba(184,134,11,0.38);
  color: var(--gold, #c9973a);
}
.dp-die-btn--active {
  background: rgba(184,134,11,0.1);
  border-color: rgba(184,134,11,0.45);
  color: var(--gold, #c9973a);
}

.die-svg {
  width: 28px;
  height: 28px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  stroke-linejoin: round;
}
/* inner mark on d20 */
:deep(.die-inner) { stroke-width: 1; opacity: 0.5; }
/* text label inside d100 */
:deep(.die-text) { fill: currentColor; stroke: none; font-family: inherit; }

.die-oh-icon {
  color: currentColor;
  width: 28px;
  height: 28px;
}
.die-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1;
}
.die-count {
  position: absolute;
  top: 3px;
  right: 3px;
  background: var(--gold, #c9973a);
  color: #1a0f00;
  font-size: 9px;
  font-weight: 800;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Pool + modifier ─────────────────────────────────────────── */
.dp-middle {
  padding: 0 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.dp-pool-row { min-height: 18px; }
.dp-pool-text {
  font-size: 12px;
  color: var(--gold, #c9973a);
  font-family: monospace;
  letter-spacing: 0.02em;
}
.dp-pool-hint {
  font-size: 10px;
  color: #7a6a56;
  font-style: italic;
}
.dp-modifier-row {
  display: flex;
  align-items: center;
  gap: 7px;
}
.dp-mod-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7a6a56;
  flex: 1;
}
.dp-mod-btn {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(184,134,11,0.28);
  background: transparent;
  color: #9a8a72;
  font-size: 16px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
  transition: all 0.12s;
}
.dp-mod-btn:hover { border-color: var(--gold); color: var(--gold); background: rgba(184,134,11,0.1); }
.dp-mod-val {
  font-size: 14px;
  font-weight: 700;
  font-family: monospace;
  width: 48px;
  text-align: center;
  color: var(--ink, #d4c5a9);
  background: transparent;
  border: 1px solid rgba(184,134,11,0.22);
  border-radius: 4px;
  padding: 2px 4px;
  outline: none;
  -moz-appearance: textfield;
}
.dp-mod-val::-webkit-outer-spin-button,
.dp-mod-val::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.dp-mod-val:focus {
  border-color: rgba(184,134,11,0.55);
}
.dp-mod--pos { color: #7dd89a; }
.dp-mod--neg { color: var(--blood, #c03030); }
.dp-mod--zero { color: #8a7a65; }

/* ── Actions ─────────────────────────────────────────────────── */
.dp-actions {
  display: flex;
  gap: 8px;
  padding: 0 12px 12px;
}
.dp-btn-clear {
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(184,134,11,0.22);
  border-radius: 6px;
  background: transparent;
  color: #8a7a65;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.15s;
}
.dp-btn-clear:hover { background: rgba(255,255,255,0.04); color: var(--ink, #d4c5a9); }
.dp-btn-roll {
  flex: 2;
  padding: 8px;
  border: 1px solid rgba(184,134,11,0.45);
  border-radius: 6px;
  background: rgba(184,134,11,0.1);
  color: var(--gold, #c9973a);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: all 0.15s;
}
.dp-btn-roll:hover:not(:disabled) {
  background: rgba(184,134,11,0.2);
  border-color: var(--gold, #c9973a);
  box-shadow: 0 0 14px rgba(184,134,11,0.2);
}
.dp-btn-roll:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Result ──────────────────────────────────────────────────── */
.dp-result {
  margin: 0 12px 10px;
  padding: 14px 12px 12px;
  background: rgba(60,45,25,0.55);
  border: 1px solid rgba(184,134,11,0.22);
  border-radius: 8px;
  text-align: center;
}
.dp-result--crit {
  border-color: rgba(184,134,11,0.6);
  background: rgba(184,134,11,0.07);
  box-shadow: 0 0 24px rgba(184,134,11,0.12);
}
.dp-result--fail {
  border-color: rgba(180,40,40,0.4);
  background: rgba(180,40,40,0.06);
}
.dp-result-badge {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.dp-result-badge--crit { color: var(--gold, #c9973a); }
.dp-result-badge--fail { color: var(--blood, #c03030); }
.dp-result-total {
  font-size: 48px;
  font-weight: 700;
  font-family: var(--font-head, serif);
  color: var(--gold, #c9973a);
  line-height: 1;
  margin-bottom: 6px;
}
.dp-result--fail .dp-result-total { color: var(--blood, #c03030); }
.dp-result-breakdown {
  font-size: 11px;
  color: #c8b896;
  font-family: monospace;
  line-height: 1.5;
  word-break: break-all;
}

/* ── History ─────────────────────────────────────────────────── */
.dp-history {
  border-top: 1px solid rgba(184,134,11,0.1);
  padding: 8px 12px 12px;
}
.dp-history-head {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #7a6a56;
  margin-bottom: 6px;
}
.dp-history-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 3px 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  font-size: 11px;
}
.dp-history-row:last-child { border-bottom: none; }
.dp-history-dice { color: #9a8a72; font-family: monospace; }
.dp-history-total { font-weight: 700; color: var(--ink, #d4c5a9); }
.dp-his--crit { color: var(--gold, #c9973a); }
.dp-his--fail { color: var(--blood, #c03030); }

/* ── Transitions ─────────────────────────────────────────────── */
.dp-enter-active { transition: opacity 0.2s, transform 0.22s cubic-bezier(0.34,1.56,0.64,1); transform-origin: bottom right; }
.dp-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; transform-origin: bottom right; }
.dp-enter-from, .dp-leave-to { opacity: 0; transform: scale(0.88) translateY(8px); }

.dp-res-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.dp-res-enter-from { opacity: 0; transform: scale(0.75); }
</style>
