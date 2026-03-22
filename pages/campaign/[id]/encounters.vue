<template>
  <div class="enc-page">
    <div class="page-header enc-header">
      <div class="page-chapter-num">{{ campaignName }}</div>
      <h1 class="page-title">The Battlefield</h1>
      <div class="page-rule" />
    </div>

    <!-- Open book spread -->
    <div class="open-book">

      <!-- LEFT PAGE — encounter list -->
      <div class="book-leaf book-leaf--left">
        <div class="leaf-inner">
          <div class="leaf-header">
            <span class="leaf-type" style="color:var(--blood)">Encounters</span>
            <span class="leaf-count">{{ encounters.length }} engagements</span>
          </div>

          <div v-for="enc in encounters" :key="enc.id" class="entry" @click="openEncounter(enc)">
            <div class="entry-icon">
              <OhVueIcon name="gi-broadsword" scale="0.9" style="color:var(--blood)" />
            </div>
            <span class="entry-name">{{ enc.name }}</span>
            <span class="entry-dots" />
            <span class="entry-tag" :style="enc.status === 'active' ? 'color:var(--blood);border-color:var(--blood)' : ''">
              {{ enc.status || 'prepared' }}
            </span>
            <span class="entry-date">{{ formatDate(enc.updated_at) }}</span>
            <div class="entry-actions" @click.stop>
              <button class="entry-act entry-act--del" @click.stop="deleteEncounter(enc.id)">
                <OhVueIcon name="md-delete" scale="0.75" />
              </button>
            </div>
          </div>

          <div v-if="!encounters.length" class="leaf-empty">
            <OhVueIcon name="gi-broadsword" scale="2.5" style="opacity:0.07;margin-bottom:10px" />
            <em>No encounters yet. Begin a new engagement.</em>
          </div>
        </div>

        <div class="leaf-footer">
          <button class="leaf-new" @click="createEncounter">
            <span class="leaf-new-line-l" />
            <span class="leaf-new-label">✦ New Encounter ✦</span>
            <span class="leaf-new-line-r" />
          </button>
        </div>
      </div>

      <!-- BINDING -->
      <div class="book-binding" />

      <!-- RIGHT PAGE — hint or last-opened -->
      <div class="book-leaf book-leaf--right">
        <div class="leaf-inner--right">
          <OhVueIcon name="gi-broadsword" scale="4" style="opacity:0.05;margin-bottom:24px" />
          <p class="right-hint">
            <em>Select an encounter to open<br>the full battlefield editor.</em>
          </p>
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
.enc-page { height: 100%; display: flex; flex-direction: column; background: var(--parch); overflow: hidden; }
.enc-header { padding-bottom: 0; flex-shrink: 0; }

/* Open book */
.open-book { flex: 1; display: flex; overflow: hidden; background: var(--leather); }
.book-leaf { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--parch); overflow: hidden; }
.book-leaf--left  { box-shadow:  4px 0 16px rgba(0,0,0,0.2); }
.book-leaf--right { box-shadow: -4px 0 16px rgba(0,0,0,0.12); }
.book-binding { width: 10px; flex-shrink: 0; background: linear-gradient(to right, rgba(0,0,0,0.22), rgba(0,0,0,0.06) 40%, rgba(0,0,0,0.06) 60%, rgba(0,0,0,0.22)); position: relative; }
.book-binding::before { content: ''; position: absolute; top:0; bottom:0; left:3px; right:3px; background: var(--leather); opacity: 0.85; }
.leaf-inner { flex: 1; overflow-y: auto; padding: 20px 28px 12px; background: var(--parch); }
.leaf-inner--right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; background: var(--parch); }
.leaf-footer { padding: 10px 28px 16px; border-top: 1px dashed var(--parch-line); background: var(--parch); }

.leaf-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--parch-line); }
.leaf-type  { font-family: var(--font-head); font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; }
.leaf-count { font-family: var(--font-head); font-size: 9px; color: var(--ink-ghost); }
.leaf-empty { display: flex; flex-direction: column; align-items: center; padding: 32px 0; color: var(--ink-ghost); font-family: var(--font-body); font-size: 14px; font-style: italic; gap: 0; }

.entry-icon { width: 26px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.entry-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; }
.entry:hover .entry-actions { opacity: 1; }
.entry-act { width: 20px; height: 20px; border-radius: 2px; background: rgba(28,20,16,0.06); border: 1px solid transparent; color: var(--ink-ghost); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.entry-act--del:hover { background: var(--blood-pale); color: var(--blood); border-color: var(--blood); }

.leaf-new { display: flex; align-items: center; gap: 12px; width: 100%; background: none; border: none; cursor: pointer; padding: 4px 0; }
.leaf-new-line-l { flex: 1; height: 1px; background: linear-gradient(to right, transparent, var(--ink-ghost)); }
.leaf-new-line-r { flex: 1; height: 1px; background: linear-gradient(to left, transparent, var(--ink-ghost)); }
.leaf-new-label { font-family: var(--font-head); font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-ghost); white-space: nowrap; flex-shrink: 0; transition: color 0.2s; }
.leaf-new:hover .leaf-new-label { color: var(--blood); }
.leaf-new:hover .leaf-new-line-l { background: linear-gradient(to right, transparent, var(--blood)); }
.leaf-new:hover .leaf-new-line-r { background: linear-gradient(to left, transparent, var(--blood)); }

.right-hint { font-family: var(--font-body); font-size: 15px; color: var(--ink-ghost); font-style: italic; text-align: center; line-height: 1.8; }
</style>
