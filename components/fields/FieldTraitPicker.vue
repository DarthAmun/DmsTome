<template>
  <div class="f-traits">
    <div class="f-traits-wrap">
      <span v-for="(t, i) in tags" :key="t" class="f-trait">
        {{ t }}
        <button v-if="mode === 'edit'" class="f-trait-x" :title="`Remove '${t}'`" @click="remove(i)">×</button>
      </span>

      <div v-if="mode === 'edit'" class="f-traits-input-wrap">
        <input
          ref="inputEl"
          v-model="draft"
          class="f-traits-input"
          autocomplete="off"
          :placeholder="tags.length ? '' : (field.config.placeholder || 'Add trait…')"
          @input="showDd = true"
          @keydown.enter.prevent="addFirst"
          @keydown.tab.prevent="addFirst"
          @keydown.backspace="onBackspace"
          @keydown.escape="showDd = false"
          @blur="onBlur"
        />
        <div v-if="showDd && filtered.length" class="f-traits-dd">
          <button
            v-for="opt in filtered"
            :key="opt"
            class="f-traits-dd-item"
            @mousedown.prevent="pick(opt)"
          >{{ opt }}</button>
        </div>
      </div>
    </div>
    <span v-if="mode === 'view' && !tags.length" class="f-view-empty">—</span>
  </div>
</template>

<script setup lang="ts">
import type { FieldSchema } from '~/types/entities'

const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
const emit = defineEmits<{ update: [any] }>()

const draft = ref('')
const showDd = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

const tags = computed<string[]>(() => Array.isArray(props.value) ? props.value : [])
const options = computed<string[]>(() => props.field.config.options ?? [])

const filtered = computed(() => {
  const q = draft.value.trim().toLowerCase()
  return options.value
    .filter(o => !tags.value.includes(o) && (!q || o.toLowerCase().includes(q)))
    .slice(0, 10)
})

function add(t: string) {
  t = t.trim()
  if (t && !tags.value.includes(t)) emit('update', [...tags.value, t])
  draft.value = ''
  showDd.value = false
}
function addFirst() {
  if (filtered.value.length) add(filtered.value[0])
  else if (draft.value.trim()) add(draft.value)
}
function pick(opt: string) { add(opt) }
function remove(i: number) { emit('update', tags.value.filter((_, idx) => idx !== i)) }
function onBackspace() {
  if (draft.value === '' && tags.value.length) remove(tags.value.length - 1)
}
function onBlur() {
  setTimeout(() => { showDd.value = false }, 100)
  if (draft.value.trim()) add(draft.value)
}
</script>

<style scoped>
.f-traits-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  padding: 3px 0;
}

.f-trait {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  background: color-mix(in srgb, var(--gold) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--gold) 35%, transparent);
  border-radius: 2px;
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold);
}

.f-trait-x {
  background: none;
  border: none;
  color: color-mix(in srgb, var(--gold) 60%, transparent);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0;
  transition: color 0.1s;
}
.f-trait-x:hover { color: var(--blood); }

.f-traits-input-wrap {
  position: relative;
  flex: 1;
  min-width: 80px;
}

.f-traits-input {
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px dashed var(--parch-line);
  outline: none;
  padding: 3px 4px;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink);
}
.f-traits-input:focus { border-bottom-color: var(--gold); }
.f-traits-input::placeholder { color: var(--ink-ghost); font-style: italic; }

.f-traits-dd {
  position: absolute;
  top: calc(100% + 3px);
  left: 0;
  z-index: 20;
  background: var(--parch);
  border: 1px solid var(--parch-line);
  border-radius: var(--r);
  min-width: 160px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}

.f-traits-dd-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faded);
  transition: background 0.1s;
}
.f-traits-dd-item:hover { background: var(--parch-dark); color: var(--gold); }

.f-view-empty { font-size: 13px; color: var(--ink-ghost); }
</style>
