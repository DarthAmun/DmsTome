<template>
  <div class="entry" @click="$emit('open')">

    <div class="media">
      <img v-if="attrs.imageSource" :src="attrs.imageSource" class="thumb" />
      <div v-else class="icon-wrap">
        <OhVueIcon name="gi-open-treasure-chest" scale="0.9" style="color: #ebbd34" />
      </div>
    </div>

    <div class="body">
      <span class="name">{{ entry.name }}</span>
      <div v-if="hasMeta" class="meta">
        <span v-if="attrs.rarity" class="rarity-badge" :style="{ color: rarityColor, borderColor: rarityColor + '66' }">
          {{ attrs.rarity }}
        </span>
        <span v-if="attrs.itemType" class="dim">{{ attrs.itemType }}</span>
        <span v-if="attrs.value" class="dim">· {{ attrs.value }}</span>
        <span v-if="attrs.isMagic" class="flag flag--magic">✦ magic</span>
        <span v-if="attrs.isCursed" class="flag flag--cursed">☠ cursed</span>
      </div>
    </div>

    <span class="entry-dots" />
    <span class="entry-date">{{ formatDateShort(entry.updatedAt) }}</span>

    <div v-if="deletable" class="entry-actions" @click.stop>
      <button class="entry-act entry-act--del" @click.stop="$emit('delete', entry.id)">
        <OhVueIcon name="md-delete" scale="0.75" />
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useFormatters } from '~/composables/useFormatters'
import type { Entity } from '~/stores/notes'
import type { ItemAttributes } from '~/types/entities'

const props = defineProps<{ entry: Entity; deletable?: boolean }>()
defineEmits<{ open: []; delete: [id: number] }>()

const { formatDateShort } = useFormatters()
const attrs = computed(() => (props.entry.attributes ?? {}) as ItemAttributes)

const rarityColor = computed(() => ({
  common: 'var(--ink-ghost)', uncommon: '#7cc44e', rare: '#5b8ee6', unique: '#c97de8',
} as any)[attrs.value.rarity ?? ''] ?? 'var(--ink-ghost)')

const hasMeta = computed(() => {
  const a = attrs.value
  return !!(a.rarity || a.itemType || a.isMagic || a.isCursed || a.value)
})
</script>


<style scoped>
.entry-dots { flex: 0 1 40px; min-width: 16px; }

.media {
  flex-shrink: 0;
  width: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb {
  width: 36px; height: 36px;
  border-radius: 4px;
  object-fit: cover;
  border: 1.5px solid rgba(235, 189, 52, 0.3);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.icon-wrap {
  width: 34px; height: 34px;
  border-radius: 4px;
  background: rgba(235, 189, 52, 0.08);
  border: 1.5px solid rgba(235, 189, 52, 0.25);
  display: flex; align-items: center; justify-content: center;
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}

.name {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--ink);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
}

.rarity-badge {
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 2px;
  border: 1px solid;
  flex-shrink: 0;
}

.dim {
  font-family: var(--font-head);
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--ink-ghost);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.flag {
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 2px;
  border: 1px solid currentColor;
  flex-shrink: 0;
}
.flag--magic  { color: var(--gold); }
.flag--cursed { color: var(--blood); }
</style>
