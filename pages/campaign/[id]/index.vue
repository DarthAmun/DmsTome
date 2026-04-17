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
          </div>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
import { dbApi } from '~/composables/useDb'
const route = useRoute()
const id = route.params.id
const name = ref('')
const desc = ref('')
onMounted(async () => {
  const camps = await dbApi.campaigns.list()
  const c = camps.find((x: any) => x.id === Number(id))
  name.value = c?.name ?? ''
  desc.value = c?.description ?? ''
})
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

</style>
