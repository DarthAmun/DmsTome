<template>
  <div class="field-wrap">
    <div class="f-tags">
      <TransitionGroup name="tag">
        <span v-for="(tag, i) in tags" :key="tag + i" class="f-tag">
          {{ tag }}
          <button v-if="mode === 'edit'" class="f-tag-x" @click="remove(i)" :title="`Remove '${tag}'`">×</button>
        </span>
      </TransitionGroup>
      <input
        v-if="mode === 'edit'"
        ref="inputEl"
        v-model="draft"
        class="f-tag-input"
        :placeholder="tags.length ? '' : (field.config.placeholder || 'Add tag…')"
        @keydown.enter.prevent="add"
        @keydown.tab.prevent="add"
        @keydown.backspace="onBackspace"
        @blur="addIfNonEmpty"
      />
      <span v-if="mode === 'view' && !tags.length" class="f-view-empty">—</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const draft = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const tags = computed<string[]>(() => Array.isArray(props.value) ? props.value : [])

function add() {
  const t = draft.value.trim()
  if (t && !tags.value.includes(t)) emit('update', [...tags.value, t])
  draft.value = ''
}

function addIfNonEmpty() {
  if (draft.value.trim()) add()
}

function remove(i: number) {
  emit('update', tags.value.filter((_, idx) => idx !== i))
}

function onBackspace() {
  if (draft.value === '' && tags.value.length) remove(tags.value.length - 1)
}
</script>

<style scoped>
.f-tags {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 5px; min-height: 32px;
  padding: 4px 0;
}

.f-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px 2px 9px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faded);
}

.f-tag-x {
  background: none; border: none;
  color: var(--ink-ghost); cursor: pointer;
  font-size: 14px; line-height: 1; padding: 0;
  display: flex; align-items: center;
  transition: color 0.1s;
}
.f-tag-x:hover { color: var(--blood); }

.f-tag-input {
  flex: 1; min-width: 80px;
  background: none; border: none; outline: none;
  border-bottom: 1px dashed var(--parch-line);
  padding: 2px 4px;
  font-family: var(--font-ui); font-size: 13px;
  color: var(--ink);
}
.f-tag-input:focus { border-bottom-color: var(--gold); }
.f-tag-input::placeholder { color: var(--ink-ghost); font-style: italic; }

.f-view-empty { font-size: 13px; color: var(--ink-ghost); }

/* TransitionGroup */
.tag-enter-active, .tag-leave-active { transition: all 0.15s; }
.tag-enter-from { opacity: 0; transform: scale(0.8); }
.tag-leave-to   { opacity: 0; transform: scale(0.8); }
</style>
