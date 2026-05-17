<template>
  <div class="wl-root">
    <div class="wl-tabs">
      <button :class="['wl-tab', { active: view === 'text' }]" @click="view = 'text'">Details</button>
      <button :class="['wl-tab', { active: view === 'map' }]" @click="view = 'map'" :disabled="!hasMap">Map</button>
    </div>
    <div class="wl-body">
      <template v-if="view === 'text'">
        <div v-if="fields.length" class="wl-fields">
          <div v-for="f in fields" :key="f.label" class="wl-field">
            <div class="wl-field-label">{{ f.label }}</div>
            <div class="wl-field-val">{{ f.value }}</div>
          </div>
        </div>
        <MarkdownEditor
          :entity-id="entity.id!" :campaign-id="entity.campaignId"
          :content="notes" :show-tab-bar="false" initial-view-mode="mixed"
          class="wl-editor"
          @update:content="saveContent"
        />
      </template>
      <template v-else>
        <img v-if="mapSource" :src="mapSource" class="wl-map-img" alt="Location map" />
        <div v-else class="wl-map-empty">No map image uploaded for this location.</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Entity } from '~/composables/useEntities'
import { useEntities } from '~/composables/useEntities'

const props = defineProps<{ entity: Entity }>()
const store = useEntities()

const view = ref<'text' | 'map'>('text')
const attrs = computed(() => props.entity.attributes as any)
const notes = computed(() => props.entity.content ?? '')
const mapSource = computed(() => attrs.value?.imageSource || null)
const hasMap = computed(() => !!mapSource.value)

function saveContent(value: string) {
  store.updateEntity(props.entity.id!, { content: value })
}

const fields = computed(() => {
  const a = attrs.value ?? {}
  const result: { label: string; value: string }[] = []
  if (a.type || a.locationType) result.push({ label: 'Type', value: a.type ?? a.locationType })
  if (a.status) result.push({ label: 'Status', value: a.status })
  if (a.region) result.push({ label: 'Region', value: a.region })
  if (a.population) result.push({ label: 'Population', value: a.population })
  return result
})
</script>

<style scoped>
.wl-root { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
.wl-tabs {
  display: flex; flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface-hi);
}
.wl-tab {
  flex: 1; padding: 5px 8px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase;
  color: var(--text3); background: transparent; border: none; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 0.12s, border-color 0.12s;
}
.wl-tab:hover:not(:disabled) { color: var(--text2); }
.wl-tab.active { color: var(--accent-l); border-bottom-color: var(--accent); }
.wl-tab:disabled { opacity: 0.35; cursor: not-allowed; }

.wl-body { flex: 1; min-height: 0; display: flex; flex-direction: column; }

.wl-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 5px; padding: 10px 12px 0; flex-shrink: 0; margin-bottom: 4px; }
.wl-field {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 7px; padding: 6px 9px;
}
.wl-field-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text3); margin-bottom: 2px; font-family: var(--fm); }
.wl-field-val { font-size: 12px; color: var(--text); font-weight: 500; }
.wl-editor { flex: 1; min-height: 0; }
:deep(.markdown-editor .mixed-pane) { padding: 8px 12px 30px; }
.wl-empty { color: var(--text3); font-style: italic; font-size: 12px; }

.wl-map-img { width: 100%; height: 100%; object-fit: contain; border-radius: 6px; display: block; }
.wl-map-empty { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 12px; color: var(--text3); font-style: italic; text-align: center; }
</style>
