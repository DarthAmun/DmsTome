<template>
  <div class="field-wrap">
    <textarea v-if="mode === 'edit'" class="f-textarea"
      :placeholder="field.config.placeholder ?? field.label"
      :rows="field.config.rows ?? 4"
      :value="value ?? ''"
      @input="$emit('update', ($event.target as HTMLTextAreaElement).value)" />
    <div v-else-if="value" class="f-md markdown-body-sm" v-html="rendered" @click="onLinkClick" />
    <span v-else class="f-view-empty">—</span>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSystemsStore } from '~/stores/systems'
import { getDb } from '~/composables/useDb'
import { useEntityMarkdown } from '~/composables/useEntityMarkdown'
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{
  field: FieldSchema
  value: any
  mode: 'view' | 'edit'
  systemId?: number
}>()
defineEmits<{ update: [any] }>()

const router = useRouter()
const systemsStore = useSystemsStore()
const { renderMarkdown } = useEntityMarkdown()

const system = computed(() => props.systemId ? systemsStore.getSystem(props.systemId) : null)
const entityTypeIds = computed(() => system.value?.entityTypes.map(t => t.id) ?? [])

// Cache of record names → color for lookup
const recordColorCache = ref<Map<string, string>>(new Map())

watch(() => props.systemId, async (id) => {
  if (!id) return
  const db = getDb()
  const recs = await db.records.where('systemId').equals(id).toArray()
  const map = new Map<string, string>()
  for (const r of recs) {
    const et = system.value?.entityTypes.find(t => t.id === r.entityTypeId)
    map.set(`${r.entityTypeId}:${r.name.toLowerCase()}`, et?.color ?? '#888')
  }
  recordColorCache.value = map
}, { immediate: true })

function sysLookup(type: string, name: string) {
  const color = recordColorCache.value.get(`${type}:${name.toLowerCase()}`)
  if (!color) return null
  return { color }
}

const rendered = computed(() =>
  renderMarkdown(props.value || '', {
    entityLookup: entityTypeIds.value.length ? sysLookup : undefined,
    extraTypes: entityTypeIds.value.length ? entityTypeIds.value : undefined,
  })
)

function onLinkClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.classList.contains('entity-ref')) return
  const type = target.dataset.entityType
  const name = target.dataset.entityName
  if (!type || !name || !props.systemId) return
  router.push(`/system/${props.systemId}/${type}?open=${encodeURIComponent(name)}`)
}
</script>

<style scoped>
.f-textarea { width:100%;background:var(--parch-dark);border:1px solid var(--parch-line);border-radius:var(--r-md);padding:8px 10px;color:var(--ink);font-size:13px;font-family:'JetBrains Mono',monospace;outline:none;resize:vertical;transition:border-color 0.15s; }
.f-textarea:focus { border-color:var(--ink-ghost); }
.f-view-empty { font-size:13px;color:var(--ink-ghost); }
</style>
<style>
.markdown-body-sm { font-size:13px;color:var(--ink);font-family:'DM Sans',sans-serif;line-height:1.6; }
.markdown-body-sm p { margin:0.3em 0; }
.markdown-body-sm h1,.markdown-body-sm h2,.markdown-body-sm h3 { color:var(--gold);margin:0.8em 0 0.3em; }
</style>
