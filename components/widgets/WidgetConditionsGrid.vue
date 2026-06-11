<template>
  <div class="wcg-body">
    <div class="wcg-scroll">
    <div v-if="loading" class="wcg-loading">
      <OhVueIcon name="md-autorenew" scale="1.1" class="wcg-spin" />
    </div>
    <template v-else>
      <div v-if="conditions.length" class="wcg-grid">
        <button
          v-for="c in conditions"
          :key="c.name"
          class="wcg-tile"
          :title="c.summary"
          @click="openCondition(c.name)"
        >
          <span class="wcg-tile-name">{{ c.name }}</span>
          <span v-if="c.summary" class="wcg-tile-sum">{{ c.summary }}</span>
        </button>
      </div>
      <div v-else class="wcg-empty">
        No conditions found in linked system.<br>
        <span class="wcg-empty-hint">Create a "condition" entity type in your system to populate this widget.</span>
      </div>
    </template>

    </div><!-- wcg-scroll -->

    <!-- Condition detail panel -->
    <ConditionPanel
      :condition-name="panelName"
      :system-id="systemId"
      :open="panelOpen"
      @close="panelOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { getDb, parseRecordData } from '~/composables/useDb'

const props = defineProps<{ systemId: number | null }>()

const loading = ref(false)
const panelOpen = ref(false)
const panelName = ref('')

interface Condition { name: string; summary: string }
const conditions = ref<Condition[]>([])

const FALLBACK: Condition[] = [
  { name: 'Blinded',     summary: 'Cannot see; auto-fail sight checks.' },
  { name: 'Charmed',     summary: 'Cannot attack charmer; charmer has advantage.' },
  { name: 'Clumsy',      summary: 'Penalty to Dex-based checks and AC.' },
  { name: 'Confused',    summary: 'Acts randomly; may attack allies.' },
  { name: 'Dazzled',     summary: 'Everything is concealed.' },
  { name: 'Deafened',    summary: 'Cannot hear; penalty to initiative.' },
  { name: 'Doomed',      summary: 'Dying threshold is reduced.' },
  { name: 'Drained',     summary: 'Penalty to Con checks; lose max HP.' },
  { name: 'Dying',       summary: 'Unconscious and approaching death.' },
  { name: 'Enfeebled',   summary: 'Penalty to Str-based checks and damage.' },
  { name: 'Fatigued',    summary: '-1 AC and saves; no exploration activities.' },
  { name: 'Flat-Footed', summary: '-2 circumstance penalty to AC.' },
  { name: 'Fleeing',     summary: 'Must move away from the source each action.' },
  { name: 'Frightened',  summary: 'Penalty to all checks; reduces each turn.' },
  { name: 'Grabbed',     summary: 'Immobilized and flat-footed.' },
  { name: 'Immobilized', summary: 'Cannot move voluntarily.' },
  { name: 'Invisible',   summary: 'Cannot be seen; harder to detect.' },
  { name: 'Paralyzed',   summary: 'Cannot act; flat-footed.' },
  { name: 'Petrified',   summary: 'Turned to stone; object immunities.' },
  { name: 'Poisoned',    summary: 'Afflicted by a poison; takes stage effects.' },
  { name: 'Prone',       summary: '-2 attack rolls; melee +1 vs you.' },
  { name: 'Quickened',   summary: 'Gain 1 extra action per turn.' },
  { name: 'Restrained',  summary: 'Grabbed and immobilized.' },
  { name: 'Sickened',    summary: 'Penalty to all checks and DCs.' },
  { name: 'Slowed',      summary: 'Fewer actions per turn.' },
  { name: 'Stunned',     summary: 'Lose actions each turn.' },
  { name: 'Stupefied',   summary: 'Penalty to Int/Wis/Cha; spell failure.' },
  { name: 'Unconscious', summary: 'Unable to act; prone, blinded, flat-footed.' },
  { name: 'Wounded',     summary: 'Dying value increases next time you fall.' },
]

async function load() {
  loading.value = true
  try {
    if (props.systemId) {
      const db = getDb()
      const sys = await db.systems.get(props.systemId)
      const entityTypes: any[] = sys
        ? (typeof sys.entityTypes === 'string' ? JSON.parse(sys.entityTypes || '[]') : (sys.entityTypes ?? []))
        : []
      const condTypeIds = entityTypes
        .filter((et: any) => /condition/i.test(et.id ?? '') || /condition/i.test(et.name ?? ''))
        .map((et: any) => et.id as string)
      if (!condTypeIds.includes('condition')) condTypeIds.push('condition')

      const recs = await db.records
        .where('systemId').equals(props.systemId)
        .filter((r: any) => condTypeIds.includes(r.entityTypeId))
        .toArray()

      if (recs.length) {
        conditions.value = recs.map((r: any) => {
          const data: Record<string, any> = parseRecordData(r.data)
          return { name: r.name, summary: data.summary ?? data.effect ?? data.description ?? '' }
        }).sort((a: Condition, b: Condition) => a.name.localeCompare(b.name))
        return
      }
    }
    conditions.value = FALLBACK
  } finally {
    loading.value = false
  }
}

function openCondition(name: string) {
  panelName.value = name
  panelOpen.value = true
}

onMounted(load)
watch(() => props.systemId, load)
</script>

<style scoped>
.wcg-body { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.wcg-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 10px; }

.wcg-loading {
  display: flex; align-items: center; justify-content: center;
  height: 80px; color: var(--text3);
}
.wcg-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.wcg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 5px;
}
.wcg-tile {
  display: flex; flex-direction: column; align-items: flex-start;
  padding: 6px 8px; border-radius: 7px; text-align: left; cursor: pointer;
  background: var(--surface); border: 1px solid var(--border);
  transition: all 0.12s;
}
.wcg-tile:hover {
  background: var(--accent-bg);
  border-color: color-mix(in oklch, var(--accent) 30%, transparent);
}
.wcg-tile-name {
  font-size: 11px; font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;
}
.wcg-tile-sum {
  font-size: 9.5px; color: var(--text3); line-height: 1.35;
  margin-top: 2px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.wcg-tile:hover .wcg-tile-name { color: var(--accent-l); }

.wcg-empty {
  padding: 20px 8px; font-size: 12px; color: var(--text3);
  text-align: center; line-height: 1.6;
}
.wcg-empty-hint { font-size: 10.5px; color: var(--text3); }
</style>
