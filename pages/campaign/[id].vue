<template>
  <div class="shell">
    <nav class="icon-rail">
      <div class="icon-rail-logo"><OhVueIcon name="gi-anvil-impact" /></div>
      <NuxtLink to="/" class="rail-icon-btn" title="Dashboard">
        <OhVueIcon name="md-arrowback" scale="0.95" />
      </NuxtLink>
      <div class="rail-divider" />
      <NuxtLink :to="`/campaign/${campaignId}/notes`" class="rail-icon-btn" title="Notes"
        :class="{ active: route.path.includes('/notes') }">
        <OhVueIcon name="gi-scroll-unfurled" scale="0.95" />
      </NuxtLink>
      <NuxtLink :to="`/campaign/${campaignId}/encounters`" class="rail-icon-btn" title="Encounters"
        :class="{ active: route.path.includes('/encounters') || route.path.includes('/encounter/') }">
        <OhVueIcon name="gi-broadsword" scale="0.95" />
      </NuxtLink>
      <NuxtLink :to="`/campaign/${campaignId}/map`" class="rail-icon-btn" title="World Map"
        :class="{ active: route.path.includes('/map') }">
        <OhVueIcon name="gi-treasure-map" scale="0.95" />
      </NuxtLink>
      <div class="rail-spacer" />
    </nav>
    <div class="shell-body">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const campaignId = computed(() => route.params.id)
</script>

<style scoped>
.shell { display: flex; height: 100vh; overflow: hidden; }
.shell-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.rail-divider { width: 24px; height: 1px; background: var(--border); margin: 4px 0; }
</style>
