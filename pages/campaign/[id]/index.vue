<template>
  <div class="campaign-folio">
    <div class="open-book">

      <!-- LEFT PAGE -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <div class="page-header">
            <div class="page-chapter-num">Campaign</div>
            <h1 class="page-title">{{ name }}</h1>
            <div class="page-rule" />
          </div>
          <div class="leaf-inner">
            <p v-if="desc" class="folio-intro"><em>{{ desc }}</em></p>

            <NuxtLink :to="`/campaign/${id}/notes`" class="folio-chapter">
              <div class="folio-chapter-num">I</div>
              <div class="folio-chapter-body">
                <div class="folio-chapter-name">The Chronicle</div>
                <div class="folio-chapter-sub">NPCs, locations, quests, sessions &amp; lore</div>
              </div>
              <div class="folio-chapter-arrow">→</div>
            </NuxtLink>

            <NuxtLink :to="`/campaign/${id}/encounters`" class="folio-chapter">
              <div class="folio-chapter-num">II</div>
              <div class="folio-chapter-body">
                <div class="folio-chapter-name">The Battlefield</div>
                <div class="folio-chapter-sub">Tactical maps, tokens &amp; fog of war</div>
              </div>
              <div class="folio-chapter-arrow">→</div>
            </NuxtLink>

            <NuxtLink :to="`/campaign/${id}/map`" class="folio-chapter">
              <div class="folio-chapter-num">III</div>
              <div class="folio-chapter-body">
                <div class="folio-chapter-name">The Atlas</div>
                <div class="folio-chapter-sub">World maps with pinned locations</div>
              </div>
              <div class="folio-chapter-arrow">→</div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="book-binding"></div>

      <!-- RIGHT PAGE -->
      <div class="book-stack book-stack--right">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--right">
          <div class="leaf-inner--right">
            <OhVueIcon name="gi-spell-book" scale="5" style="opacity:0.05;margin-bottom:28px" />
            <p class="right-hint"><em>Choose a chapter to begin.</em></p>

            <!-- System link -->
            <div class="sys-link-block">
              <div class="sys-link-label">Linked System</div>
              <p class="sys-link-hint">Link a rules system to enable token stat auto-fill and condition lookups in encounters.</p>
              <select class="sys-link-select" :value="linkedSystemId ?? ''" @change="setLinkedSystem($event)">
                <option value="">— None —</option>
                <option v-for="s in availableSystems" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <span v-if="linkedSystemId" class="sys-link-badge">
                <OhVueIcon name="md-check" scale="0.7" /> linked
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
import { dbApi, getDb } from '~/composables/useDb'
const route = useRoute()
const id = route.params.id
const name = ref('')
const desc = ref('')
const linkedSystemId = ref<number | null>(null)
const availableSystems = ref<Array<{ id: number; name: string }>>([])

onMounted(async () => {
  const camps = await dbApi.campaigns.list()
  const c = camps.find((x: any) => x.id === Number(id))
  name.value = c?.name ?? ''
  desc.value = c?.description ?? ''
  linkedSystemId.value = (c as any)?.system_id ?? null

  const sys = await getDb().systems.toArray()
  availableSystems.value = sys.map(s => ({ id: s.id!, name: s.name }))
})

async function setLinkedSystem(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  const sysId = val ? Number(val) : null
  linkedSystemId.value = sysId
  await dbApi.campaigns.update(Number(id), { system_id: sysId })
}
</script>

<style scoped>
.campaign-folio { height: 100%; display: flex; flex-direction: column; background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply; overflow: visible; }

/* Open book */






.leaf-inner { flex: 1; overflow-y: auto; padding: 24px 32px 20px; background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply; }

.folio-intro {
  font-family: var(--font-body); font-size: 15px; color: var(--ink-faded);
  margin-bottom: 28px; line-height: 1.7; padding-bottom: 20px;
  border-bottom: 1px solid var(--parch-line); font-style: italic;
}

.folio-chapter {
  display: flex; align-items: center; gap: 20px;
  padding: 20px 0; border-bottom: 1px dashed var(--parch-line);
  text-decoration: none; cursor: pointer; transition: all 0.18s; position: relative;
}
.folio-chapter:hover { padding-left: 10px; }
.folio-chapter:hover::before { content: '›'; position: absolute; left: -4px; color: var(--blood); font-size: 20px; }

.folio-chapter-num { font-family: var(--font-deco); font-size: 28px; font-weight: 700; color: var(--blood); opacity: 0.35; width: 36px; text-align: center; flex-shrink: 0; line-height: 1; transition: opacity 0.18s; }
.folio-chapter:hover .folio-chapter-num { opacity: 0.8; }
.folio-chapter-body { flex: 1; }
.folio-chapter-name { font-family: var(--font-head); font-size: 14px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink); margin-bottom: 4px; }
.folio-chapter-sub { font-family: var(--font-body); font-size: 14px; color: var(--ink-faded); font-style: italic; }
.folio-chapter-arrow { font-size: 18px; color: var(--ink-ghost); transition: color 0.18s, transform 0.18s; }
.folio-chapter:hover .folio-chapter-arrow { color: var(--blood); transform: translateX(6px); }

.leaf-inner--right {
  flex: 1; overflow-y: auto; padding: 24px 32px 20px;
  display: flex; flex-direction: column; align-items: center;
}
.right-hint { color: var(--ink-ghost); font-style: italic; font-size: 14px; margin: 0 0 32px; }

.sys-link-block {
  width: 100%;
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px dashed var(--parch-line);
}
.sys-link-label {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  margin-bottom: 6px;
}
.sys-link-hint {
  font-size: 12px;
  color: var(--ink-ghost);
  font-style: italic;
  margin: 0 0 10px;
  line-height: 1.5;
}
.sys-link-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  background: var(--parch);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 13px;
}
.sys-link-select:focus { outline: 1px solid var(--gold); }
.sys-link-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 6px;
  font-size: 11px;
  color: #4a8f5a;
  font-family: var(--font-ui);
}
</style>
