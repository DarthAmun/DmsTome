<template>
  <div class="field-wrap">
    <input v-if="mode === 'edit'" class="f-input" :placeholder="field.config.placeholder ?? field.label"
      :value="value ?? ''" @input="$emit('update', ($event.target as HTMLInputElement).value)" />
    <span v-else class="f-view">{{ value || '—' }}</span>
  </div>
</template>
<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
defineEmits<{ update: [any] }>()
</script>
<style scoped>
.f-input { width:100%;background:var(--forge-raised);border:1px solid var(--forge-border);border-radius:var(--r-md);padding:7px 10px;color:var(--forge-text);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.15s; }
.f-input:focus { border-color:var(--forge-border-l); }
.f-view { font-size:13px;color:var(--forge-text);font-family:'DM Sans',sans-serif; }
</style>
