<template>
  <div class="field-wrap">
    <textarea v-if="mode === 'edit'" class="f-textarea"
      :placeholder="field.config.placeholder ?? field.label"
      :rows="field.config.rows ?? 4"
      :value="value ?? ''"
      @input="$emit('update', ($event.target as HTMLTextAreaElement).value)" />
    <div v-else-if="value" class="f-md markdown-body-sm" v-html="rendered" />
    <span v-else class="f-view-empty">—</span>
  </div>
</template>
<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import type { FieldSchema } from '~/types/entities'
const props = defineProps<{ field: FieldSchema; value: any; mode: 'view' | 'edit' }>()
defineEmits<{ update: [any] }>()
const md = new MarkdownIt({ html: false, linkify: true })
const rendered = computed(() => DOMPurify.sanitize(md.render(props.value || '')))
</script>
<style scoped>
.f-textarea { width:100%;background:var(--forge-raised);border:1px solid var(--forge-border);border-radius:var(--r-md);padding:8px 10px;color:var(--forge-text);font-size:13px;font-family:'JetBrains Mono',monospace;outline:none;resize:vertical;transition:border-color 0.15s; }
.f-textarea:focus { border-color:var(--forge-border-l); }
.f-view-empty { font-size:13px;color:var(--forge-muted); }
</style>
<style>
.markdown-body-sm { font-size:13px;color:var(--forge-text);font-family:'DM Sans',sans-serif;line-height:1.6; }
.markdown-body-sm p { margin:0.3em 0; }
.markdown-body-sm h1,.markdown-body-sm h2,.markdown-body-sm h3 { color:var(--forge-accent);margin:0.8em 0 0.3em; }
</style>
