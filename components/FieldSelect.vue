<template>
  <div class="field-wrap">
    <select v-if="mode === 'edit'" class="f-select" :value="value ?? ''"
      @change="$emit('update', ($event.target as HTMLSelectElement).value)">
      <option value="">— select —</option>
      <option v-for="opt in field.config.options ?? []" :key="opt" :value="opt">{{ opt }}</option>
    </select>
    <span v-else-if="value" class="f-badge" v-if="value">{{ value }}</span>
    <span v-else class="f-view-empty">—</span>
  </div>
</template>
<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
defineEmits<{ update: [any] }>()
</script>
<style scoped>
.f-select {
  width: 100%;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: var(--r);
  padding: 7px 10px;
  color: var(--ink);
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
}

.f-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  font-size: 12px;
  color: var(--ink-faded);
}

.f-view-empty {
  font-size: 13px;
  color: var(--ink-ghost);
}
</style>
