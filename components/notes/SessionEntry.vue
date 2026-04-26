<template>
  <div class="entry" @click="$emit('open')">

    <div class="media">
      <div class="session-num" :style="{ borderColor: modeColor + '66', color: modeColor }">
        <span class="session-n">{{ attrs.sessionNumber ?? '?' }}</span>
      </div>
    </div>

    <div class="body">
      <span class="name">{{ entry.name }}</span>
      <div v-if="hasMeta" class="meta">
        <span v-if="attrs.mode" class="mode-badge" :style="{ color: modeColor, borderColor: modeColor + '66' }">
          {{ attrs.mode }}
        </span>
        <span v-if="attrs.date" class="sess-date">{{ fmtDate(attrs.date) }}</span>
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
import type { SessionAttributes } from '~/types/entities'

const props = defineProps<{ entry: Entity; deletable?: boolean }>()
defineEmits<{ open: []; delete: [id: number] }>()

const { formatDateShort } = useFormatters()
const attrs = computed(() => (props.entry.attributes ?? {}) as SessionAttributes)

const modeColor = computed(() => ({
  planning: '#6b9fe8', running: '#7cc44e', finished: '#b87de8',
} as any)[attrs.value.mode ?? ''] ?? '#b87de8')

const hasMeta = computed(() => !!(attrs.value.mode || attrs.value.date))

function fmtDate(d: string): string {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
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

.session-num {
  width: 34px; height: 34px;
  border-radius: 4px;
  border: 1.5px solid;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
}

.session-n {
  font-family: 'Cinzel Decorative', var(--font-deco);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
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
  gap: 6px;
  overflow: hidden;
}

.mode-badge {
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

.sess-date {
  font-family: var(--font-head);
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--ink-ghost);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}
</style>
