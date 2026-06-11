<template>
  <div class="turn-rail">
    <span class="turn-rail-round">ROUND {{ roundNumber }}</span>

    <div
      v-for="token in windowedTokens"
      :key="token.id"
      class="turn-rail-token"
      :class="{
        'turn-rail-token--active': token.id === activeTurnTokenId,
        'turn-rail-token--dead': token.isDead,
      }"
      :style="{ borderColor: borderColor(token) }"
      :title="token.label || token.name"
    >
      <img
        v-if="token.imageSource"
        :src="token.imageSource"
        class="turn-rail-portrait"
        :style="{ filter: token.isDead ? 'grayscale(1)' : 'none' }"
      />
      <span v-else class="turn-rail-initial">{{ (token.label || token.name).charAt(0) }}</span>
    </div>

    <!-- overflow indicator -->
    <span v-if="tokens.length > WINDOW" class="turn-rail-overflow">
      +{{ tokens.length - WINDOW }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { EncounterToken } from '~/stores/encounter'

const props = defineProps<{
  tokens: EncounterToken[]
  activeTurnTokenId: number | null
  roundNumber: number
}>()

const GOLD  = '#ffd700'
const ALLY  = '#1a8070'
const ENEMY = '#c0392b'
const DEAD  = '#8b2030'

// Max portraits to show at once — fits any screen ≥ 400 px
const WINDOW = 9

function borderColor(token: EncounterToken): string {
  if (token.id === props.activeTurnTokenId) return GOLD
  if (token.isDead) return DEAD
  return token.isPlayerToken ? ALLY : ENEMY
}

const windowedTokens = computed<EncounterToken[]>(() => {
  const all = props.tokens
  if (all.length <= WINDOW) return all

  const activeIdx = all.findIndex(t => t.id === props.activeTurnTokenId)
  const center = activeIdx >= 0 ? activeIdx : 0
  const half = Math.floor(WINDOW / 2)
  const n = all.length

  return Array.from({ length: WINDOW }, (_, i) => all[(center - half + i + n) % n])
})
</script>

<style scoped>
.turn-rail {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  background: rgba(13, 13, 28, 0.92);
  border: 1px solid #2a2a44;
  border-radius: 22px;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
}

.turn-rail-round {
  font-family: system-ui, sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #8a8ab0;
  flex-shrink: 0;
  margin-right: 2px;
}

.turn-rail-token {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;
  background: #101024;
  transition: box-shadow 0.15s;
}

.turn-rail-token--active {
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.45);
}

.turn-rail-token--dead {
  opacity: 0.45;
}

.turn-rail-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.turn-rail-initial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 11px;
  color: #c8c6e4;
}

.turn-rail-overflow {
  font-family: system-ui, sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: #8a8ab0;
  flex-shrink: 0;
}
</style>
