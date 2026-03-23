<template>
  <div class="field-wrap">
    <div v-if="mode === 'edit'" class="f-num-row">
      <input class="f-input" type="number" :min="field.config.min" :max="field.config.max" :step="field.config.step ?? 1"
        :value="value ?? ''" @input="$emit('update', Number(($event.target as HTMLInputElement).value))" />
      <span v-if="field.config.unit" class="f-unit">{{ field.config.unit }}</span>
    </div>
    <span v-else class="f-view">{{ value !== undefined && value !== null ? value : '—' }}{{ value !== undefined && field.config.unit ? ' ' + field.config.unit : '' }}</span>
  </div>
</template>
<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
defineEmits<{ update: [any] }>()
</script>
<style scoped>
.f-num-row { display:flex;align-items:center;gap:8px; }
.f-input { background:var(--parch-dark);border:1px solid var(--parch-line);border-radius:var(--r-md);padding:7px 10px;color:var(--ink);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100px; }
.f-unit { font-size:12px;color:var(--ink-ghost); }
.f-view { font-size:13px;color:var(--ink); }
</style>
