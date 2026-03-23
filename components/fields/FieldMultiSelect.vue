<template>
  <div class="field-wrap">
    <div v-if="mode === 'edit'" class="f-multi">
      <label v-for="opt in field.config.options ?? []" :key="opt" class="f-opt">
        <input type="checkbox" :checked="(value ?? []).includes(opt)"
          @change="toggle(opt)" />
        {{ opt }}
      </label>
    </div>
    <div v-else-if="value?.length" class="f-tags">
      <span v-for="v in value" :key="v" class="f-tag">{{ v }}</span>
    </div>
    <span v-else class="f-view-empty">—</span>
  </div>
</template>
<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()
function toggle(opt: string) {
  const arr: string[] = [...(props.value ?? [])]
  const i = arr.indexOf(opt)
  if (i >= 0) arr.splice(i, 1); else arr.push(opt)
  emit('update', arr)
}
</script>
<style scoped>
.f-multi { display:flex;flex-wrap:wrap;gap:8px; }
.f-opt { display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ink);cursor:pointer; }
.f-tags { display:flex;flex-wrap:wrap;gap:5px; }
.f-tag { padding:2px 9px;border-radius:999px;background:var(--parch-dark);border:1px solid var(--parch-line);font-size:11px;color:var(--ink-faded); }
.f-view-empty { font-size:13px;color:var(--ink-ghost); }
</style>
