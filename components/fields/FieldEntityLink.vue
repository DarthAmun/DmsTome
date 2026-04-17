<template>
  <div class="field-wrap">
    <!-- Edit: searchable select of records from the target type -->
    <template v-if="mode === 'edit'">
      <select class="f-input-box f-select" :value="value ?? ''" @change="onChange">
        <option value="">— none —</option>
        <option v-for="r in records" :key="r.id" :value="r.name">{{ r.name }}</option>
      </select>
    </template>

    <!-- View: clickable chip -->
    <template v-else>
      <span v-if="value" class="el-chip" :style="chipStyle" @click="navigate">
        <OhVueIcon v-if="targetType" :name="targetType.icon" scale="0.75" />
        {{ value }}
      </span>
      <span v-else class="f-view-empty">—</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSystemsStore } from '~/stores/systems'
import { getDb } from '~/composables/useDb'
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{
  field: FieldSchema
  value: any
  mode: 'view' | 'edit'
  systemId?: number
}>()
const emit = defineEmits<{ update: [any] }>()

const router = useRouter()
const systemsStore = useSystemsStore()

const targetTypeId = computed(() => props.field.config.entityTypeId ?? '')
const system = computed(() => props.systemId ? systemsStore.getSystem(props.systemId) : null)
const targetType = computed(() => system.value?.entityTypes.find(t => t.id === targetTypeId.value) ?? null)

const records = ref<any[]>([])

watch([() => props.systemId, targetTypeId], async ([sysId, typeId]) => {
  if (!sysId || !typeId) { records.value = []; return }
  const rows = await getDb().records
    .where('systemId').equals(sysId)
    .filter(r => r.entityTypeId === typeId)
    .toArray()
  records.value = rows.sort((a, b) => a.name.localeCompare(b.name))
}, { immediate: true })

const chipStyle = computed(() => {
  const color = targetType.value?.color ?? '#888'
  return {
    color,
    borderColor: color,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
  }
})

function onChange(e: Event) {
  emit('update', (e.target as HTMLSelectElement).value || null)
}

function navigate() {
  if (!props.value || !props.systemId || !targetTypeId.value) return
  router.push(`/system/${props.systemId}/${targetTypeId.value}?record=${encodeURIComponent(props.value)}`)
}
</script>

<style scoped>
.el-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid;
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: opacity 0.15s;
}
.el-chip:hover { opacity: 0.75; }
.f-view-empty { font-size: 13px; color: var(--ink-ghost); }
</style>
