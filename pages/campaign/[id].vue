<template>
  <div class="book-shell">
    <div class="tome-page" :class="isPlayerRoute ? 'tome-page--bare' : spineHidden ? 'tome-page--full' : ''">
      <NuxtPage />
    </div>

    <SpineNav />
  </div>
</template>

<script setup lang="ts">
import { usePageChrome } from '~/composables/usePageChrome'
const route = useRoute()
const { spineHidden } = usePageChrome()
const isPlayerRoute = computed(() =>
  route.path.endsWith('/player') || route.path.endsWith('/map-player')
)
</script>

<style scoped>
.book-shell { display: flex; height: 100vh; background: var(--leather); }
.tome-page { flex: 1; min-height: 0; display: flex; flex-direction: column; background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply; margin: 20px 20px 20px 60px; border-radius: 2px; box-shadow: var(--page-shadow); overflow: visible; position: relative; z-index: 1; transition: margin 0.2s; }
.tome-page--full { margin: 20px 20px 20px 20px; }
.tome-page--bare { margin: 0; border-radius: 0; box-shadow: none; background: none; }
</style>
