<template>
  <div class="camp-home">
    <header class="camp-home-header">
      <h1 class="camp-title">{{ campaignName }}</h1>
      <p v-if="campaignDesc" class="camp-desc">{{ campaignDesc }}</p>
    </header>
    <div class="camp-modules">
      <NuxtLink :to="`/campaign/${campaignId}/notes`" class="mod-card v6-card">
        <OhVueIcon name="gi-scroll-unfurled" scale="2.5" style="color:#6b9fe8;opacity:0.8" />
        <div class="mod-name">Notes</div>
        <div class="mod-sub">NPCs, Locations, Quests &amp; more</div>
      </NuxtLink>
      <NuxtLink :to="`/campaign/${campaignId}/encounters`" class="mod-card v6-card">
        <OhVueIcon name="gi-broadsword" scale="2.5" style="color:#e05555;opacity:0.8" />
        <div class="mod-name">Encounters</div>
        <div class="mod-sub">VTT maps, tokens &amp; fog of war</div>
      </NuxtLink>
      <NuxtLink :to="`/campaign/${campaignId}/map`" class="mod-card v6-card">
        <OhVueIcon name="gi-treasure-map" scale="2.5" style="color:#ebbd34;opacity:0.8" />
        <div class="mod-name">World Map</div>
        <div class="mod-sub">Interactive maps with pins</div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const campaignId = Number(route.params.id)
const campaignName = ref('')
const campaignDesc = ref('')

onMounted(async () => {
  const camps = await window.dmforge.campaigns.list()
  const camp = camps.find((c: any) => c.id === campaignId)
  campaignName.value = camp?.name ?? ''
  campaignDesc.value = camp?.description ?? ''
})
</script>

<style scoped>
.camp-home { height: 100%; display: flex; flex-direction: column; padding: 40px 32px; overflow-y: auto; background: var(--bg); }
.camp-home-header { margin-bottom: 36px; }
.camp-title { font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
.camp-desc { font-size: 14px; color: var(--secondary); }
.camp-modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.mod-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; gap: 12px; text-decoration: none; transition: transform 0.15s; }
.mod-card:hover { transform: translateY(-3px); }
.mod-name { font-size: 16px; font-weight: 700; color: var(--text); }
.mod-sub { font-size: 12px; color: var(--secondary); text-align: center; }
</style>
