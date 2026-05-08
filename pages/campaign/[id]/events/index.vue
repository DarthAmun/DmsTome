<template>
    <div class="edetail-empty">
        <span class="edetail-empty-icon">⚡</span>
        <span>Select an event or create one</span>
        <NuxtLink :to="`/campaign/${campaignId}/events/timeline`" class="edetail-view-link">
            Timeline →
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const campaignId = computed(() => Number(route.params.id))
</script>

<style scoped>
.edetail-view-link {
    font-size: 12px;
    color: var(--accent-l);
    text-decoration: none;
    margin-top: 4px;
}
.edetail-view-link:hover { text-decoration: underline; }
</style>
