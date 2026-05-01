<template>
  <div class="note-editor">

    <!-- ── Header ── -->
    <div class="editor-header">
      <span
        class="entity-type-badge"
        :style="{ background: typeColor + '1a', borderColor: typeColor + '55', color: typeColor }"
      >{{ typeLabel }}</span>

      <input
        v-if="isEditingName"
        ref="nameInput"
        v-model="draftName"
        class="editor-name-input"
        @blur="saveName"
        @keyup.enter="saveName"
        @keyup.escape="isEditingName = false"
      />
      <h2 v-else class="editor-name" @click="startEditName">{{ entity?.name }}</h2>

      <div class="header-actions">
          <button
          class="hdr-btn"
          :class="{ active: activePanel === 'attributes' }"
          @click="activePanel = activePanel === 'attributes' ? 'content' : 'attributes'"
        >
          <OhVueIcon name="md-editnote" scale="0.8" />
          <span>Attributes</span>
        </button>

        <button class="hdr-btn hdr-btn--danger" @click="confirmDelete">
          <OhVueIcon name="md-delete" scale="0.8" />
        </button>
      </div>
    </div>

    <!-- ── Tab bar (non-session entities only) ── -->
    <div v-if="activePanel === 'content' && entity?.type !== 'session'" class="editor-tabbar">
      <div class="etab-spacer" />
      <div class="etab-group">
        <button class="etab" :class="{ active: viewMode === 'edit' }" @click="setViewMode('edit')">Edit</button>
        <button class="etab" :class="{ active: viewMode === 'mixed' }" @click="setViewMode('mixed')">Mixed</button>
        <button class="etab" :class="{ active: viewMode === 'preview' }" @click="setViewMode('preview')">Preview</button>
      </div>
    </div>

    <!-- ── Entity card / banner (all modes, non-session) ── -->
    <template v-if="activePanel === 'content' && entity?.type !== 'session'">

      <!-- NPC: business card -->
      <NpcCard
        v-if="entity?.type === 'npc'"
        :name="entity.name"
        :attrs="displayAttrs"
        :color="typeColor"
        class="npc-card-editor"
      />

      <!-- Other types: banner image -->
      <div v-else-if="entityImageUrl" class="entity-banner">
        <img :src="entityImageUrl" class="entity-banner-img" />
      </div>

    </template>

    <!-- ── Body ── -->
    <div class="editor-body">

      <!-- Attributes panel -->
      <div v-if="activePanel === 'attributes'" class="attributes-pane">
        <AttributeEditor
          :type="entity!.type"
          :model-value="draftAttributes"
          @update:model-value="onAttributesChange"
        />
      </div>

      <!-- ── Session: split layout (both panes always in mixed mode) ── -->
      <template v-else-if="entity?.type === 'session'">
        <div class="session-split">

          <!-- Left: Script / Prep -->
          <div class="session-pane">
            <div class="session-pane-label" style="--pane-accent: #b87de8">
              <span class="session-pane-label-text">Script / Prep</span>
            </div>
            <div class="mixed-pane">
              <div
                v-for="(block, i) in scriptBlocks" :key="i"
                class="mixed-block"
                :class="{ 'mixed-block--active': activeScriptBlock === i }"
              >
                <textarea
                  v-if="activeScriptBlock === i"
                  v-model="scriptBlocks[i]"
                  class="mixed-textarea"
                  :ref="(el: any) => { if (el) scriptMixedRefs[i] = el }"
                  @input="onScriptBlockInput(i)"
                  @blur="onScriptBlockBlur"
                  @keydown.esc.prevent="onScriptBlockBlur"
                />
                <div
                  v-else
                  class="mixed-preview markdown-body"
                  v-html="block.trim() ? renderBlock(block) : '<span class=\'mixed-placeholder\'>Click to write…</span>'"
                  @click="activateScriptBlock(i)"
                />
              </div>
              <button class="mixed-add-btn" @click="addScriptBlock">+ paragraph</button>
            </div>
          </div>

          <div class="session-split-divider" />

          <!-- Right: Session Notes -->
          <div class="session-pane">
            <div class="session-pane-label" style="--pane-accent: var(--accent)">
              <span class="session-pane-label-text">Session Notes</span>
            </div>
            <div class="mixed-pane">
              <div
                v-for="(block, i) in editableBlocks" :key="i"
                class="mixed-block"
                :class="{ 'mixed-block--active': activeBlock === i }"
              >
                <textarea
                  v-if="activeBlock === i"
                  v-model="editableBlocks[i]"
                  class="mixed-textarea"
                  :ref="(el: any) => { if (el) mixedRefs[i] = el }"
                  @input="onBlockInput(i)"
                  @blur="onBlockBlur"
                  @keydown.esc.prevent="onBlockBlur"
                />
                <div
                  v-else
                  class="mixed-preview markdown-body"
                  v-html="block.trim() ? renderBlock(block) : '<span class=\'mixed-placeholder\'>Click to write…</span>'"
                  @click="activateBlock(i)"
                />
              </div>
              <button class="mixed-add-btn" @click="addBlock">+ paragraph</button>
            </div>
          </div>

        </div>
      </template>

      <!-- ── Single-pane: Edit ── -->
      <div v-else-if="viewMode === 'edit'" class="edit-pane">
        <div class="editor-toolbar">
          <button class="tb-btn" title="Bold" @click="insertNotes('**', '**')"><strong>B</strong></button>
          <button class="tb-btn italic" title="Italic" @click="insertNotes('*', '*')"><em>I</em></button>
          <button class="tb-btn" title="Heading" @click="insertNotes('## ', '')">H₂</button>
          <button class="tb-btn" title="List" @click="insertNotes('\n- ', '')">—</button>
          <button class="tb-btn" title="Task" @click="insertNotes('\n- [ ] ', '')">☐</button>
          <button class="tb-btn" title="Quote" @click="insertNotes('\n> ', '')">❝</button>
          <div class="tb-divider" />
          <button
            v-for="t in entityTypes" :key="t.type"
            class="tb-btn tb-entity" :style="{ color: t.color }"
            :title="`Link ${t.label}`"
            @click="insertNotes(`{{${t.type}: `, '}}')"
          >{{ t.label.charAt(0) }}</button>
        </div>
        <div class="editor-area-wrap">
          <textarea
            ref="editorRef"
            v-model="draftContent"
            class="editor-textarea"
            spellcheck="true"
            :placeholder="`Write your ${entity?.type ?? 'note'} here…`"
            @input="onNotesInput"
          />
          <div v-if="autocomplete.show" class="autocomplete-dropdown">
            <button
              v-for="item in autocomplete.items" :key="`${item.type}:${item.name}`"
              class="autocomplete-item"
              @mousedown.prevent="applyAutocomplete(item, false)"
            >
              <span class="autocomplete-dot" :style="{ background: typeColorMap[item.type] ?? '#888' }" />
              <span class="autocomplete-name">{{ item.name }}</span>
              <span class="autocomplete-type">{{ item.type }}</span>
            </button>
            <p v-if="!autocomplete.items.length" class="autocomplete-empty">No matches — will link on save</p>
          </div>
        </div>
      </div>

      <!-- ── Single-pane: Preview ── -->
      <div v-else-if="viewMode === 'preview'" class="preview-pane">
        <div class="markdown-body preview-body" v-html="renderedContent" @click="onPreviewClick" />
        <div v-if="entityMapUrl" class="preview-map-section">
          <div class="preview-map-label"><OhVueIcon name="md-map" scale="0.8" /> Map</div>
          <div class="preview-map-img-wrap"><img :src="entityMapUrl" class="preview-map-img" /></div>
        </div>
      </div>

      <!-- ── Single-pane: Mixed ── -->
      <div v-else class="mixed-pane">
        <div
          v-for="(block, i) in editableBlocks"
          :key="i"
          class="mixed-block"
          :class="{ 'mixed-block--active': activeBlock === i }"
        >
          <textarea
            v-if="activeBlock === i"
            v-model="editableBlocks[i]"
            class="mixed-textarea"
            :ref="(el: any) => { if (el) mixedRefs[i] = el }"
            @input="onBlockInput(i)"
            @blur="onBlockBlur"
            @keydown.esc.prevent="onBlockBlur"
          />
          <div
            v-else
            class="mixed-preview markdown-body"
            v-html="block.trim() ? renderBlock(block) : '<span class=\'mixed-placeholder\'>Click to write…</span>'"
            @click="activateBlock(i)"
          />
        </div>
        <button class="mixed-add-btn" @click="addBlock">+ paragraph</button>
      </div>

    </div>

    <!-- ── Links panel (non-session) ── -->
    <div
      v-if="entity?.type !== 'session' && (outgoingLinks.length > 0 || backlinks.length > 0 || pinnedOn.length > 0)"
      class="links-panel"
    >
      <div v-if="pinnedOn.length > 0" class="links-section">
        <span class="links-label">Found in</span>
        <div class="links-list">
          <NuxtLink
            v-for="p in pinnedOn" :key="p.location.id"
            :to="`/campaign/${campaignId}/map?locationId=${p.location.id}`"
            class="link-chip"
          >
            <template v-if="linkAvatar('location', p.location.name).imageUrl">
              <img :src="linkAvatar('location', p.location.name).imageUrl!" class="link-avatar" />
            </template>
            <OhVueIcon v-else name="gi-castle" scale="0.75" style="color:var(--accent);flex-shrink:0" />
            <span>{{ p.location.name }}</span>
            <span class="link-sub">map</span>
          </NuxtLink>
        </div>
      </div>

      <div v-if="outgoingLinks.length > 0" class="links-section">
        <span class="links-label">Links</span>
        <div class="links-list">
          <button
            v-for="link in outgoingLinks" :key="link.id"
            class="link-chip"
            :style="{ borderColor: (typeColorMap[link.targetType] ?? '#888') + '44' }"
            @click="$emit('navigate', link.targetType, link.targetName)"
          >
            <template v-if="linkAvatar(link.targetType, link.targetName).imageUrl">
              <img :src="linkAvatar(link.targetType, link.targetName).imageUrl!" class="link-avatar" />
            </template>
            <OhVueIcon v-else :name="linkAvatar(link.targetType, link.targetName).iconName" scale="0.75"
              :style="{ color: linkAvatar(link.targetType, link.targetName).color, flexShrink: 0 }" />
            <span>{{ link.targetName }}</span>
            <span class="link-sub">{{ link.targetType }}</span>
          </button>
        </div>
      </div>

      <div v-if="backlinks.length > 0" class="links-section">
        <span class="links-label">Referenced by</span>
        <div class="links-list">
          <button
            v-for="bl in backlinks" :key="bl.sourceId"
            class="link-chip"
            @click="navigateToSource(bl.sourceId)"
          >
            <OhVueIcon
              :name="linkAvatar(sourceEntity(bl.sourceId)?.type ?? '', sourceEntity(bl.sourceId)?.name ?? '').iconName"
              scale="0.75"
              :style="{ color: linkAvatar(sourceEntity(bl.sourceId)?.type ?? '', sourceEntity(bl.sourceId)?.name ?? '').color, flexShrink: 0 }"
            />
            <span>{{ sourceEntity(bl.sourceId)?.name }}</span>
            <span class="link-sub">{{ sourceEntity(bl.sourceId)?.type }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Links panel (session) ── -->
    <div v-else-if="entity?.type === 'session' && (scriptLinks.length > 0 || outgoingLinks.length > 0)" class="links-panel">
      <div v-if="scriptLinks.length > 0" class="links-section">
        <span class="links-label">Script Links</span>
        <div class="links-list">
          <button
            v-for="link in scriptLinks" :key="`${link.type}:${link.name}`"
            class="link-chip"
            :style="{ borderColor: (typeColorMap[link.type] ?? '#888') + '44' }"
            @click="$emit('navigate', link.type, link.name)"
          >
            <span>{{ link.name }}</span>
            <span class="link-sub">{{ link.type }}</span>
          </button>
        </div>
      </div>
      <div v-if="outgoingLinks.length > 0" class="links-section">
        <span class="links-label">Notes Links</span>
        <div class="links-list">
          <button
            v-for="link in outgoingLinks" :key="link.id"
            class="link-chip"
            :style="{ borderColor: (typeColorMap[link.targetType] ?? '#888') + '44' }"
            @click="$emit('navigate', link.targetType, link.targetName)"
          >
            <span>{{ link.targetName }}</span>
            <span class="link-sub">{{ link.targetType }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import * as GiIcons from 'oh-vue-icons/icons/gi'
import { useNotesStore } from '~/stores/notes'
import { useSystemsStore } from '~/stores/systems'
import { extractLinks } from '~/composables/useEntityParser'
import { useEntityMarkdown } from '~/composables/useEntityMarkdown'
import { useDiceRoll } from '~/composables/useDiceRoll'
import { getDb } from '~/composables/useDb'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import type { EntityAttributes } from '~/types/entities'

const { renderMarkdown } = useEntityMarkdown()

// ── Icon helpers ──────────────────────────────────────────────────────────────
function giNameToExport(name: string): string {
  const body = name.replace(/^gi-/, '')
  return 'Gi' + body.charAt(0).toUpperCase() + body.slice(1).replace(/-([a-z])/g, (_, l) => l.toUpperCase())
}
function iconToSvg(icon: any, color: string): string {
  const vb = `${icon.minX ?? 0} ${icon.minY ?? 0} ${icon.width} ${icon.height}`
  return `<svg viewBox="${vb}" fill="${color}" style="display:inline-block;width:13px;height:13px;vertical-align:middle;margin-right:3px;margin-top:-2px;flex-shrink:0">${icon.raw}</svg>`
}
function typeIconHtml(type: string, color: string): string {
  const ICONS: Record<string, string> = {
    note: 'gi-scroll-unfurled', npc: 'gi-person', item: 'gi-open-treasure-chest',
    location: 'gi-castle', faction: 'gi-american-shield', quest: 'gi-holy-grail',
    event: 'gi-sands-of-time', session: 'gi-book-aura', encounter: 'gi-broadsword',
  }
  const icon = (GiIcons as any)[giNameToExport(ICONS[type] ?? '')]
  return icon ? iconToSvg(icon, color) : ''
}
function giIconByName(name: string): any | null {
  return (GiIcons as any)[giNameToExport(name)] ?? null
}

// ── Props / emits ─────────────────────────────────────────────────────────────
const props = defineProps<{ entityId: number; campaignId: number }>()
const emit = defineEmits<{ navigate: [type: string, name: string]; deleted: [] }>()

const store = useNotesStore()
const systemsStore = useSystemsStore()
const router = useRouter()

// ── Campaign-level data ───────────────────────────────────────────────────────
const campaignEncounters = ref<{ id: number; name: string; mapSource?: string }[]>([])
const campaignSystemId = ref<number | null>(null)
const systemEntityTypes = ref<{ id: string; name: string; color: string; icon: string }[]>([])
const systemRecordCache = ref<Map<string, { color: string }>>(new Map())

watch(() => props.campaignId, async (id) => {
  if (!id) return
  campaignEncounters.value = await getDb().encounters
    .where('campaign_id').equals(id).toArray()
    .then(rows => rows.map(r => ({ id: r.id!, name: r.name, mapSource: r.map_source ?? undefined })))
  const campaign = await getDb().campaigns.get(id)
  const sysId = campaign?.system_id ?? null
  campaignSystemId.value = sysId
  if (!sysId) { systemEntityTypes.value = []; return }
  const sys = systemsStore.getSystem(sysId)
  if (!sys) { systemEntityTypes.value = []; return }
  systemEntityTypes.value = sys.entityTypes.map(t => ({ id: t.id, name: t.name, color: t.color, icon: t.icon }))
  const records = await getDb().records.where('systemId').equals(sysId).toArray()
  const cache = new Map<string, { color: string }>()
  for (const rec of records) {
    const et = sys.entityTypes.find(t => t.id === rec.entityTypeId)
    if (et) cache.set(`${rec.entityTypeId}:${rec.name.toLowerCase()}`, { color: et.color })
  }
  systemRecordCache.value = cache
}, { immediate: true })

// ── Post-processing ───────────────────────────────────────────────────────────
const CALLOUT_TYPES: Record<string, { color: string; icon: string }> = {
  note: { color: '#5b8ee6', icon: 'ℹ️' }, info: { color: '#5b8ee6', icon: 'ℹ️' },
  tip: { color: '#5aad6e', icon: '💡' }, warning: { color: '#e6a93b', icon: '⚠️' },
  caution: { color: '#e05a5a', icon: '⚠️' }, danger: { color: '#e05a5a', icon: '🔥' },
  important: { color: '#9b59d4', icon: '❗' },
}

function postProcessHtml(html: string): string {
  let out = html
    .replace(/<li>\s*\[ \]\s*/g, '<li class="task-item"><input type="checkbox" disabled> ')
    .replace(/<li>\s*\[x\]\s*/gi, '<li class="task-item task-item--done"><input type="checkbox" checked disabled> ')
  out = out.replace(
    /<blockquote>\s*<p>\[!([\w]+)\]([^<]*)(?:<br\s*\/?>)?\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
    (_full, type, titleRaw, bodyRaw) => {
      const t = type.toLowerCase()
      const cfg = CALLOUT_TYPES[t] ?? { color: '#888', icon: '📌' }
      const displayTitle = titleRaw.trim() || (t.charAt(0).toUpperCase() + t.slice(1))
      const body = bodyRaw.trim()
      return `<div class="callout callout--${t}" style="--callout-color:${cfg.color}">
<div class="callout-title">${cfg.icon} ${displayTitle}</div>
${body ? `<div class="callout-body">${body}</div>` : ''}
</div>`
    }
  )
  return out
}

// ── State ─────────────────────────────────────────────────────────────────────
const entity = computed(() => store.entities.find(e => e.id === props.entityId) ?? store.currentEntity)
const isEditingName = ref(false)
const activePanel = ref<'content' | 'attributes'>('content')
const draftName = ref('')
const draftContent = ref('')
const draftScript = ref('')
const draftAttributes = ref<EntityAttributes>({})
const nameInput = ref<HTMLInputElement | null>(null)
const editorRef = ref<HTMLTextAreaElement | null>(null)
const scriptRef = ref<HTMLTextAreaElement | null>(null)
let saveTimer: ReturnType<typeof setTimeout> | null = null
let scriptSaveTimer: ReturnType<typeof setTimeout> | null = null
let attrSaveTimer: ReturnType<typeof setTimeout> | null = null

// ── View mode (non-session) ───────────────────────────────────────────────────
type ViewMode = 'edit' | 'mixed' | 'preview'
const VM_KEY = 'dmstome.editor.viewmode'
const viewMode = ref<ViewMode>('mixed')
if (import.meta.client) {
  const s = localStorage.getItem(VM_KEY)
  if (s === 'edit' || s === 'mixed' || s === 'preview') viewMode.value = s
}
function setViewMode(m: ViewMode) {
  viewMode.value = m
  if (import.meta.client) localStorage.setItem(VM_KEY, m)
  if (m === 'mixed') syncBlocks()
}

// ── Session script mixed mode ─────────────────────────────────────────────────
const scriptBlocks = ref<string[]>([''])
const activeScriptBlock = ref<number | null>(null)
const scriptMixedRefs: Record<number, HTMLTextAreaElement> = {}

function syncScriptBlocks() {
  const blocks = draftScript.value.split(/\n\n+/)
  scriptBlocks.value = blocks.length > 0 ? blocks : ['']
  activeScriptBlock.value = null
}

function activateScriptBlock(i: number) {
  activeScriptBlock.value = i
  nextTick(() => {
    const el = scriptMixedRefs[i]
    if (!el) return
    el.focus()
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  })
}

function onScriptBlockInput(i: number) {
  const el = scriptMixedRefs[i]
  if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }
  draftScript.value = scriptBlocks.value.join('\n\n')
  if (scriptSaveTimer) clearTimeout(scriptSaveTimer)
  scriptSaveTimer = setTimeout(async () => {
    const attrs = { ...(entity.value?.attributes as any ?? {}), scriptContent: draftScript.value }
    await store.updateEntity(props.entityId, { attributes: attrs })
  }, 800)
}

function onScriptBlockBlur() {
  while (scriptBlocks.value.length > 1 && !scriptBlocks.value[scriptBlocks.value.length - 1].trim()) {
    scriptBlocks.value.pop()
  }
  activeScriptBlock.value = null
}

function addScriptBlock() {
  scriptBlocks.value.push('')
  nextTick(() => activateScriptBlock(scriptBlocks.value.length - 1))
}

// ── Entity types ──────────────────────────────────────────────────────────────
const ENCOUNTER_COLOR = '#e8a87a'
const entityTypes = [
  ...Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => ({ type, label: cfg.plural, color: cfg.color })),
  { type: 'encounter', label: 'Encounters', color: ENCOUNTER_COLOR },
]
const typeColorMap: Record<string, string> = {
  ...Object.fromEntries(Object.entries(ENTITY_TYPE_CONFIG).map(([t, c]) => [t, c.color])),
  encounter: ENCOUNTER_COLOR,
}
const typeColor = computed(() => ENTITY_TYPE_CONFIG[entity.value?.type ?? 'note']?.color ?? 'var(--accent)')
const typeLabel = computed(() => ENTITY_TYPE_CONFIG[entity.value?.type ?? 'note']?.label ?? '')

// ── Entity lookup ─────────────────────────────────────────────────────────────
function entityLookup(type: string, name: string) {
  const typeKey = type.toLowerCase()
  if (typeKey === 'encounter') {
    const enc = campaignEncounters.value.find(e => e.name.toLowerCase() === name.toLowerCase())
    return { imageUrl: enc?.mapSource, iconHtml: enc?.mapSource ? undefined : typeIconHtml('encounter', ENCOUNTER_COLOR), color: ENCOUNTER_COLOR }
  }
  const ent = store.findByTypeAndName(typeKey, name)
  if (ent) {
    const attrs = ent.attributes as any
    const imageUrl = attrs.portraitSource || attrs.logoSource || attrs.imageSource || undefined
    const color = typeColorMap[ent.type] ?? '#888'
    return { imageUrl, iconHtml: imageUrl ? undefined : typeIconHtml(ent.type, color), color }
  }
  const sysType = systemEntityTypes.value.find(t => t.id.toLowerCase() === typeKey)
  if (sysType) {
    const cached = systemRecordCache.value.get(`${sysType.id}:${name.toLowerCase()}`)
    const icon = giIconByName(sysType.icon)
    return { iconHtml: icon ? iconToSvg(icon, cached?.color ?? sysType.color) : undefined, color: cached?.color ?? sysType.color }
  }
  return null
}

// ── Rendered content ──────────────────────────────────────────────────────────
const mdOpts = computed(() => ({
  rich: true, postProcess: postProcessHtml, entityLookup,
  extraTypes: systemEntityTypes.value.map(t => t.id),
  allowTaskLists: true, allowLocalFileUris: true,
}))

const renderedContent = computed(() => {
  if (!draftContent.value?.trim()) return '<p class="md-empty">Nothing written yet…</p>'
  return renderMarkdown(draftContent.value, mdOpts.value)
})

const renderedScript = computed(() => {
  const content = draftScript.value || (entity.value?.attributes as any)?.scriptContent || ''
  if (!content.trim()) return '<p class="md-empty">No script written yet…</p>'
  return renderMarkdown(content, mdOpts.value)
})

function renderBlock(block: string): string {
  return block.trim() ? renderMarkdown(block, mdOpts.value) : ''
}

// ── Mixed mode ────────────────────────────────────────────────────────────────
const editableBlocks = ref<string[]>([''])
const activeBlock = ref<number | null>(null)
const mixedRefs: Record<number, HTMLTextAreaElement> = {}

function syncBlocks() {
  const blocks = draftContent.value.split(/\n\n+/)
  editableBlocks.value = blocks.length > 0 ? blocks : ['']
  activeBlock.value = null
}

function activateBlock(i: number) {
  activeBlock.value = i
  nextTick(() => {
    const el = mixedRefs[i]
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  })
}

function onBlockInput(i: number) {
  const el = mixedRefs[i]
  if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }
  draftContent.value = editableBlocks.value.join('\n\n')
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => store.updateEntity(props.entityId, { content: draftContent.value }), 800)
}

function onBlockBlur() {
  while (editableBlocks.value.length > 1 && !editableBlocks.value[editableBlocks.value.length - 1].trim()) {
    editableBlocks.value.pop()
  }
  activeBlock.value = null
}

function addBlock() {
  editableBlocks.value.push('')
  nextTick(() => activateBlock(editableBlocks.value.length - 1))
}

// ── Entity load ───────────────────────────────────────────────────────────────
watch(() => props.entityId, async (id) => {
  await store.loadEntity(id)
  draftContent.value = entity.value?.content ?? ''
  draftName.value = entity.value?.name ?? ''
  draftAttributes.value = { ...(entity.value?.attributes ?? {}) }
  draftScript.value = (entity.value?.attributes as any)?.scriptContent ?? ''
  isEditingName.value = false
  activePanel.value = 'content'
  activeBlock.value = null
  activeScriptBlock.value = null
  if (viewMode.value === 'mixed') syncBlocks()
  if (entity.value?.type === 'session') syncScriptBlocks()
}, { immediate: true })

watch(() => (draftAttributes.value as any)?.scriptContent, (val) => {
  if (val !== undefined && val !== draftScript.value) draftScript.value = val ?? ''
})

// ── Input handlers ────────────────────────────────────────────────────────────
function onScriptInput() {
  if (scriptSaveTimer) clearTimeout(scriptSaveTimer)
  scriptSaveTimer = setTimeout(async () => {
    const attrs = { ...(entity.value?.attributes as any ?? {}), scriptContent: draftScript.value }
    await store.updateEntity(props.entityId, { attributes: attrs })
  }, 800)
  checkAutocomplete(scriptRef.value, draftScript.value, true)
}

function onNotesInput() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => store.updateEntity(props.entityId, { content: draftContent.value }), 800)
  checkAutocomplete(editorRef.value, draftContent.value, false)
}

function onAttributesChange(attrs: EntityAttributes) {
  draftAttributes.value = attrs
  if (attrSaveTimer) clearTimeout(attrSaveTimer)
  attrSaveTimer = setTimeout(() => store.updateEntity(props.entityId, { attributes: attrs }), 500)
}

// ── Insert helpers ────────────────────────────────────────────────────────────
function insertInto(el: HTMLTextAreaElement | null, draft: { value: string }, before: string, after: string) {
  if (!el) return
  const start = el.selectionStart; const end = el.selectionEnd
  const selected = draft.value.slice(start, end)
  draft.value = draft.value.slice(0, start) + before + selected + after + draft.value.slice(end)
  nextTick(() => { el.setSelectionRange(start + before.length, start + before.length + selected.length); el.focus() })
}

function insertScript(before: string, after: string) { insertInto(scriptRef.value, draftScript, before, after) }
function insertNotes(before: string, after: string) { insertInto(editorRef.value, draftContent, before, after) }

// ── Autocomplete ──────────────────────────────────────────────────────────────
const autocomplete = ref({ show: false, items: [] as any[], triggerStart: 0, isScript: false })

async function checkAutocomplete(el: HTMLTextAreaElement | null, text: string, isScript: boolean) {
  if (!el) return
  const pos = el.selectionStart
  const match = text.slice(0, pos).match(/\{\{(\w+):\s*([^}]*)$/)
  if (!match) { autocomplete.value.show = false; return }
  const partialType = match[1].toLowerCase()
  if (partialType === 'roll') { autocomplete.value.show = false; return }
  const partialName = match[2]
  const campaignCandidates = store.entities.filter(e =>
    e.campaignId === props.campaignId &&
    (!partialType || e.type.startsWith(partialType)) &&
    (!partialName || e.name.toLowerCase().includes(partialName.toLowerCase()))
  ).map(e => ({ type: e.type, name: e.name, id: e.id }))
  const encounterCandidates = 'encounter'.startsWith(partialType)
    ? campaignEncounters.value
        .filter(e => !partialName || e.name.toLowerCase().includes(partialName.toLowerCase()))
        .map(e => ({ type: 'encounter', name: e.name, id: e.id }))
    : []
  let sysCandidates: { type: string; name: string; id: number }[] = []
  if (campaignSystemId.value) {
    const matchingSysType = systemEntityTypes.value.find(t => !partialType || t.id.toLowerCase().startsWith(partialType))
    if (matchingSysType) {
      const rows = await getDb().records
        .where('systemId').equals(campaignSystemId.value)
        .filter(r => r.entityTypeId === matchingSysType.id && (!partialName || r.name.toLowerCase().includes(partialName.toLowerCase())))
        .toArray()
      sysCandidates = rows.map(r => ({ type: matchingSysType.id, name: r.name, id: r.id! }))
    }
  }
  const candidates = [...campaignCandidates, ...encounterCandidates, ...sysCandidates].slice(0, 8)
  autocomplete.value = { show: candidates.length > 0, items: candidates, triggerStart: pos - match[0].length, isScript }
}

function applyAutocomplete(item: any, isScript: boolean) {
  const el = isScript ? scriptRef.value : editorRef.value
  const draft = isScript ? draftScript : draftContent
  if (!el) return
  const pos = el.selectionStart
  const before = draft.value.slice(0, autocomplete.value.triggerStart)
  const after = draft.value.slice(pos)
  const replacement = `{{${item.type}: ${item.name}}}`
  draft.value = `${before}${replacement}${after}`
  autocomplete.value.show = false
  nextTick(() => { const p = before.length + replacement.length; el.setSelectionRange(p, p); el.focus() })
}

// ── Preview click ─────────────────────────────────────────────────────────────
const { triggerRoll } = useDiceRoll()

function onPreviewClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.classList.contains('roll-ref')) { const roll = target.dataset.roll; if (roll) triggerRoll(roll); return }
  if (target.classList.contains('entity-ref')) {
    const type = target.dataset.entityType; const name = target.dataset.entityName
    if (!type || !name) return
    if (type === 'encounter') {
      const enc = campaignEncounters.value.find(e => e.name.toLowerCase() === name.toLowerCase())
      if (enc) router.push(`/encounter/${enc.id}`)
      return
    }
    const sysType = systemEntityTypes.value.find(t => t.id.toLowerCase() === type.toLowerCase())
    if (sysType && campaignSystemId.value) {
      router.push(`/system/${campaignSystemId.value}/${sysType.id}?open=${encodeURIComponent(name)}`)
    } else {
      emit('navigate', type, name)
    }
  }
}

// ── Image / map URLs ──────────────────────────────────────────────────────────
const entityImageUrl = computed(() => {
  const attrs = entity.value?.attributes as any
  if (!attrs) return null
  return attrs.logoSource || attrs.portraitSource || (entity.value?.type !== 'location' ? attrs.imageSource : null) || null
})

const entityMapUrl = computed(() => {
  if (entity.value?.type !== 'location') return null
  return (entity.value?.attributes as any)?.imageSource ?? null
})

// Merged attributes (saved + unsaved draft) for the entity card
const displayAttrs = computed(() => ({
  ...(entity.value?.attributes as any ?? {}),
  ...(draftAttributes.value as any),
}))

// ── Links ─────────────────────────────────────────────────────────────────────
const outgoingLinks = computed(() => store.linksFrom(props.entityId))
const backlinks = computed(() => entity.value ? store.backlinksTo(entity.value.type, entity.value.name) : [])
const pinnedOn = computed(() => entity.value ? store.pinnedLocationsFor(entity.value.id) : [])
const sourceEntity = (id: number) => store.entities.find(e => e.id === id)
const scriptLinks = computed(() => {
  if (entity.value?.type !== 'session') return []
  return extractLinks((entity.value?.attributes as any)?.scriptContent ?? '')
})

function linkAvatar(type: string, name: string) {
  const typeKey = type.toLowerCase()
  if (typeKey === 'encounter') {
    const enc = campaignEncounters.value.find(e => e.name.toLowerCase() === name.toLowerCase())
    return { imageUrl: enc?.mapSource ?? null, iconName: 'gi-broadsword', color: ENCOUNTER_COLOR }
  }
  const ent = store.findByTypeAndName(typeKey, name)
  if (ent) {
    const attrs = ent.attributes as any
    const imageUrl = attrs.portraitSource || attrs.logoSource || attrs.imageSource || null
    const cfg = ENTITY_TYPE_CONFIG[ent.type as keyof typeof ENTITY_TYPE_CONFIG]
    return { imageUrl, iconName: cfg?.defaultIcon ?? 'gi-scroll-unfurled', color: typeColorMap[ent.type] ?? '#888' }
  }
  const sysType = systemEntityTypes.value.find(t => t.id.toLowerCase() === typeKey)
  if (sysType) return { imageUrl: null, iconName: sysType.icon, color: sysType.color }
  const cfg = ENTITY_TYPE_CONFIG[typeKey as keyof typeof ENTITY_TYPE_CONFIG]
  return { imageUrl: null, iconName: cfg?.defaultIcon ?? 'gi-scroll-unfurled', color: typeColorMap[typeKey] ?? '#888' }
}

function navigateToSource(sourceId: number) {
  const e = sourceEntity(sourceId)
  if (e) emit('navigate', e.type, e.name)
}

// ── Name editing / delete ─────────────────────────────────────────────────────
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: transparent;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.editor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  min-width: 0;
}

.entity-type-badge {
  padding: 2px 9px;
  border-radius: var(--r4);
  border: 1px solid;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.editor-name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  margin: 0;
}
.editor-name:hover { color: var(--accent-l); }

.editor-name-input {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  background: var(--bg2);
  border: 1px solid var(--accent);
  border-radius: var(--r1);
  padding: 3px 8px;
  color: var(--text);
  outline: none;
}

.header-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

.mode-btn {
  padding: 3px 10px;
  border-radius: var(--r4);
  background: var(--bg2);
  border: 1px solid var(--border);
  color: var(--text3);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.12s;
}
.mode-btn.active { background: var(--accent-bg); border-color: var(--accent); color: var(--accent-l); }
.mode-btn:hover:not(.active) { border-color: var(--border-hi); color: var(--text2); }

.hdr-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--r1);
  background: var(--bg2);
  border: 1px solid var(--border);
  color: var(--text2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}
.hdr-btn:hover { border-color: var(--border-hi); background: var(--surface-hi); }
.hdr-btn.active { background: var(--accent-bg); border-color: var(--accent); color: var(--accent-l); }
.hdr-btn--danger { color: var(--danger); }
.hdr-btn--danger:hover { background: var(--danger-bg); border-color: var(--danger); }

/* ── Tab bar ─────────────────────────────────────────────────────────────── */
.editor-tabbar {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 6px;
  background: var(--bg2);
}
.etab-spacer { flex: 1; }
.etab-group {
  display: flex;
  border: 1px solid var(--border);
  border-radius: var(--r1);
  overflow: hidden;
  background: var(--bg);
}
.etab {
  padding: 3px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}
.etab + .etab { border-left: 1px solid var(--border); }
.etab:hover:not(:disabled) { color: var(--text2); background: var(--surface-hi); }
.etab.active { background: var(--accent-bg); color: var(--accent-l); }
.etab:disabled { opacity: 0.35; cursor: default; }

/* ── Body ────────────────────────────────────────────────────────────────── */
.editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.attributes-pane { flex: 1; overflow-y: auto; padding: 18px 20px; }

.editor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text3);
  font-size: 13px;
  font-style: italic;
  padding: 32px;
  text-align: center;
}

/* ── Session split ───────────────────────────────────────────────────────── */
.session-split {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.session-split-divider {
  width: 1px;
  background: var(--border);
  flex-shrink: 0;
}

.session-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.session-pane-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg2);
}
.session-pane-label-text {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--pane-accent, var(--text3));
}
.session-pane-label-badge {
  font-size: 9px;
  font-weight: 600;
  color: var(--text3);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r4);
  padding: 1px 7px;
  margin-left: auto;
}

/* ── Edit pane ───────────────────────────────────────────────────────────── */
.edit-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
  background: var(--bg2);
}

.tb-btn {
  padding: 3px 8px;
  border-radius: var(--r1);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text3);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}
.tb-btn:hover { background: var(--surface-hi); border-color: var(--border); color: var(--text); }
.tb-btn.italic { font-style: italic; }
.tb-entity { font-weight: 700; font-size: 11px; }

.tb-divider { width: 1px; height: 16px; background: var(--border-hi); margin: 0 3px; }

.editor-area-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
}

.editor-textarea {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 18px 22px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow-y: auto;
  color: var(--text);
  font-family: var(--fm);
  font-size: 13px;
  line-height: 1.75;
  caret-color: var(--accent);
}
.editor-textarea::placeholder { color: var(--text3); }

/* ── Autocomplete ────────────────────────────────────────────────────────── */
.autocomplete-dropdown {
  position: absolute;
  bottom: 8px;
  left: 22px;
  z-index: var(--z-sidebar);
  background: var(--surface-solid);
  border: 1px solid var(--border-hi);
  border-radius: var(--r2);
  width: 280px;
  overflow: hidden;
  box-shadow: var(--sh-md);
}
.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text);
  transition: background 0.1s;
  text-align: left;
  font-size: 13px;
}
.autocomplete-item:hover { background: var(--surface-hi); }
.autocomplete-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.autocomplete-name { flex: 1; }
.autocomplete-type { font-size: 10px; color: var(--text3); }
.autocomplete-empty { font-size: 12px; color: var(--text3); padding: 8px 12px; font-style: italic; margin: 0; }

/* ── Preview pane ────────────────────────────────────────────────────────── */
.preview-pane {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preview-body { padding: 20px 26px; flex: 1; }

/* ── NPC card (editor wrapper) ───────────────────────────────────────────── */
.npc-card-editor {
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  box-shadow: none;
  flex-shrink: 0;
}

/* ── Entity banner (non-NPC) ─────────────────────────────────────────────── */
.entity-banner {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}
.entity-banner-img {
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  display: block;
}

.preview-map-section { padding: 0 26px 18px; flex-shrink: 0; }
.preview-map-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--text3); margin-bottom: 6px;
}
.preview-map-img-wrap { border-radius: var(--r2); overflow: hidden; border: 1px solid var(--border); }
.preview-map-img { width: 100%; display: block; }

/* ── Mixed mode ──────────────────────────────────────────────────────────── */
.mixed-pane {
  flex: 1;
  overflow-y: auto;
  padding: 10px 18px 40px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
}

.mixed-block {
  border-radius: var(--r1);
  border: 1px solid transparent;
  transition: border-color 0.12s, background 0.12s;
}
.mixed-block:hover:not(.mixed-block--active) { border-color: var(--border); background: var(--bg2); }
.mixed-block--active { border-color: var(--accent); background: var(--accent-bg); }

.mixed-preview { padding: 5px 10px; cursor: text; min-height: 30px; }
.mixed-placeholder { color: var(--text3); font-style: italic; font-size: 13px; }

.mixed-textarea {
  width: 100%;
  padding: 5px 10px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: var(--text);
  font-family: var(--fm);
  font-size: 13px;
  line-height: 1.75;
  caret-color: var(--accent);
  min-height: 30px;
  overflow: hidden;
  display: block;
}

.mixed-add-btn {
  align-self: flex-start;
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: var(--r4);
  border: 1px dashed var(--border-hi);
  background: transparent;
  color: var(--text3);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
}
.mixed-add-btn:hover { color: var(--text2); border-color: var(--border-hi); background: var(--bg2); }

/* ── Links panel ─────────────────────────────────────────────────────────── */
.links-panel {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  padding: 8px 14px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  max-height: 108px;
  overflow-y: auto;
  background: var(--bg2);
}
.links-section { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
.links-label {
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text3);
}
.links-list { display: flex; flex-wrap: wrap; gap: 4px; }
.link-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: var(--r4);
  background: var(--bg); border: 1px solid var(--border);
  cursor: pointer; transition: all 0.12s;
  text-decoration: none; color: var(--text2); font-size: 12px;
}
.link-chip:hover { background: var(--surface-hi); border-color: var(--border-hi); }
.link-avatar { width: 14px; height: 14px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.link-sub { font-size: 10px; color: var(--text3); }

.md-empty { color: var(--text3); font-style: italic; padding: 20px 0 0; margin: 0; font-size: 14px; }
</style>

<style>
/* ── Markdown body (global) ──────────────────────────────────────────────── */
.markdown-body {
  color: var(--ink);
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.8;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3 { color: var(--gold); margin: 1.2em 0 0.4em; }
.markdown-body h1 { font-size: 1.5em; } .markdown-body h2 { font-size: 1.25em; } .markdown-body h3 { font-size: 1.05em; }
.markdown-body p { margin: 0.55em 0; }
.markdown-body ul { list-style: none; padding-left: 1.4em; margin: 0.4em 0; }
.markdown-body ul > li { position: relative; }
.markdown-body ul > li::before { content: '✦'; position: absolute; left: -1.2em; top: 1.46em; transform: translateY(-50%); color: var(--gold); font-size: 0.55em; line-height: 1; }
.markdown-body ol { list-style: decimal; padding-left: 1.6em; margin: 0.4em 0; }
.markdown-body li { margin: 0.2em 0; }
.markdown-body strong { color: #e8d4a0; }
.markdown-body em { color: #b0b8d0; font-style: italic; }
.markdown-body a { color: var(--gold); text-decoration: underline; text-decoration-color: rgba(184,134,11,0.4); text-underline-offset: 3px; }
.markdown-body a:hover { text-decoration-color: var(--gold); }
.markdown-body blockquote { border-left: 3px solid var(--gold); padding-left: 1em; margin: 0.8em 0; color: #9090b0; font-style: italic; }
.markdown-body code { background: var(--parch-dark); padding: 1px 5px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--gold); }
.markdown-body hr { border-color: var(--parch-line); margin: 1.4em 0; }
.markdown-body table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 14px; }
.markdown-body th { background: rgba(184,134,11,0.1); border: 1px solid var(--parch-line); padding: 6px 11px; text-align: left; font-weight: 600; color: var(--gold); }
.markdown-body td { border: 1px solid var(--parch-line); padding: 5px 11px; }
.markdown-body tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
.markdown-body .task-item { list-style: none; margin-left: -1.2em; }
.markdown-body .task-item::before { display: none; }
.markdown-body .task-item input[type="checkbox"] { margin-right: 7px; accent-color: var(--gold); width: 13px; height: 13px; vertical-align: middle; cursor: default; }
.markdown-body .task-item--done { color: var(--ink-ghost); text-decoration: line-through; }
.markdown-body mark { background: rgba(235,189,52,0.2); color: var(--ink); padding: 1px 4px; border-radius: 3px; }
.markdown-body s, .markdown-body del { color: var(--ink-ghost); }
.callout { border-left: 4px solid var(--callout-color, var(--gold)); background: color-mix(in srgb, var(--callout-color, var(--gold)) 10%, transparent); border-radius: 0 6px 6px 0; margin: 1em 0; overflow: hidden; }
.callout-title { font-weight: 700; color: var(--callout-color, var(--gold)); font-size: 11px; padding: 6px 14px; background: color-mix(in srgb, var(--callout-color, var(--gold)) 16%, transparent); display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.08em; }
.callout-body { color: var(--ink); font-size: 14px; line-height: 1.7; padding: 7px 14px 9px; }
.callout-body p { margin: 0.25em 0; }
.entity-ref { cursor: pointer; border-radius: 3px; padding: 1px 4px; font-weight: 600; transition: background 0.12s; display: inline; }
.entity-ref:hover { filter: brightness(1.2); }
.entity-ref em { font-size: 0.85em; font-style: normal; opacity: 0.75; margin-left: 3px; }
.entity-ref--note    { color: #7ba8e8; background: rgba(91,141,217,0.15); }
.entity-ref--npc     { color: #7dd89a; background: rgba(93,184,122,0.15); }
.entity-ref--item    { color: var(--gold); background: rgba(201,151,58,0.15); }
.entity-ref--location { color: #b98ee8; background: rgba(155,109,217,0.15); }
.entity-ref--faction  { color: #e87a7a; background: rgba(217,91,91,0.15); }
.entity-ref--encounter { color: #e8a87a; background: rgba(217,141,91,0.15); }
.entity-ref-avatar { display: inline-block; width: 14px; height: 14px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 3px; margin-top: -2px; border: 1px solid rgba(255,255,255,0.2); }
.entity-ref-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; vertical-align: middle; margin-right: 4px; margin-top: -1px; flex-shrink: 0; }
.roll-ref { display: inline-flex; align-items: center; gap: 3px; background: rgba(184,134,11,0.1); border: 1px solid rgba(184,134,11,0.35); border-radius: 5px; padding: 1px 8px; color: var(--gold); cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 0.88em; transition: all 0.12s; white-space: nowrap; }
.roll-ref:hover { background: rgba(184,134,11,0.22); border-color: var(--gold); }
.mixed-preview.markdown-body { padding: 0; font-size: 14px; }
</style>
