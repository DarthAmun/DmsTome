<template>
  <div class="wse-body">
    <div v-if="loading" class="wse-loading">
      <OhVueIcon name="md-autorenew" scale="1.1" class="wse-spin" />
    </div>
    <template v-else-if="record">
      <div v-if="fieldEntries.length" class="wse-fields">
        <div v-for="f in fieldEntries" :key="f.label" class="wse-field">
          <div class="wse-field-label">{{ f.label }}</div>
          <div class="wse-field-val">{{ f.value }}</div>
        </div>
      </div>
      <div v-if="bodyText" class="wse-text">{{ bodyText }}</div>
      <em v-if="!fieldEntries.length && !bodyText" class="wse-empty">No data for this entry.</em>
    </template>
    <em v-else class="wse-empty">Record not found.</em>
  </div>
</template>

<script setup lang="ts">
import { getDb } from '~/composables/useDb'

const props = defineProps<{ recordId: number }>()

const loading = ref(true)
const record = ref<Record<string, any> | null>(null)

const SKIP_KEYS = new Set(['id', 'systemId', 'entityTypeId', 'name', 'createdAt', 'updatedAt'])
const TEXT_KEYS = /\b(description|desc|summary|effect|text|body|rules|detail|notes)\b/i

const fieldEntries = computed(() => {
  if (!record.value) return []
  return Object.entries(record.value)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && !TEXT_KEYS.test(k) && v != null && String(v).length < 80)
    .map(([k, v]) => ({ label: k.replace(/([A-Z])/g, ' $1').trim(), value: String(v) }))
    .slice(0, 6)
})

const bodyText = computed(() => {
  if (!record.value) return ''
  for (const [k, v] of Object.entries(record.value)) {
    if (TEXT_KEYS.test(k) && typeof v === 'string' && v) return v
  }
  return ''
})

async function load() {
  loading.value = true
  try {
    const db = getDb()
    const raw = await db.records.get(props.recordId)
    if (!raw) { record.value = null; return }
    const data = typeof raw.data === 'string' ? JSON.parse(raw.data || '{}') : (raw.data ?? {})
    record.value = { ...data }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.recordId, load)
</script>

<style scoped>
.wse-body { padding: 10px 12px; overflow-y: auto; flex: 1; }
.wse-loading { display: flex; align-items: center; justify-content: center; height: 60px; color: var(--text3); }
.wse-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.wse-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 5px; margin-bottom: 10px; }
.wse-field { background: var(--surface); border: 1px solid var(--border); border-radius: 7px; padding: 6px 9px; }
.wse-field-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text3); margin-bottom: 2px; font-family: var(--fm); text-transform: capitalize; }
.wse-field-val { font-size: 12px; color: var(--text); font-weight: 500; }
.wse-text { font-size: 12.5px; color: var(--text2); line-height: 1.65; white-space: pre-wrap; }
.wse-empty { color: var(--text3); font-style: italic; font-size: 12px; }
</style>
