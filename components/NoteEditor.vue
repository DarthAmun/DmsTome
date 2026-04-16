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

        <!-- ── LEFT PAGE (side="editor"): Script / Prep ── -->
        <!-- Planning: editor + links bar   Running/Finished: preview + links bar -->
        <div v-if="props.side === 'editor'" class="edit-pane">
          <div class="session-pane-label" style="background:rgba(184,125,232,0.1)">
            <OhVueIcon name="gi-book-aura" scale="0.8" style="color:#b87de8" />
            Script / Prep
            <span v-if="sessionMode !== 'planning'" style="font-size:10px;color:var(--ink-ghost);margin-left:auto">read-only</span>
          </div>
          <!-- Planning: editable -->
          <template v-if="sessionMode === 'planning'">
            <div class="editor-toolbar">
              <button class="tb-btn" title="Bold" @click="insertMarkdownScript('**', '**')"><strong>B</strong></button>
              <button class="tb-btn italic" title="Italic" @click="insertMarkdownScript('*', '*')"><em>I</em></button>
              <button class="tb-btn" title="Heading" @click="insertMarkdownScript('## ', '')">H</button>
              <button class="tb-btn" title="List" @click="insertMarkdownScript('\n- ', '')">—</button>
              <div class="tb-divider" />
              <button v-for="t in entityTypes" :key="t.type" class="tb-btn entity-insert" :style="{ color: t.color }"
                :title="`Link ${t.label}`" @click="insertEntityRefScript(t.type)">
                {{ t.label.charAt(0) }}
              </button>
              <div class="tb-divider" />
              <span class="text-xs text-ink-ghost font-ui ml-1 font-mono">&#123;&#123;type: Name&#125;&#125;</span>
            </div>
            <div class="editor-area-wrap" style="position:relative">
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
          </template>
          <!-- Running / Finished: read-only preview -->
          <div v-else class="preview-pane">
            <div class="markdown-body" v-html="renderedScript" @click="onPreviewClick" />
          </div>
          <!-- Script links bar — always visible at bottom of left page -->
          <div v-if="scriptOutgoingLinks.length > 0" class="links-panel">
            <div class="links-section">
              <span class="f-label">Script Links</span>
              <div class="links-list">
                <button v-for="link in scriptOutgoingLinks" :key="`${link.type}:${link.name}`" class="link-chip"
                  :style="{ borderColor: (typeColorMap[link.type] ?? 'var(--ink-faded)') + '55' }"
                  @click="$emit('navigate', link.type, link.name)">
                  <template v-if="linkAvatar(link.type, link.name).imageUrl">
                    <img :src="linkAvatar(link.type, link.name).imageUrl!" class="link-avatar" />
                  </template>
                  <OhVueIcon v-else :name="linkAvatar(link.type, link.name).iconName" scale="0.75"
                    :style="{ color: linkAvatar(link.type, link.name).color, flexShrink: 0 }" />
                  <span class="text-sm">{{ link.name }}</span>
                  <span class="text-xs text-ink-ghost">{{ link.type }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── RIGHT PAGE (side="preview"): Notes / Preview ── -->
        <!-- Planning: script preview (no links bar)   Running/Finished: notes editor/preview + links bar -->
        <div v-else-if="props.side === 'preview'" class="edit-pane">
          <div class="session-pane-label" style="background:rgba(235,189,52,0.08)">
            <OhVueIcon name="md-editnote" scale="0.8" style="color:var(--gold)" />
            <span v-if="sessionMode === 'planning'">Script Preview</span>
            <span v-else>Session Notes</span>
            <span v-if="sessionMode === 'planning'" style="font-size:10px;color:var(--ink-ghost);margin-left:auto">live preview</span>
          </div>
          <!-- Planning: script preview only -->
          <div v-if="sessionMode === 'planning'" class="preview-pane">
            <div class="markdown-body" v-html="renderedScript" @click="onPreviewClick" />
          </div>
          <!-- Running: notes editor -->
          <template v-else-if="sessionMode === 'running'">
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
          </template>
          <!-- Finished: notes preview -->
          <div v-else class="preview-pane">
            <div v-if="draftContent" class="markdown-body" v-html="renderedContent" @click="onPreviewClick" />
            <p v-else class="text-ink-ghost italic font-body" style="padding:24px">No session notes yet…</p>
          </div>
          <!-- Notes links bar — shown in running and finished modes -->
          <div v-if="outgoingLinks.length > 0 && sessionMode !== 'planning'" class="links-panel">
            <div class="links-section">
              <span class="f-label">Notes Links</span>
              <div class="links-list">
                <button v-for="link in outgoingLinks" :key="link.id" class="link-chip"
                  :style="{ borderColor: (typeColorMap[link.targetType] ?? 'var(--ink-faded)') + '55' }"
                  @click="$emit('navigate', link.targetType, link.targetName)">
                  <template v-if="linkAvatar(link.targetType, link.targetName).imageUrl">
                    <img :src="linkAvatar(link.targetType, link.targetName).imageUrl!" class="link-avatar" />
                  </template>
                  <OhVueIcon v-else :name="linkAvatar(link.targetType, link.targetName).iconName" scale="0.75"
                    :style="{ color: linkAvatar(link.targetType, link.targetName).color, flexShrink: 0 }" />
                  <span class="text-sm">{{ link.targetName }}</span>
                  <span class="text-xs text-ink-ghost">{{ link.targetType }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Full split (no side prop — not used by notes.vue but kept for completeness) -->
        <div v-else class="split-pane">
          <div class="edit-pane">
            <div class="session-pane-label" style="background:rgba(184,125,232,0.1)">
              <OhVueIcon name="gi-book-aura" scale="0.8" style="color:#b87de8" />Script / Prep
            </div>
            <template v-if="sessionMode === 'planning'">
              <div class="editor-toolbar">
                <button class="tb-btn" title="Bold" @click="insertMarkdownScript('**', '**')"><strong>B</strong></button>
                <button class="tb-btn italic" title="Italic" @click="insertMarkdownScript('*', '*')"><em>I</em></button>
                <button class="tb-btn" title="Heading" @click="insertMarkdownScript('## ', '')">H</button>
                <button class="tb-btn" title="List" @click="insertMarkdownScript('\n- ', '')">—</button>
                <div class="tb-divider" />
                <button v-for="t in entityTypes" :key="t.type" class="tb-btn entity-insert" :style="{ color: t.color }"
                  :title="`Link ${t.label}`" @click="insertEntityRefScript(t.type)">{{ t.label.charAt(0) }}</button>
              </div>
              <div class="editor-area-wrap" style="position:relative">
                <textarea ref="scriptRef" v-model="draftScript" class="editor-textarea" spellcheck="true" @input="onScriptInput" placeholder="Write your session script…" />
              </div>
            </template>
            <div v-else class="preview-pane"><div class="markdown-body" v-html="renderedScript" @click="onPreviewClick" /></div>
          </div>
          <div class="split-divider" />
          <div class="edit-pane">
            <div class="session-pane-label" style="background:rgba(235,189,52,0.08)">
              <OhVueIcon name="md-editnote" scale="0.8" style="color:var(--gold)" />Session Notes
            </div>
            <template v-if="sessionMode === 'running'">
              <div class="editor-toolbar">
                <button class="tb-btn" title="Bold" @click="insertMarkdown('**', '**')"><strong>B</strong></button>
                <button class="tb-btn italic" title="Italic" @click="insertMarkdown('*', '*')"><em>I</em></button>
                <button class="tb-btn" title="List" @click="insertMarkdown('\n- ', '')">—</button>
                <div class="tb-divider" />
                <button v-for="t in entityTypes" :key="t.type" class="tb-btn entity-insert" :style="{ color: t.color }"
                  :title="`Link ${t.label}`" @click="insertEntityRef(t.type)">{{ t.label.charAt(0) }}</button>
              </div>
              <div class="editor-area-wrap" style="position:relative">
                <textarea ref="editorRef" v-model="draftContent" class="editor-textarea" spellcheck="true" @input="onInput" placeholder="Take notes here…" />
              </div>
            </template>
            <div v-else-if="sessionMode === 'planning'" class="preview-pane"><div class="markdown-body" v-html="renderedScript" @click="onPreviewClick" /></div>
            <div v-else class="preview-pane">
              <div v-if="draftContent" class="markdown-body" v-html="renderedContent" @click="onPreviewClick" />
              <p v-else class="text-ink-ghost italic font-body" style="padding:24px">No notes yet…</p>
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
    <!-- Global links panel — shown for non-session entities only (sessions render their own per-pane links) -->
    <div v-if="(outgoingLinks.length > 0 || backlinks.length > 0 || pinnedOn.length > 0) && props.side !== 'editor' && entity?.type !== 'session'" class="links-panel">
      <div v-if="pinnedOn.length > 0" class="links-section">
        <span class="f-label">Found in</span>
        <div class="links-list">
          <NuxtLink v-for="p in pinnedOn" :key="p.location.id"
            :to="`/campaign/${campaignId}/map?locationId=${p.location.id}`" class="link-chip pinned-chip">
            <template v-if="linkAvatar('location', p.location.name).imageUrl">
              <img :src="linkAvatar('location', p.location.name).imageUrl!" class="link-avatar" />
            </template>
            <OhVueIcon v-else name="gi-castle" scale="0.75" style="color:var(--gold);flex-shrink:0" />
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
            <template v-if="linkAvatar(link.targetType, link.targetName).imageUrl">
              <img :src="linkAvatar(link.targetType, link.targetName).imageUrl!" class="link-avatar" />
            </template>
            <OhVueIcon v-else
              :name="linkAvatar(link.targetType, link.targetName).iconName"
              scale="0.75"
              :style="{ color: linkAvatar(link.targetType, link.targetName).color, flexShrink: 0 }" />
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
            <template v-if="linkAvatar(sourceEntity(bl.sourceId)?.type ?? '', sourceEntity(bl.sourceId)?.name ?? '').imageUrl">
              <img :src="linkAvatar(sourceEntity(bl.sourceId)?.type ?? '', sourceEntity(bl.sourceId)?.name ?? '').imageUrl!" class="link-avatar" />
            </template>
            <OhVueIcon v-else
              :name="linkAvatar(sourceEntity(bl.sourceId)?.type ?? '', sourceEntity(bl.sourceId)?.name ?? '').iconName"
              scale="0.75"
              :style="{ color: linkAvatar(sourceEntity(bl.sourceId)?.type ?? '', sourceEntity(bl.sourceId)?.name ?? '').color, flexShrink: 0 }" />
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
import * as GiIcons from 'oh-vue-icons/icons/gi'
import { useNotesStore } from '~/stores/notes'
import { useSystemsStore } from '~/stores/systems'
import { renderEntityRefs, extractLinks } from '~/composables/useEntityParser'
import { useDiceRoll } from '~/composables/useDiceRoll'
import { getDb } from '~/composables/useDb'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import type { EntityAttributes } from '~/types/entities'

// ── Icon helpers ─────────────────────────────────────────────────────────────
function giNameToExport(name: string): string {
  // 'gi-scroll-unfurled' → 'GiScrollUnfurled'
  const body = name.replace(/^gi-/, '')
  const pascal = body.charAt(0).toUpperCase() + body.slice(1).replace(/-([a-z])/g, (_, l) => l.toUpperCase())
  return 'Gi' + pascal
}
function iconToSvg(icon: any, color: string): string {
  const vb = `${icon.minX ?? 0} ${icon.minY ?? 0} ${icon.width} ${icon.height}`
  return `<svg viewBox="${vb}" fill="${color}" style="display:inline-block;width:13px;height:13px;vertical-align:middle;margin-right:3px;margin-top:-2px;flex-shrink:0">${icon.raw}</svg>`
}
function typeIconHtml(type: string, color: string): string {
  const TYPE_ICON_NAMES: Record<string, string> = {
    note: 'gi-scroll-unfurled', npc: 'gi-person', item: 'gi-open-treasure-chest',
    location: 'gi-castle', faction: 'gi-american-shield', quest: 'gi-holy-grail',
    event: 'gi-sands-of-time', session: 'gi-book-aura', encounter: 'gi-broadsword',
  }
  const iconName = TYPE_ICON_NAMES[type]
  if (!iconName) return ''
  const icon = (GiIcons as any)[giNameToExport(iconName)]
  return icon ? iconToSvg(icon, color) : ''
}
function giIconByName(name: string): any | null {
  return (GiIcons as any)[giNameToExport(name)] ?? null
}

const props = defineProps<{ entityId: number; campaignId: number; side?: 'editor' | 'preview' }>()
const emit = defineEmits<{ navigate: [type: string, name: string]; deleted: [] }>()

const store = useNotesStore()
const systemsStore = useSystemsStore()
const router = useRouter()

// Encounters for this campaign (for {{encounter: Name}} refs)
const campaignEncounters = ref<{ id: number; name: string; mapSource?: string }[]>([])

// System linked to this campaign
const campaignSystemId = ref<number | null>(null)
const systemEntityTypes = ref<{ id: string; name: string; color: string; icon: string }[]>([])
const systemRecordCache = ref<Map<string, { color: string }>>(new Map())

watch(() => props.campaignId, async (id) => {
  if (!id) return
  // Load encounters for {{encounter: Name}} refs
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
  // Pre-cache records from system for entity lookup
  const records = await getDb().records.where('systemId').equals(sysId).toArray()
  const cache = new Map<string, { color: string }>()
  for (const rec of records) {
    const et = sys.entityTypes.find(t => t.id === rec.entityTypeId)
    if (et) cache.set(`${rec.entityTypeId}:${rec.name.toLowerCase()}`, { color: et.color })
  }
  systemRecordCache.value = cache
}, { immediate: true })

const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true })

// ── Inline: ~~strikethrough~~
md.inline.ruler.after('backticks', 'strikethrough', (state: any, silent: boolean) => {
  const src = state.src
  const start = state.pos
  if (src.charCodeAt(start) !== 0x7E || src.charCodeAt(start + 1) !== 0x7E) return false
  const end = src.indexOf('~~', start + 2)
  if (end < 0 || end === start + 2) return false
  if (!silent) {
    const max = state.posMax
    state.push('s_open', 's', 1)
    state.pos = start + 2
    state.posMax = end
    state.md.inline.tokenize(state)
    state.push('s_close', 's', -1)
    state.pos = end + 2
    state.posMax = max
  } else {
    state.pos = end + 2
  }
  return true
})

// ── Inline: ==highlight==
md.inline.ruler.after('backticks', 'highlight_mark', (state: any, silent: boolean) => {
  const src = state.src
  const start = state.pos
  if (src.charCodeAt(start) !== 0x3D || src.charCodeAt(start + 1) !== 0x3D) return false
  const end = src.indexOf('==', start + 2)
  if (end < 0 || end === start + 2) return false
  if (!silent) {
    const max = state.posMax
    state.push('mark_open', 'mark', 1)
    state.pos = start + 2
    state.posMax = end
    state.md.inline.tokenize(state)
    state.push('mark_close', 'mark', -1)
    state.pos = end + 2
    state.posMax = max
  } else {
    state.pos = end + 2
  }
  return true
})

// ── Post-processing: task lists + callouts
const CALLOUT_TYPES: Record<string, { color: string; icon: string }> = {
  note:      { color: '#5b8ee6', icon: 'ℹ️' },
  info:      { color: '#5b8ee6', icon: 'ℹ️' },
  tip:       { color: '#5aad6e', icon: '💡' },
  warning:   { color: '#e6a93b', icon: '⚠️' },
  caution:   { color: '#e05a5a', icon: '⚠️' },
  danger:    { color: '#e05a5a', icon: '🔥' },
  important: { color: '#9b59d4', icon: '❗' },
}

function postProcessHtml(html: string): string {
  // Task list checkboxes
  let out = html
    .replace(/<li>\s*\[ \]\s*/g, '<li class="task-item"><input type="checkbox" disabled> ')
    .replace(/<li>\s*\[x\]\s*/gi, '<li class="task-item task-item--done"><input type="checkbox" checked disabled> ')

  // Obsidian-style callouts: > [!TYPE] optional title
  // With breaks:true, markdown-it renders as: <blockquote><p>[!TYPE] title<br>\nbody</p></blockquote>
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

const ENCOUNTER_COLOR = '#e8a87a'
const entityTypes = [
  ...Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => ({ type, label: cfg.plural, color: cfg.color })),
  { type: 'encounter', label: 'Encounters', color: ENCOUNTER_COLOR },
]
const typeColorMap: Record<string, string> = {
  ...Object.fromEntries(Object.entries(ENTITY_TYPE_CONFIG).map(([t, c]) => [t, c.color])),
  encounter: ENCOUNTER_COLOR,
}
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
  const html = postProcessHtml(md.render(script))
  return DOMPurify.sanitize(renderEntityRefs(html, entityLookup, systemEntityTypes.value.map(t => t.id)), { ADD_ATTR: ['data-entity-type', 'data-entity-name', 'style', 'class', 'type', 'checked', 'disabled'], ADD_URI_SAFE_ATTR: ['src'], ALLOWED_URI_REGEXP: /^(?:(?:https?|local-file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i })
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

function entityLookup(type: string, name: string): { imageUrl?: string; iconHtml?: string; color: string } | null {
  const typeKey = type.toLowerCase()
  // Encounters — show map image or broadsword icon
  if (typeKey === 'encounter') {
    const enc = campaignEncounters.value.find(e => e.name.toLowerCase() === name.toLowerCase())
    const imageUrl = enc?.mapSource
    const color = ENCOUNTER_COLOR
    return { imageUrl, iconHtml: imageUrl ? undefined : typeIconHtml('encounter', color), color }
  }
  // Campaign entities
  const entity = store.findByTypeAndName(typeKey, name)
  if (entity) {
    const attrs = entity.attributes as any
    const imageUrl = attrs.portraitSource || attrs.logoSource || attrs.imageSource || undefined
    const color = typeColorMap[entity.type] ?? '#888'
    return { imageUrl, iconHtml: imageUrl ? undefined : typeIconHtml(entity.type, color), color }
  }
  // System entity types
  const sysType = systemEntityTypes.value.find(t => t.id.toLowerCase() === typeKey)
  if (sysType) {
    const cached = systemRecordCache.value.get(`${sysType.id}:${name.toLowerCase()}`)
    const color = cached?.color ?? sysType.color
    const icon = giIconByName(sysType.icon)
    return { iconHtml: icon ? iconToSvg(icon, color) : undefined, color }
  }
  return null
}

const renderedContent = computed(() => {
  const content = props.side === 'preview' ? (entity.value?.content ?? '') : draftContent.value
  if (!content) return '<p class="text-ink-ghost italic font-body">Nothing written yet…</p>'
  const html = postProcessHtml(md.render(content))
  const withRefs = renderEntityRefs(html, entityLookup, systemEntityTypes.value.map(t => t.id))
  return DOMPurify.sanitize(withRefs, { ADD_ATTR: ['data-entity-type', 'data-entity-name', 'style', 'class', 'type', 'checked', 'disabled'], ADD_URI_SAFE_ATTR: ['src'], ALLOWED_URI_REGEXP: /^(?:(?:https?|local-file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i })
})

function linkAvatar(type: string, name: string): { imageUrl: string | null; iconName: string; color: string } {
  const typeKey = type.toLowerCase()
  if (typeKey === 'encounter') {
    const enc = campaignEncounters.value.find(e => e.name.toLowerCase() === name.toLowerCase())
    return { imageUrl: enc?.mapSource ?? null, iconName: 'gi-broadsword', color: ENCOUNTER_COLOR }
  }
  const entity = store.findByTypeAndName(typeKey, name)
  if (entity) {
    const attrs = entity.attributes as any
    const imageUrl = attrs.portraitSource || attrs.logoSource || attrs.imageSource || null
    const cfg = ENTITY_TYPE_CONFIG[entity.type as keyof typeof ENTITY_TYPE_CONFIG]
    return { imageUrl, iconName: cfg?.defaultIcon ?? 'gi-scroll-unfurled', color: typeColorMap[entity.type] ?? '#888' }
  }
  const sysType = systemEntityTypes.value.find(t => t.id.toLowerCase() === typeKey)
  if (sysType) return { imageUrl: null, iconName: sysType.icon, color: sysType.color }
  const cfg = ENTITY_TYPE_CONFIG[typeKey as keyof typeof ENTITY_TYPE_CONFIG]
  return { imageUrl: null, iconName: cfg?.defaultIcon ?? 'gi-scroll-unfurled', color: typeColorMap[typeKey] ?? '#888' }
}

const outgoingLinks = computed(() => store.linksFrom(props.entityId))
const scriptOutgoingLinks = computed(() => {
  if (entity.value?.type !== 'session') return []
  const scriptContent = (entity.value?.attributes as any)?.scriptContent ?? ''
  return extractLinks(scriptContent)
})
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

async function checkAutocomplete(el: HTMLTextAreaElement | null, text: string, isScript: boolean) {
  if (!el) return
  const pos = el.selectionStart
  const match = text.slice(0, pos).match(/\{\{(\w+):\s*([^}]*)$/)
  if (!match) { autocomplete.value.show = false; return }
  const partialType = match[1].toLowerCase()
  if (partialType === 'roll') { autocomplete.value.show = false; return }
  const partialName = match[2]
  // Campaign entities
  const campaignCandidates = store.entities.filter(e => {
    return e.campaignId === props.campaignId &&
      (!partialType || e.type.startsWith(partialType)) &&
      (!partialName || e.name.toLowerCase().includes(partialName.toLowerCase()))
  }).map(e => ({ type: e.type, name: e.name }))
  // Encounters
  const encounterCandidates = 'encounter'.startsWith(partialType)
    ? campaignEncounters.value
        .filter(e => !partialName || e.name.toLowerCase().includes(partialName.toLowerCase()))
        .map(e => ({ type: 'encounter', name: e.name }))
    : []
  // System entity records
  let sysCandidates: { type: string; name: string }[] = []
  if (campaignSystemId.value) {
    const matchingSysType = systemEntityTypes.value.find(t => !partialType || t.id.toLowerCase().startsWith(partialType))
    if (matchingSysType) {
      const rows = await getDb().records
        .where('systemId').equals(campaignSystemId.value)
        .filter(r => r.entityTypeId === matchingSysType.id && (!partialName || r.name.toLowerCase().includes(partialName.toLowerCase())))
        .toArray()
      sysCandidates = rows.map(r => ({ type: matchingSysType.id, name: r.name }))
    }
  }
  const candidates = [...campaignCandidates, ...encounterCandidates, ...sysCandidates].slice(0, 8)
  autocomplete.value = { show: candidates.length > 0, items: candidates, triggerStart: pos - match[0].length, isScript }
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

function insertMarkdownScript(before: string, after: string) {
  const el = scriptRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = draftScript.value.slice(start, end)
  draftScript.value = draftScript.value.slice(0, start) + before + selected + after + draftScript.value.slice(end)
  nextTick(() => { el.setSelectionRange(start + before.length, start + before.length + selected.length); el.focus() })
}

function insertEntityRefScript(type: string) { insertMarkdownScript(`{{${type}: `, '}}') }

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
    if (!type || !name) return
    // Encounter: navigate to the encounter editor
    if (type === 'encounter') {
      const enc = campaignEncounters.value.find(e => e.name.toLowerCase() === name.toLowerCase())
      if (enc) router.push(`/encounter/${enc.id}`)
      return
    }
    // Check if this is a system entity type
    const sysType = systemEntityTypes.value.find(t => t.id.toLowerCase() === type.toLowerCase())
    if (sysType && campaignSystemId.value) {
      router.push(`/system/${campaignSystemId.value}/${sysType.id}?open=${encodeURIComponent(name)}`)
    } else {
      emit('navigate', type, name)
    }
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
  flex: 1;
  min-height: 0;
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
  min-height: 0;
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
  min-height: 0;
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
  min-height: 0;
}

.preview-pane {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
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
  min-height: 0;
}

.editor-textarea {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 20px 24px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow-y: auto;
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

.link-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(28,20,16,0.1);
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

.markdown-body ul {
  list-style: none;
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.markdown-body ul > li {
  position: relative;
}

.markdown-body ul > li::before {
  content: '✦';
  position: absolute;
  left: -1.2em;
  top: 1.46em;
  transform: translateY(-50%);
  color: var(--gold);
  font-size: 0.6em;
  line-height: 1;
}

.markdown-body ol {
  list-style: decimal;
  padding-left: 1.8em;
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

.markdown-body a {
  color: var(--gold);
  text-decoration: underline;
  text-decoration-color: rgba(184, 134, 11, 0.5);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.15s;
}

.markdown-body a:hover {
  text-decoration-color: var(--gold);
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

/* ── Tables ───────────────────────────────────────────────────── */
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 15px;
}
.markdown-body th {
  background: rgba(184,134,11,0.1);
  border: 1px solid var(--parch-line, rgba(255,255,255,0.08));
  padding: 7px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--gold);
}
.markdown-body td {
  border: 1px solid var(--parch-line, rgba(255,255,255,0.08));
  padding: 6px 12px;
}
.markdown-body tr:nth-child(even) td {
  background: rgba(255,255,255,0.02);
}

/* ── Task lists ───────────────────────────────────────────────── */
.markdown-body .task-item {
  list-style: none;
  margin-left: -1.2em;
}
.markdown-body .task-item::before {
  display: none;
}
.markdown-body .task-item input[type="checkbox"] {
  margin-right: 7px;
  accent-color: var(--gold);
  width: 14px;
  height: 14px;
  vertical-align: middle;
  cursor: default;
}
.markdown-body .task-item--done {
  color: var(--ink-ghost, rgba(200,185,165,0.5));
  text-decoration: line-through;
}

/* ── Highlight ==text== ───────────────────────────────────────── */
.markdown-body mark {
  background: rgba(235,189,52,0.22);
  color: var(--ink);
  padding: 1px 4px;
  border-radius: 3px;
  font-style: normal;
}

/* ── Strikethrough ~~text~~ ───────────────────────────────────── */
.markdown-body s, .markdown-body del {
  color: var(--ink-ghost, rgba(200,185,165,0.5));
}

/* ── Callouts > [!NOTE] ───────────────────────────────────────── */
.callout {
  border-left: 4px solid var(--callout-color, var(--gold));
  background: color-mix(in srgb, var(--callout-color, var(--gold)) 10%, transparent);
  border-radius: 0 6px 6px 0;
  padding: 0;
  margin: 1.1em 0;
  overflow: hidden;
}
.callout-title {
  font-weight: 700;
  color: var(--callout-color, var(--gold));
  font-size: 12px;
  padding: 7px 14px;
  background: color-mix(in srgb, var(--callout-color, var(--gold)) 16%, transparent);
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.callout-body {
  color: var(--ink);
  font-size: 15px;
  line-height: 1.7;
  padding: 8px 14px 10px;
}
.callout-body p { margin: 0.3em 0; }

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
