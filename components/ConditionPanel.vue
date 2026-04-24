<template>
  <Teleport to="body">
    <Transition name="cond-panel-slide">
      <div v-if="open" class="cond-panel" @keydown.esc.capture.stop="$emit('close')">
        <div class="cond-panel-header">
          <span class="cond-panel-title">{{ conditionName }}<span v-if="value !== null && value !== undefined" class="cond-panel-value"> {{ value }}</span></span>
          <button class="cond-panel-close" @click="$emit('close')">✕</button>
        </div>

        <div v-if="loading" class="cond-panel-loading">
          <OhVueIcon name="md-autorenew" scale="1.2" class="spin" />
        </div>

        <div v-else-if="record && entityType" class="cond-panel-entity">
          <EntityLayout
            :entity-type="entityType"
            :data="record.data"
            mode="view"
            :system-id="systemId ?? undefined"
            :accent-color="entityType.color"
          />
        </div>

        <div v-else class="cond-panel-notfound">
          <OhVueIcon name="gi-poison" scale="2.5" class="cond-panel-notfound-icon" />
          <p class="cond-panel-notfound-text">No condition record found for<br><strong>{{ conditionName }}</strong></p>
          <p class="cond-panel-notfound-hint">Add a "condition" entity type to your system and create a matching record to see details here.</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { getDb } from '~/composables/useDb'
import { useSystemsStore } from '~/stores/systems'

const props = defineProps<{
  conditionName: string
  systemId: number | null
  value?: number | null
  open: boolean
}>()

defineEmits<{ close: [] }>()

const systemsStore = useSystemsStore()
const loading = ref(false)
const record = ref<{ name: string; data: Record<string, any> } | null>(null)
const entityType = ref<any | null>(null)

async function loadCondition() {
  if (!props.conditionName || !props.systemId) {
    record.value = null
    entityType.value = null
    return
  }
  loading.value = true
  try {
    const db = getDb()
    const lower = props.conditionName.toLowerCase()
    const rows = await db.records
      .where('systemId')
      .equals(props.systemId)
      .filter(r => r.entityTypeId === 'condition' && r.name.toLowerCase() === lower)
      .first()

    if (!rows) {
      record.value = null
      entityType.value = null
      return
    }

    if (!systemsStore.getSystem(props.systemId)) await systemsStore.loadAll()
    const sys = systemsStore.getSystem(props.systemId)
    const et = sys?.entityTypes?.find((e: any) => e.id === 'condition') ?? null

    record.value = {
      name: rows.name,
      data: typeof rows.data === 'string' ? JSON.parse(rows.data || '{}') : (rows.data ?? {}),
    }
    entityType.value = et
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.conditionName, props.systemId] as const,
  ([open]) => { if (open) loadCondition() },
  { immediate: true }
)
</script>

<style scoped>
.cond-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 340px;
  background: var(--parch);
  border-left: 1px solid var(--parch-line);
  box-shadow: -4px 0 24px rgba(0,0,0,.35);
  display: flex;
  flex-direction: column;
  z-index: 1100;
  overflow-y: auto;
}

.cond-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}

.cond-panel-title {
  font-family: 'Cinzel', serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--blood);
}

.cond-panel-value {
  font-size: 13px;
  color: var(--ink-ghost);
  font-weight: 400;
  margin-left: 2px;
}

.cond-panel-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--ink-ghost);
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}
.cond-panel-close:hover { background: var(--parch-line); color: var(--ink); }

.cond-panel-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-ghost);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.cond-panel-notfound {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 24px;
  text-align: center;
}

.cond-panel-entity {
  padding: 10px;
}

.cond-panel-notfound-icon { opacity: 0.25; color: var(--blood); }

.cond-panel-notfound-text {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  color: var(--ink);
  margin: 0;
  line-height: 1.5;
}

.cond-panel-notfound-hint {
  font-size: 12px;
  color: var(--ink-ghost);
  margin: 0;
  line-height: 1.5;
}

/* Slide transition */
.cond-panel-slide-enter-active,
.cond-panel-slide-leave-active {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cond-panel-slide-enter-from,
.cond-panel-slide-leave-to {
  transform: translateX(100%);
}
.cond-panel-slide-enter-to,
.cond-panel-slide-leave-from {
  transform: translateX(0);
}
</style>
