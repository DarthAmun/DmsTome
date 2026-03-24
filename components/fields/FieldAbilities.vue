<template>
  <div class="ab-list">
    <div v-for="(item, i) in items" :key="i" class="ab-item">
      <div class="ab-header">
        <input v-if="mode === 'edit'" class="ab-name-input" :value="item.name"
          placeholder="Ability name…"
          @input="updateItem(i, 'name', ($event.target as HTMLInputElement).value)" />
        <span v-else class="ab-name">{{ item.name }}</span>
        <button v-if="mode === 'edit'" class="ab-del" @click="remove(i)" title="Remove">×</button>
      </div>
      <textarea v-if="mode === 'edit'" class="ab-desc-input" :value="item.desc"
        placeholder="Description…" rows="2"
        @input="updateItem(i, 'desc', ($event.target as HTMLTextAreaElement).value)" />
      <p v-else class="ab-desc">{{ item.desc }}</p>
    </div>
    <button v-if="mode === 'edit'" class="ab-add" @click="add">+ Add Ability</button>
    <span v-if="!items.length && mode === 'view'" class="ab-empty">No abilities.</span>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'
const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const items = computed<{ name: string; desc: string }[]>(() => props.value ?? [])
function emit_(v: any) { emit('update', v) }
function add() { emit_([...items.value, { name: '', desc: '' }]) }
function remove(i: number) { emit_(items.value.filter((_, j) => j !== i)) }
function updateItem(i: number, key: 'name' | 'desc', v: string) {
  const next = items.value.map((item, j) => j === i ? { ...item, [key]: v } : item)
  emit_(next)
}
</script>

<style scoped>
.ab-list { display: flex; flex-direction: column; gap: 10px; }
.ab-item { border-left: 2px solid var(--gold); padding-left: 10px; }
.ab-header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.ab-name { font-family: var(--font-head); font-size: 13px; font-weight: 700; color: var(--ink); }
.ab-name-input { flex: 1; font-family: var(--font-head); font-size: 13px; font-weight: 700; background: transparent; border: none; border-bottom: 1px solid var(--parch-line); color: var(--ink); outline: none; padding: 0; }
.ab-desc { font-family: var(--font-body); font-size: 13px; color: var(--ink-faded); line-height: 1.5; margin: 0; }
.ab-desc-input { width: 100%; font-family: var(--font-body); font-size: 13px; background: var(--parch-dark); border: 1px solid var(--parch-line); border-radius: 2px; color: var(--ink); padding: 4px 6px; resize: vertical; outline: none; }
.ab-del { margin-left: auto; background: none; border: none; color: var(--ink-ghost); cursor: pointer; font-size: 16px; line-height: 1; padding: 0 4px; }
.ab-del:hover { color: var(--blood); }
.ab-add { align-self: flex-start; background: none; border: 1px dashed var(--parch-line); border-radius: 2px; color: var(--ink-ghost); cursor: pointer; font-family: var(--font-head); font-size: 9px; letter-spacing: 0.1em; padding: 5px 10px; text-transform: uppercase; transition: all 0.15s; }
.ab-add:hover { border-color: var(--gold); color: var(--gold); }
.ab-empty { color: var(--ink-ghost); font-style: italic; font-size: 13px; }
</style>
