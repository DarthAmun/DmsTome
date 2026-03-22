<template>
  <div class="book-shell">
    <div class="tome-page">
      <NuxtPage />
    </div>

    <!-- Campaign spine tabs -->
    <nav class="spine-tabs">
      <NuxtLink to="/" class="spine-tab" title="Back to Tome">
        <OhVueIcon name="md-arrowback" scale="0.85" />
        Home
      </NuxtLink>
      <NuxtLink :to="`/campaign/${id}/notes`" class="spine-tab"
        :class="{ active: route.path.includes('/notes') }">
        <OhVueIcon name="gi-scroll-unfurled" scale="0.85" />
        Notes
      </NuxtLink>
      <NuxtLink :to="`/campaign/${id}/encounters`" class="spine-tab"
        :class="{ active: route.path.includes('/encounter') }">
        <OhVueIcon name="gi-broadsword" scale="0.85" />
        Battle
      </NuxtLink>
      <NuxtLink :to="`/campaign/${id}/map`" class="spine-tab"
        :class="{ active: route.path.includes('/map') }">
        <OhVueIcon name="gi-treasure-map" scale="0.85" />
        Atlas
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = computed(() => route.params.id)
</script>

<style scoped>
.book-shell { display: flex; height: 100vh; background: var(--leather); }
.tome-page { flex: 1; display: flex; flex-direction: column; background: var(--parch); margin: 16px 56px 16px 16px; border-radius: 2px; box-shadow: var(--page-shadow); overflow: hidden; position: relative; z-index: 1; }
</style>
