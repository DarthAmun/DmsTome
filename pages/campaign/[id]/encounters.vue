<template>
  <div class="enc-page">
    <div class="open-book">

      <!-- LEFT PAGE -->
      <div class="book-stack book-stack--left">
        <div class="book-sheet-3"></div>
        <div class="book-sheet-2"></div>
        <div class="book-sheet-1"></div>
        <div class="book-leaf book-leaf--left">
          <div class="page-header">
            <div class="page-chapter-num">{{ campaignName }}</div>
            <h1 class="page-title">The Battlefield</h1>
            <div class="page-rule" />
          </div>
          <div class="leaf-inner">
            <div class="leaf-header">
              <span class="leaf-type" style="color:var(--blood)">Encounters</span>
              <span class="leaf-count">{{ encounters.length }} engagements</span>
            </div>
            <div v-for="(enc, i) in pagedEncounters" :key="enc.id" class="entry"
              :style="{ '--et-color': enc.status === 'active' ? 'var(--blood)' : 'var(--ink-ghost)' }"
              @click="openEncounter(enc)">
              <span class="entry-num">{{ listPage * PAGE_SIZE + i + 1 }}</span>
              <div class="entry-icon">
                <div class="entry-badge">
                  <OhVueIcon name="gi-broadsword" scale="0.75"
                    :style="{ color: enc.status === 'active' ? 'var(--blood)' : 'var(--ink-faded)' }" />
                </div>
              </div>
              <div class="entry-body">
                <div class="entry-top">
                  <span class="entry-name">{{ enc.name }}</span>
                  <span class="entry-leader" />
                  <span class="entry-date">{{ formatDate(enc.updated_at) }}</span>
                  <div class="entry-actions" @click.stop>
                    <button class="entry-act entry-act--del" @click.stop="deleteEncounter(enc.id)">
                      <OhVueIcon name="md-delete" scale="0.75" />
                    </button>
                  </div>
                </div>
                <div class="entry-attrs">
                  <span class="ea-bool" :class="enc.status === 'active' ? 'ea-bool--danger' : 'ea-bool--muted'">
                    {{ enc.status || 'prepared' }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="!encounters.length" class="leaf-empty">
              <OhVueIcon name="gi-broadsword" scale="2.5" style="opacity:0.07;margin-bottom:10px" />
              <em>No encounters yet. Begin a new engagement.</em>
            </div>
          </div>
          <div class="leaf-footer">
            <button class="leaf-nav-btn" :disabled="!hasPrevPage" @click="prevPage">
              <OhVueIcon name="md-chevronleft" scale="0.9" />
            </button>
            <button class="leaf-new" @click="createEncounter">
              <span class="leaf-new-line-l"></span>
              <span class="leaf-new-label">✦ New Encounter ✦</span>
              <span class="leaf-new-line-r"></span>
            </button>
            <span class="leaf-folio-num">{{ listPage + 1 }} / {{ totalPages }}</span>
            <button class="leaf-nav-btn" :disabled="!hasNextPage" @click="nextPage">
              <OhVueIcon name="md-chevronright" scale="0.9" />
            </button>
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
            <OhVueIcon name="gi-broadsword" scale="4" style="opacity:0.05;margin-bottom:24px" />
            <p class="right-hint"><em>Select an encounter to open<br>the full battlefield editor.</em></p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const campaignId = Number(route.params.id)
const campaignName = ref('')
const encounters = ref<any[]>([])

const PAGE_SIZE = 10
const listPage = ref(0)
const hasPrevPage = computed(() => listPage.value > 0)
const hasNextPage = computed(() => (listPage.value + 1) * PAGE_SIZE < encounters.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(encounters.value.length / PAGE_SIZE)))
const pagedEncounters = computed(() => encounters.value.slice(listPage.value * PAGE_SIZE, (listPage.value + 1) * PAGE_SIZE))

function prevPage() { if (hasPrevPage.value) listPage.value-- }
function nextPage() { if (hasNextPage.value) listPage.value++ }
watch(encounters, () => { listPage.value = 0 })

onMounted(async () => {
  if (window.dmforge) {
    const camps = await window.dmforge.campaigns.list()
    campaignName.value = camps.find((c: any) => c.id === campaignId)?.name ?? ''
    await loadEncounters()
  }
})

async function loadEncounters() {
  encounters.value = await window.dmforge.encounters.list(campaignId)
}

function openEncounter(enc: any) {
  router.push(`/encounter/${enc.id}`)
}

async function createEncounter() {
  const enc = await window.dmforge.encounters.create(campaignId, 'New Encounter')
  router.push(`/encounter/${enc.id}`)
}

async function deleteEncounter(id: number) {
  if (!confirm('Delete this encounter?')) return
  await window.dmforge.encounters.delete(id)
  await loadEncounters()
}

function formatDate(dt: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.enc-page { height: 100%; display: flex; flex-direction: column; background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply; overflow: visible; }

.leaf-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--parch-line); }
.leaf-type  { font-family: var(--font-head); font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; }
.leaf-count { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); }
.leaf-empty { display: flex; flex-direction: column; align-items: center; padding: 32px 0; color: var(--ink-ghost); font-family: var(--font-body); font-size: 14px; font-style: italic; gap: 0; }

/* Entry */
.entry {
  align-items: flex-start;
  border-left: 2px solid transparent;
  transition: border-color 0.15s, background 0.15s;
}
.entry:hover {
  border-left-color: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 40%, transparent);
  background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 4%, transparent);
}

.entry-num { font-family: var(--font-mono); font-size: 9px; color: var(--ink-ghost); opacity: 0.4; width: 18px; flex-shrink: 0; text-align: right; padding-top: 2px; line-height: 1; }
.entry-icon { width: 32px; height: 26px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.entry-badge {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--et-color, var(--ink-ghost)) 13%, transparent);
  border: 1px solid color-mix(in srgb, var(--et-color, var(--ink-ghost)) 30%, transparent);
  flex-shrink: 0;
}
.entry-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.entry-top { display: flex; align-items: center; gap: 6px; }
.entry-name { font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.entry-leader { flex: 1; min-width: 8px; border-bottom: 1px dotted var(--ink-ghost); opacity: 0.3; align-self: center; position: relative; top: 1px; }
.entry-date { font-family: var(--font-head); font-size: 8px; color: var(--ink-ghost); letter-spacing: 0.05em; flex-shrink: 0; white-space: nowrap; }
.entry-attrs { display: flex; flex-wrap: nowrap; align-items: center; gap: 5px; padding-bottom: 3px; overflow: hidden; }
.entry-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
.entry:hover .entry-actions { opacity: 1; }
.entry-act { width: 18px; height: 18px; border-radius: 2px; background: rgba(28,20,16,0.06); border: 1px solid transparent; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.entry-act--del:hover { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }

.ea-bool { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-head); font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 7px 2px 5px; border-radius: 2px; color: var(--gold); background: rgba(184,134,11,0.08); border: 1px solid rgba(184,134,11,0.3); flex-shrink: 0; }
.ea-bool--danger { color: var(--blood); background: rgba(139,26,26,0.08); border-color: rgba(139,26,26,0.3); }
.ea-bool--muted  { color: var(--ink-ghost); background: rgba(28,20,16,0.05); border-color: rgba(28,20,16,0.15); }

/* Footer pagination */
.leaf-footer { display: flex; align-items: center; gap: 8px; padding: 8px 16px 14px; border-top: 1px dashed var(--parch-line); background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply; }
.leaf-footer .leaf-new { flex: 1; width: auto; }
.leaf-nav-btn { width: 26px; height: 26px; border-radius: 2px; background: none; border: 1px solid var(--parch-line); color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
.leaf-nav-btn:hover:not(:disabled) { border-color: var(--ink-faded); color: var(--ink); }
.leaf-nav-btn:disabled { opacity: 0.25; cursor: default; }
.leaf-folio-num { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); letter-spacing: 0.12em; white-space: nowrap; }
</style>
