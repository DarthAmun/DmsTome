<template>
  <div class="note-editor">
    <!-- Header -->
    <div v-if="props.side !== 'preview'" class="editor-header">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <span class="entity-type-badge"
          :style="{ background: typeColor + '22', borderColor: typeColor + '55', color: typeColor }">
          {{ typeLabel }}
        </span>
        <input v-if="isEditingName" ref="nameInput" v-model="draftName" class="pv-input" style="font-size:15px"
          @blur="saveName" @keyup.enter="saveName" @keyup.escape="isEditingName = false" />
        <h2 v-else class="font-display text-forge-gold-l text-lg truncate flex-1 cursor-pointer" @click="startEditName">
          {{ entity?.name }}
        </h2>
      </div>
      <div class="flex items-center gap-2">
        <!-- Session mode switcher -->
        <template v-if="entity?.type === 'session'">
          <button v-for="m in sessionModes" :key="m.value"
            class="mode-btn" :class="{ active: sessionMode === m.value }"
            @click="setSessionMode(m.value)">
            {{ m.label }}
          </button>
        </template>
        <Button :severity="activePanel === 'attributes' ? undefined : 'secondary'" size="small"
          @click="activePanel = activePanel === 'attributes' ? 'content' : 'attributes'">
          <template #icon>
            <OhVueIcon name="md-editnote" scale="0.85" />
          </template>
          Attributes
        </Button>
        <Button severity="danger" size="small" @click="confirmDelete">
          <template #icon>
            <OhVueIcon name="md-delete" scale="0.85" />
          </template>
        </Button>
      </div>
    </div>

    <!-- Body -->
    <div class="editor-body">

      <!-- Attributes panel (slides in from right) -->
      <div v-if="activePanel === 'attributes' && props.side !== 'preview'" class="attributes-pane">
        <h3 class="f-label mb-3">{{ typeLabel }} Details</h3>
        <AttributeEditor :type="entity!.type" :model-value="draftAttributes" @update:model-value="onAttributesChange" />
      </div>

      <!-- Session dual-pane -->
      <template v-else-if="entity?.type === 'session'">
        <!-- Editor side only: script pane -->
        <div v-if="props.side === 'editor'" class="edit-pane">
          <div class="session-pane-label" style="background:rgba(184,125,232,0.1)">
            <OhVueIcon name="gi-book-aura" scale="0.8" style="color:#b87de8" />
            Script / Prep
            <span v-if="sessionMode === 'running'" style="font-size:10px;color:var(--ink-ghost);margin-left:auto">read-only during session</span>
          </div>
          <div v-if="sessionMode !== 'planning'" class="preview-pane">
            <div class="markdown-body" v-html="renderedScript" @click="onPreviewClick" />
          </div>
          <div v-else class="editor-area-wrap" style="position:relative">
            <textarea ref="scriptRef" v-model="draftScript" class="editor-textarea" spellcheck="true"
              @input="onScriptInput" placeholder="Write your session script and prep notes here…" />
            <div v-if="autocomplete.show && autocomplete.isScript" class="autocomplete-dropdown">
              <button v-for="item in autocomplete.items" :key="item.id" class="autocomplete-item"
                @mousedown.prevent="applyAutocomplete(item)">
                <span class="autocomplete-dot" :style="{ background: typeColorMap[item.type] ?? 'var(--ink-faded)' }" />
                <span class="text-sm">{{ item.name }}</span>
                <span class="text-xs text-ink-ghost ml-auto">{{ item.type }}</span>
              </button>
              <p v-if="autocomplete.items.length === 0" class="text-xs text-ink-ghost p-2 italic font-ui">No matches — will link on save</p>
            </div>
          </div>
        </div>
        <!-- Preview side only: notes pane -->
        <div v-else-if="props.side === 'preview'" class="edit-pane">
          <div class="session-pane-label" style="background:rgba(235,189,52,0.08)">
            <OhVueIcon name="md-editnote" scale="0.8" style="color:var(--gold)" />
            <span v-if="sessionMode === 'planning'">Script Preview</span>
            <span v-else>Session Notes</span>
            <span v-if="sessionMode === 'planning'" style="font-size:10px;color:var(--ink-ghost);margin-left:auto">live preview</span>
          </div>
          <div v-if="sessionMode === 'running'" class="editor-area-wrap" style="position:relative">
            <textarea ref="editorRef" v-model="draftContent" class="editor-textarea" spellcheck="true"
              @input="onInput" placeholder="Take notes here while running the session…" />
            <div v-if="autocomplete.show && !autocomplete.isScript" class="autocomplete-dropdown">
              <button v-for="item in autocomplete.items" :key="item.id" class="autocomplete-item"
                @mousedown.prevent="applyAutocomplete(item)">
                <span class="autocomplete-dot" :style="{ background: typeColorMap[item.type] ?? 'var(--ink-faded)' }" />
                <span class="text-sm">{{ item.name }}</span>
                <span class="text-xs text-ink-ghost ml-auto">{{ item.type }}</span>
              </button>
              <p v-if="autocomplete.items.length === 0" class="text-xs text-ink-ghost p-2 italic font-ui">No matches — will link on save</p>
            </div>
          </div>
          <div v-else-if="sessionMode === 'planning'" class="preview-pane">
            <div class="markdown-body" v-html="renderedScript" @click="onPreviewClick" />
          </div>
          <div v-else class="preview-pane">
            <div v-if="draftContent" class="markdown-body" v-html="renderedContent" @click="onPreviewClick" />
            <p v-else class="text-ink-ghost italic font-body" style="padding:24px">No session notes yet…</p>
          </div>
        </div>
        <!-- Full split (default) -->
        <div v-else class="split-pane">
          <!-- Script side -->
          <div class="edit-pane">
            <div class="session-pane-label" style="background:rgba(184,125,232,0.1)">
              <OhVueIcon name="gi-book-aura" scale="0.8" style="color:#b87de8" />
              Script / Prep
              <span v-if="sessionMode === 'running'" style="font-size:10px;color:var(--ink-ghost);margin-left:auto">read-only during session</span>
            </div>
            <div v-if="sessionMode !== 'planning'" class="preview-pane">
              <div class="markdown-body" v-html="renderedScript" @click="onPreviewClick" />
            </div>
            <div v-else class="editor-area-wrap" style="position:relative">
              <textarea ref="scriptRef" v-model="draftScript" class="editor-textarea" spellcheck="true"
                @input="onScriptInput" placeholder="Write your session script and prep notes here…" />
              <div v-if="autocomplete.show && autocomplete.isScript" class="autocomplete-dropdown">
                <button v-for="item in autocomplete.items" :key="item.id" class="autocomplete-item"
                  @mousedown.prevent="applyAutocomplete(item)">
                  <span class="autocomplete-dot" :style="{ background: typeColorMap[item.type] ?? 'var(--ink-faded)' }" />
                  <span class="text-sm">{{ item.name }}</span>
                  <span class="text-xs text-ink-ghost ml-auto">{{ item.type }}</span>
                </button>
                <p v-if="autocomplete.items.length === 0" class="text-xs text-ink-ghost p-2 italic font-ui">No matches — will link on save</p>
              </div>
            </div>
          </div>
          <div class="split-divider" />
          <!-- Notes side -->
          <div class="edit-pane">
            <div class="session-pane-label" style="background:rgba(235,189,52,0.08)">
              <OhVueIcon name="md-editnote" scale="0.8" style="color:var(--gold)" />
              <span v-if="sessionMode === 'planning'">Script Preview</span>
              <span v-else>Session Notes</span>
              <span v-if="sessionMode === 'planning'" style="font-size:10px;color:var(--ink-ghost);margin-left:auto">live preview</span>
            </div>
            <div v-if="sessionMode === 'running'" class="editor-area-wrap" style="position:relative">
              <textarea ref="editorRef" v-model="draftContent" class="editor-textarea" spellcheck="true"
                @input="onInput" placeholder="Take notes here while running the session…" />
              <div v-if="autocomplete.show && !autocomplete.isScript" class="autocomplete-dropdown">
                <button v-for="item in autocomplete.items" :key="item.id" class="autocomplete-item"
                  @mousedown.prevent="applyAutocomplete(item)">
                  <span class="autocomplete-dot" :style="{ background: typeColorMap[item.type] ?? 'var(--ink-faded)' }" />
                  <span class="text-sm">{{ item.name }}</span>
                  <span class="text-xs text-ink-ghost ml-auto">{{ item.type }}</span>
                </button>
                <p v-if="autocomplete.items.length === 0" class="text-xs text-ink-ghost p-2 italic font-ui">No matches — will link on save</p>
              </div>
            </div>
            <div v-else-if="sessionMode === 'planning'" class="preview-pane">
              <div class="markdown-body" v-html="renderedScript" @click="onPreviewClick" />
            </div>
            <div v-else class="preview-pane">
              <div v-if="draftContent" class="markdown-body" v-html="renderedContent" @click="onPreviewClick" />
              <p v-else class="text-ink-ghost italic font-body" style="padding:24px">No session notes yet…</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Regular content panel -->
      <template v-else>
        <!-- Editor side only -->
        <div v-if="props.side === 'editor'" class="edit-pane">
          <div class="editor-toolbar">
            <button class="tb-btn" title="Bold" @click="insertMarkdown('**', '**')"><strong>B</strong></button>
            <button class="tb-btn italic" title="Italic" @click="insertMarkdown('*', '*')"><em>I</em></button>
            <button class="tb-btn" title="Heading" @click="insertMarkdown('## ', '')">H</button>
            <button class="tb-btn" title="List" @click="insertMarkdown('\n- ', '')">—</button>
            <div class="tb-divider" />
            <button v-for="t in entityTypes" :key="t.type" class="tb-btn entity-insert" :style="{ color: t.color }"
              :title="`Link ${t.label}`" @click="insertEntityRef(t.type)">
              {{ t.label.charAt(0) }}
            </button>
            <div class="tb-divider" />
            <span class="text-xs text-ink-ghost font-ui ml-1 font-mono">&#123;&#123;type: Name&#125;&#125;</span>
          </div>
          <div class="editor-area-wrap" style="position:relative">
            <textarea ref="editorRef" v-model="draftContent" class="editor-textarea" spellcheck="true"
              @input="onInput" />
            <div v-if="autocomplete.show" class="autocomplete-dropdown">
              <button v-for="item in autocomplete.items" :key="item.id" class="autocomplete-item"
                @mousedown.prevent="applyAutocomplete(item)">
                <span class="autocomplete-dot"
                  :style="{ background: typeColorMap[item.type] ?? 'var(--ink-faded)' }" />
                <span class="text-sm">{{ item.name }}</span>
                <span class="text-xs text-ink-ghost ml-auto">{{ item.type }}</span>
              </button>
              <p v-if="autocomplete.items.length === 0" class="text-xs text-ink-ghost p-2 italic font-ui">No matches
                — will link on save</p>
            </div>
          </div>
        </div>
        <!-- Preview side only -->
        <div v-else-if="props.side === 'preview'" class="preview-pane">
          <div v-if="entityImageUrl" class="preview-banner">
            <img :src="entityImageUrl" class="preview-banner-img" />
          </div>
          <div class="markdown-body" v-html="renderedContent" @click="onPreviewClick" />
          <div v-if="entityMapUrl" class="preview-map-section">
            <div class="preview-map-label">
              <OhVueIcon name="md-map" scale="0.8" /> Map
            </div>
            <div class="preview-map-img-wrap">
              <img :src="entityMapUrl" class="preview-map-img" />
            </div>
          </div>
        </div>
        <!-- Full split (default) -->
        <div v-else class="split-pane">
          <!-- Left: Editor -->
          <div class="edit-pane">
            <div class="editor-toolbar">
              <button class="tb-btn" title="Bold" @click="insertMarkdown('**', '**')"><strong>B</strong></button>
              <button class="tb-btn italic" title="Italic" @click="insertMarkdown('*', '*')"><em>I</em></button>
              <button class="tb-btn" title="Heading" @click="insertMarkdown('## ', '')">H</button>
              <button class="tb-btn" title="List" @click="insertMarkdown('\n- ', '')">—</button>
              <div class="tb-divider" />
              <button v-for="t in entityTypes" :key="t.type" class="tb-btn entity-insert" :style="{ color: t.color }"
                :title="`Link ${t.label}`" @click="insertEntityRef(t.type)">
                {{ t.label.charAt(0) }}
              </button>
              <div class="tb-divider" />
              <span class="text-xs text-ink-ghost font-ui ml-1 font-mono">&#123;&#123;type: Name&#125;&#125;</span>
            </div>
            <div class="editor-area-wrap" style="position:relative">
              <textarea ref="editorRef" v-model="draftContent" class="editor-textarea" spellcheck="true"
                @input="onInput" />
              <div v-if="autocomplete.show" class="autocomplete-dropdown">
                <button v-for="item in autocomplete.items" :key="item.id" class="autocomplete-item"
                  @mousedown.prevent="applyAutocomplete(item)">
                  <span class="autocomplete-dot"
                    :style="{ background: typeColorMap[item.type] ?? 'var(--ink-faded)' }" />
                  <span class="text-sm">{{ item.name }}</span>
                  <span class="text-xs text-ink-ghost ml-auto">{{ item.type }}</span>
                </button>
                <p v-if="autocomplete.items.length === 0" class="text-xs text-ink-ghost p-2 italic font-ui">No matches
                  — will link on save</p>
              </div>
            </div>
          </div>
          <!-- Divider -->
          <div class="split-divider" />
          <!-- Right: Preview -->
          <div class="preview-pane">
            <div v-if="entityImageUrl" class="preview-banner">
              <img :src="entityImageUrl" class="preview-banner-img" />
            </div>
            <div class="markdown-body" v-html="renderedContent" @click="onPreviewClick" />
            <div v-if="entityMapUrl" class="preview-map-section">
              <div class="preview-map-label">
                <OhVueIcon name="md-map" scale="0.8" /> Map
              </div>
              <div class="preview-map-img-wrap">
                <img :src="entityMapUrl" class="preview-map-img" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Links panel -->
    <div v-if="(outgoingLinks.length > 0 || backlinks.length > 0 || pinnedOn.length > 0) && props.side !== 'editor'" class="links-panel">
      <div v-if="pinnedOn.length > 0" class="links-section">
        <span class="f-label">Found in</span>
        <div class="links-list">
          <NuxtLink v-for="p in pinnedOn" :key="p.location.id"
            :to="`/campaign/${campaignId}/map?locationId=${p.location.id}`" class="link-chip pinned-chip">
            <span class="link-dot" style="background:var(--gold)" />
            <span class="text-sm">{{ p.location.name }}</span>
            <span class="text-xs text-ink-ghost">map</span>
          </NuxtLink>
        </div>
      </div>
      <div v-if="outgoingLinks.length > 0" class="links-section">
        <span class="f-label">Links</span>
        <div class="links-list">
          <button v-for="link in outgoingLinks" :key="link.id" class="link-chip"
            :style="{ borderColor: (typeColorMap[link.targetType] ?? 'var(--ink-faded)') + '55' }"
            @click="$emit('navigate', link.targetType, link.targetName)">
            <span class="link-dot" :style="{ background: typeColorMap[link.targetType] ?? 'var(--ink-faded)' }" />
            <span class="text-sm">{{ link.targetName }}</span>
            <span class="text-xs text-ink-ghost">{{ link.targetType }}</span>
            <span v-if="Object.keys(link.metadata).length > 0" class="link-meta">{{
              Object.entries(link.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')}}</span>
          </button>
        </div>
      </div>
      <div v-if="backlinks.length > 0" class="links-section">
        <span class="f-label">Referenced by</span>
        <div class="links-list">
          <button v-for="bl in backlinks" :key="bl.sourceId" class="link-chip" @click="navigateToSource(bl.sourceId)">
            <span class="link-dot"
              :style="{ background: typeColorMap[sourceEntity(bl.sourceId)?.type ?? ''] ?? 'var(--ink-faded)' }" />
            <span class="text-sm">{{ sourceEntity(bl.sourceId)?.name }}</span>
            <span class="text-xs text-ink-ghost">{{ sourceEntity(bl.sourceId)?.type }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import { useNotesStore } from '~/stores/notes'
import { renderEntityRefs } from '~/composables/useEntityParser'
import { useDiceRoll } from '~/composables/useDiceRoll'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import type { EntityAttributes } from '~/types/entities'

const props = defineProps<{ entityId: number; campaignId: number; side?: 'editor' | 'preview' }>()
const emit = defineEmits<{ navigate: [type: string, name: string]; deleted: [] }>()

const store = useNotesStore()
const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

const entity = computed(() => store.entities.find(e => e.id === props.entityId) ?? store.currentEntity)
const isPreview = computed(() => viewMode.value === 'preview')
const viewMode = ref<'edit' | 'preview' | 'split'>('preview')
const isEditingName = ref(false)
const activePanel = ref<'content' | 'attributes'>('content')
const draftName = ref('')
const draftContent = ref('')
const draftAttributes = ref<EntityAttributes>({})
const nameInput = ref<HTMLInputElement | null>(null)
const editorRef = ref<HTMLTextAreaElement | null>(null)
let saveTimer: ReturnType<typeof setTimeout> | null = null
let attrSaveTimer: ReturnType<typeof setTimeout> | null = null

const entityTypes = Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => ({ type, label: cfg.plural, color: cfg.color }))
const typeColorMap = Object.fromEntries(Object.entries(ENTITY_TYPE_CONFIG).map(([t, c]) => [t, c.color]))
const typeColor = computed(() => ENTITY_TYPE_CONFIG[entity.value?.type ?? 'note']?.color ?? 'var(--ink-faded)')
const typeLabel = computed(() => ENTITY_TYPE_CONFIG[entity.value?.type ?? 'note']?.label ?? '')

const entityImage = computed(() => {
  const attrs = entity.value?.attributes as any
  if (!attrs) return null
  const src = attrs.portraitSource || attrs.imageSource
  if (!src) return null
  return src
})

const autocomplete = ref({ show: false, items: [] as any[], triggerStart: 0, isScript: false })

const sessionModes = [
  { value: 'planning', label: 'Planning' },
  { value: 'running',  label: 'Running' },
  { value: 'finished', label: 'Finished' },
]
const sessionMode = computed(() => (entity.value?.attributes as any)?.mode ?? 'planning')
const draftScript = ref('')
const scriptRef = ref<HTMLTextAreaElement | null>(null)
let scriptSaveTimer: ReturnType<typeof setTimeout> | null = null

const renderedScript = computed(() => {
  const script = props.side === 'preview'
    ? ((entity.value?.attributes as any)?.scriptContent ?? '')
    : draftScript.value
  if (!script) return '<p class="text-ink-ghost italic font-body" style="padding:24px">No script written yet…</p>'
  const html = md.render(script)
  return DOMPurify.sanitize(renderEntityRefs(html, entityLookup), { ADD_ATTR: ['data-entity-type', 'data-entity-name', 'style'], ADD_URI_SAFE_ATTR: ['src'], ALLOWED_URI_REGEXP: /^(?:(?:https?|local-file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i })
})

function onScriptInput() {
  if (scriptSaveTimer) clearTimeout(scriptSaveTimer)
  scriptSaveTimer = setTimeout(async () => {
    const attrs = { ...(entity.value?.attributes as any ?? {}), scriptContent: draftScript.value }
    await store.updateEntity(props.entityId, { attributes: attrs })
  }, 800)
  checkAutocomplete(scriptRef.value, draftScript.value, true)
}

async function setSessionMode(mode: string) {
  const attrs = { ...(entity.value?.attributes as any ?? {}), mode }
  draftAttributes.value = attrs
  await store.updateEntity(props.entityId, { attributes: attrs })
}

// Keep draftScript synced if attributes change externally
watch(() => (draftAttributes.value as any)?.scriptContent, (val) => {
  if (val !== undefined && val !== draftScript.value) {
    draftScript.value = val ?? ''
  }
})

watch(() => props.entityId, async (id) => {
  await store.loadEntity(id)
  draftContent.value = entity.value?.content ?? ''
  draftName.value = entity.value?.name ?? ''
  draftAttributes.value = { ...(entity.value?.attributes ?? {}) }
  draftScript.value = (entity.value?.attributes as any)?.scriptContent ?? ''
  viewMode.value = 'preview'
  isEditingName.value = false
  activePanel.value = 'content'
}, { immediate: true })

function entityLookup(type: string, name: string) {
  const entity = store.findByTypeAndName(type, name)
  if (!entity) return null
  const attrs = entity.attributes as any
  const src = attrs.portraitSource || attrs.imageSource
  const srcType = attrs.portraitType || attrs.imageType
  const imageUrl = src ? src : undefined
  const color = typeColorMap[entity.type] ?? '#888'
  const icon = entity.type
  return { imageUrl, icon, color }
}

const renderedContent = computed(() => {
  const content = props.side === 'preview' ? (entity.value?.content ?? '') : draftContent.value
  if (!content) return '<p class="text-ink-ghost italic font-body">Nothing written yet…</p>'
  const html = md.render(content)
  const withRefs = renderEntityRefs(html, entityLookup)
  return DOMPurify.sanitize(withRefs, { ADD_ATTR: ['data-entity-type', 'data-entity-name', 'style'], ADD_URI_SAFE_ATTR: ['src'], ALLOWED_URI_REGEXP: /^(?:(?:https?|local-file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i })
})

const outgoingLinks = computed(() => store.linksFrom(props.entityId))
const pinnedOn = computed(() => {
  if (!entity.value) return []
  return store.pinnedLocationsFor(entity.value.id)
})
const backlinks = computed(() => {
  if (!entity.value) return []
  return store.backlinksTo(entity.value.type, entity.value.name)
})
const sourceEntity = (id: number) => store.entities.find(e => e.id === id)

function navigateToSource(sourceId: number) {
  const e = sourceEntity(sourceId)
  if (e) emit('navigate', e.type, e.name)
}

function startEditName() {
  draftName.value = entity.value?.name ?? ''
  isEditingName.value = true
  nextTick(() => nameInput.value?.focus())
}

async function saveName() {
  isEditingName.value = false
  if (draftName.value.trim() && draftName.value !== entity.value?.name) {
    await store.updateEntity(props.entityId, { name: draftName.value.trim() })
  }
}

function onInput() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => store.updateEntity(props.entityId, { content: draftContent.value }), 800)
  checkAutocomplete(editorRef.value, draftContent.value, false)
}

function onAttributesChange(attrs: EntityAttributes) {
  draftAttributes.value = attrs
  if (attrSaveTimer) clearTimeout(attrSaveTimer)
  attrSaveTimer = setTimeout(() => store.updateEntity(props.entityId, { attributes: attrs }), 500)
}

function checkAutocomplete(el: HTMLTextAreaElement | null, text: string, isScript: boolean) {
  if (!el) return
  const pos = el.selectionStart
  const match = text.slice(0, pos).match(/\{\{(\w+):\s*([^}]*)$/)
  if (!match) { autocomplete.value.show = false; return }
  const partialType = match[1].toLowerCase()
  if (partialType === 'roll') { autocomplete.value.show = false; return }
  const partialName = match[2]
  const candidates = store.entities.filter(e => {
    return e.campaignId === props.campaignId &&
      (!partialType || e.type.startsWith(partialType)) &&
      (!partialName || e.name.toLowerCase().includes(partialName.toLowerCase()))
  }).slice(0, 8)
  autocomplete.value = { show: true, items: candidates, triggerStart: pos - match[0].length, isScript }
}

function applyAutocomplete(item: any) {
  const isScript = autocomplete.value.isScript
  const el = isScript ? scriptRef.value : editorRef.value
  if (!el) return
  const pos = el.selectionStart
  const draft = isScript ? draftScript.value : draftContent.value
  const before = draft.slice(0, autocomplete.value.triggerStart)
  const after = draft.slice(pos)
  const replacement = `{{${item.type}: ${item.name}}}`
  if (isScript) draftScript.value = `${before}${replacement}${after}`
  else draftContent.value = `${before}${replacement}${after}`
  autocomplete.value.show = false
  nextTick(() => {
    const newPos = before.length + replacement.length
    el.setSelectionRange(newPos, newPos)
    el.focus()
  })
}

function insertMarkdown(before: string, after: string) {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = draftContent.value.slice(start, end)
  draftContent.value = draftContent.value.slice(0, start) + before + selected + after + draftContent.value.slice(end)
  nextTick(() => { el.setSelectionRange(start + before.length, start + before.length + selected.length); el.focus() })
}

function insertEntityRef(type: string) { insertMarkdown(`{{${type}: `, '}}') }

const { triggerRoll } = useDiceRoll()

function onPreviewClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.classList.contains('roll-ref')) {
    const roll = target.dataset.roll
    if (roll) triggerRoll(roll)
    return
  }
  if (target.classList.contains('entity-ref')) {
    const type = target.dataset.entityType
    const name = target.dataset.entityName
    if (type && name) emit('navigate', type, name)
  }
}

const entityImageUrl = computed(() => {
  const attrs = entity.value?.attributes as any
  if (!attrs) return null
  const src = attrs.logoSource || attrs.portraitSource || (entity.value?.type !== 'location' ? attrs.imageSource : null)
  if (!src) return null
  return src   // ← was: return type (wrong)
})

const entityMapUrl = computed(() => {
  if (entity.value?.type !== 'location') return null
  const attrs = entity.value?.attributes as any
  if (!attrs?.imageSource) return null
  return attrs.imageType === 'url' ? attrs.imageSource : `${attrs.imageSource}`
})

async function confirmDelete() {
  if (confirm(`Delete "${entity.value?.name}"? This cannot be undone.`)) {
    await store.deleteEntity(props.entityId)
    emit('deleted')
  }
}
</script>

<style scoped>
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}

.entity-type-badge {
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.editor-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.attributes-pane {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

/* ── Split layout ─────────────────────────────────────────────────── */
.mode-btn {
  padding: 4px 12px; border-radius: var(--r-pill);
  background: var(--parch-dark); border: 1px solid var(--parch-line);
  color: var(--ink-ghost); font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  cursor: pointer; transition: all 0.15s;
}
.mode-btn.active {
  background: #b87de822; border-color: #b87de855; color: #b87de8;
}
.mode-btn:hover:not(.active) { color: var(--ink); background: rgba(28,20,16,0.08); }

.session-pane-label {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 14px; border-bottom: 1px solid var(--parch-line);
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--ink-ghost);
  flex-shrink: 0;
}

.split-pane {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.split-divider {
  width: 1px;
  background: var(--parch-line);
  flex-shrink: 0;
}

.edit-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.preview-pane {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── Editor toolbar ───────────────────────────────────────────────── */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.tb-btn {
  padding: 3px 8px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid var(--parch-line);
  color: var(--ink-faded);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.tb-btn:hover {
  background: var(--parch-dark);
  color: var(--ink);
}

.tb-btn.entity-insert {
  font-weight: 700;
  font-size: 11px;
}

.tb-divider {
  width: 1px;
  height: 18px;
  background: var(--parch-line);
  margin: 0 4px;
}

.editor-area-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  padding: 20px 24px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: var(--ink);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.7;
  caret-color: var(--gold);
}

.autocomplete-dropdown {
  position: absolute;
  bottom: 8px;
  left: 24px;
  z-index: 100;
  background: var(--parch-dark);
  border: 1px solid var(--ink-ghost);
  border-radius: 8px;
  width: 280px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--ink);
  transition: background 0.1s;
  text-align: left;
}

.autocomplete-item:hover {
  background: var(--parch-line);
}

.autocomplete-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Preview image ────────────────────────────────────────────────── */
.preview-banner {
  flex-shrink: 0;
  padding: 20px 28px 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.preview-banner-img-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--ink-ghost);
  flex-shrink: 0;
}

.preview-banner-img-wide {
  width: 100%;
  max-height: 160px;
  object-fit: cover;
  border-radius: 10px;
}

.preview-banner-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-banner-title {
  font-size: 13px;
  color: var(--gold);
  font-style: italic;
}

.preview-banner-level {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--forge-accent-dim, rgba(235, 189, 52, 0.12));
  color: var(--gold);
  border: 1px solid rgba(235, 189, 52, 0.3);
  width: fit-content;
}

/* ── Markdown preview ─────────────────────────────────────────────── */
.preview-pane .markdown-body {
  padding: 20px 28px;
  flex: 1;
}

/* ── Links panel ──────────────────────────────────────────────────── */
.links-panel {
  flex-shrink: 0;
  border-top: 1px solid var(--parch-line);
  padding: 10px 16px;
  background: transparent;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  max-height: 120px;
  overflow-y: auto;
}

.links-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.links-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.link-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  cursor: pointer;
  transition: all 0.15s;
}

.link-chip:hover {
  background: var(--parch-line);
}

.link-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.link-meta {
  font-size: 10px;
  color: var(--gold);
  font-style: italic;
}
</style>

<style>
.markdown-body {
  color: var(--ink);
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.75;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  color: var(--gold);
  margin: 1.2em 0 0.4em;
}

.markdown-body h1 {
  font-size: 1.6em;
}

.markdown-body h2 {
  font-size: 1.3em;
}

.markdown-body h3 {
  font-size: 1.1em;
}

.markdown-body p {
  margin: 0.6em 0;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.markdown-body li {
  margin: 0.2em 0;
}

.markdown-body strong {
  color: #e8d4a0;
}

.markdown-body em {
  color: #b0b8d0;
  font-style: italic;
}

.markdown-body blockquote {
  border-left: 3px solid var(--gold);
  padding-left: 1em;
  margin: 0.8em 0;
  color: #9090b0;
  font-style: italic;
}

.markdown-body code {
  background: var(--parch-dark);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--gold);
}

.markdown-body hr {
  border-color: var(--parch-line);
  margin: 1.5em 0;
}

.entity-ref {
  cursor: pointer;
  border-radius: 3px;
  padding: 1px 4px;
  font-weight: 600;
  transition: background 0.15s;
  display: inline;
}

.entity-ref:hover {
  filter: brightness(1.2);
}

.entity-ref em {
  font-size: 0.85em;
  font-style: normal;
  opacity: 0.75;
  margin-left: 3px;
}

.entity-ref--note {
  color: #7ba8e8;
  background: rgba(91, 141, 217, 0.15);
}

.entity-ref--npc {
  color: #7dd89a;
  background: rgba(93, 184, 122, 0.15);
}

.entity-ref--item {
  color: var(--gold);
  background: rgba(201, 151, 58, 0.15);
}

.entity-ref--location {
  color: #b98ee8;
  background: rgba(155, 109, 217, 0.15);
}

.entity-ref--faction {
  color: #e87a7a;
  background: rgba(217, 91, 91, 0.15);
}

.entity-ref--encounter {
  color: #e8a87a;
  background: rgba(217, 141, 91, 0.15);
}

/* Entity ref avatar inline image */
.entity-ref-avatar {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  vertical-align: middle;
  margin-right: 3px;
  margin-top: -2px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.entity-ref-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 4px;
  margin-top: -1px;
  flex-shrink: 0;
}

.roll-ref {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(184,134,11,0.1);
  border: 1px solid rgba(184,134,11,0.35);
  border-radius: 5px;
  padding: 1px 8px;
  color: var(--gold);
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.88em;
  transition: all 0.15s;
  white-space: nowrap;
}
.roll-ref:hover {
  background: rgba(184,134,11,0.22);
  border-color: var(--gold);
  box-shadow: 0 0 8px rgba(184,134,11,0.2);
}
</style>
