<template>
  <div class="field-wrap">
    <button v-if="mode === 'edit'" class="f-toggle" :class="{ on: value }"
      @click="$emit('update', !value)">
      <span class="f-toggle-knob" />
    </button>
    <span v-else class="f-view">{{ value ? 'Yes' : 'No' }}</span>
  </div>
</template>
<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
defineEmits<{ update: [any] }>()
</script>
<style scoped>
.f-toggle { width:38px;height:22px;border-radius:999px;background:var(--parch-line);border:none;cursor:pointer;position:relative;transition:background 0.2s;padding:0; }
.f-toggle.on { background:var(--gold); }
.f-toggle-knob { position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:white;transition:transform 0.2s; }
.f-toggle.on .f-toggle-knob { transform:translateX(16px); }
.f-view { font-size:13px;color:var(--ink); }
</style>
