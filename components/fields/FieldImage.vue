<template>
  <div class="field-wrap">
    <div v-if="mode === 'edit'" class="f-img-edit">
      <img v-if="value" :src="value" class="f-img-preview" />
      <div v-else class="f-img-empty"><OhVueIcon name="gi-person" scale="1.5" style="opacity:0.3" /></div>
      <button class="f-img-btn" @click="browse">Choose Image</button>
    </div>
    <img v-else-if="value" :src="value" class="f-img-view" />
    <span v-else class="f-view-empty">—</span>
  </div>
</template>
<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()
async function browse() {
  const dataUrl = await window.dmstome.system.openFileDialog()
  if (dataUrl) emit('update', dataUrl)
}
</script>
<style scoped>
.f-img-edit { display:flex;align-items:center;gap:10px; }
.f-img-preview { width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--parch-line); }
.f-img-empty { width:56px;height:56px;border-radius:50%;background:var(--parch-dark);border:2px solid var(--parch-line);display:flex;align-items:center;justify-content:center; }
.f-img-btn { padding:6px 14px;border-radius:999px;background:var(--parch-dark);border:1px solid var(--parch-line);color:var(--ink-faded);font-size:12px;cursor:pointer;transition:all 0.15s; }
.f-img-btn:hover { color:var(--ink); }
.f-img-view { width:60px;height:60px;border-radius:50%;object-fit:cover; }
.f-view-empty { font-size:13px;color:var(--ink-ghost); }
</style>
