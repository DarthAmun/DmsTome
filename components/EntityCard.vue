<template>
  <div class="entity-card" :class="`entity-card--${entity.type}`" @click="$emit('click')">

    <!-- NPC — round portrait -->
    <template v-if="entity.type === 'npc'">
      <div class="npc-inner">
        <div class="npc-avatar-col">
          <div class="npc-avatar">
            <img v-if="attrs.portraitSource" :src="imageUrl(attrs.portraitSource, attrs.portraitType)"
              class="w-full h-full object-cover" />
            <OhVueIcon v-else name="gi-person" scale="1.8" style="color:var(--forge-muted);opacity:0.5" />
          </div>
          <div class="alive-dot" :class="attrs.isAlive === false ? 'dead' : 'alive'" />
        </div>
        <div class="card-info">
          <div class="card-name">{{ entity.name }}</div>
          <div v-if="attrs.title" class="card-title">{{ attrs.title }}</div>
          <div v-if="attrs.role" class="card-role">{{ attrs.role }}</div>
          <div class="card-sub-row">
            <span v-if="attrs.race" class="card-sub">{{ attrs.race }}</span>
            <span v-if="attrs.level" class="card-level">Lv {{ attrs.level }}</span>
          </div>
          <div v-if="attrs.status" class="card-status">{{ attrs.status }}</div>
          <div class="card-date">edited {{ formatDate(entity.updatedAt) }}</div>
        </div>
      </div>
    </template>

    <!-- Location -->
    <template v-else-if="entity.type === 'location'">
      <div class="banner">
        <img v-if="attrs.imageSource" :src="imageUrl(attrs.imageSource, attrs.imageType)"
          class="w-full h-full object-cover" />
        <div v-else class="banner-placeholder">
          <OhVueIcon name="gi-castle" scale="2" style="color:var(--forge-muted);opacity:0.3" />
        </div>
        <span v-if="attrs.status" class="status-pill" :class="`status--${attrs.status}`">{{ attrs.status }}</span>
      </div>
      <div class="card-body">
        <div class="card-name">{{ entity.name }}</div>
        <div v-if="attrs.locationType" class="card-sub capitalize">{{ attrs.locationType }}</div>
        <div class="card-date">edited {{ formatDate(entity.updatedAt) }}</div>
      </div>
    </template>

    <!-- Item -->
    <template v-else-if="entity.type === 'item'">
      <div class="item-inner">
        <div class="item-thumb">
          <img v-if="attrs.imageSource" :src="imageUrl(attrs.imageSource, attrs.imageType)"
            class="w-full h-full object-cover" />
          <div v-else class="thumb-placeholder">
            <OhVueIcon name="gi-open-treasure-chest" scale="1.6" style="color:var(--forge-muted);opacity:0.4" />
          </div>
        </div>
        <div class="card-info">
          <div class="card-name">{{ entity.name }}</div>
          <div class="flex flex-wrap gap-1 mt-1">
            <span v-if="attrs.rarity" class="rarity-badge" :class="`rarity--${attrs.rarity}`">{{ attrs.rarity }}</span>
            <span v-if="attrs.itemType" class="card-sub capitalize">{{ attrs.itemType }}</span>
          </div>
          <div class="flex gap-1 mt-1">
            <span v-if="attrs.isMagic" class="tag-badge tag--magic"><OhVueIcon name="gi-magic-palm" scale="0.7" /> Magic</span>
            <span v-if="attrs.isCursed" class="tag-badge tag--curse"><OhVueIcon name="fa-skull" scale="0.7" /> Cursed</span>
          </div>
          <div v-if="attrs.value" class="card-sub mt-1"><OhVueIcon name="gi-coins" scale="0.75" /> {{ attrs.value }}</div>
          <div class="card-date">edited {{ formatDate(entity.updatedAt) }}</div>
        </div>
      </div>
    </template>

    <!-- Faction -->
    <template v-else-if="entity.type === 'faction'">
      <div class="banner banner--short">
        <img v-if="attrs.imageSource" :src="imageUrl(attrs.imageSource, attrs.imageType)"
          class="w-full h-full object-cover" />
        <div v-else class="banner-placeholder">
          <OhVueIcon name="gi-american-shield" scale="2" style="color:var(--forge-muted);opacity:0.3" />
        </div>
      </div>
      <div class="card-body">
        <div class="card-name">{{ entity.name }}</div>
        <div class="flex flex-wrap gap-1 mt-1">
          <span v-if="attrs.factionType" class="card-sub capitalize">{{ attrs.factionType }}</span>
          <span v-if="attrs.size" class="card-sub capitalize">· {{ attrs.size }}</span>
          <span v-if="attrs.isSecret" class="tag-badge tag--secret">Secret</span>
        </div>
        <div class="card-date">edited {{ formatDate(entity.updatedAt) }}</div>
      </div>
    </template>

    <!-- Note -->
    <template v-else>
      <div class="note-inner">
        <div class="note-icon-col" :style="{ background: typeColor + '14', borderColor: typeColor + '33' }">
          <OhVueIcon :name="noteIcon" scale="1.6" :style="{ color: typeColor }" />
        </div>
        <div class="card-info">
          <div class="card-name">{{ entity.name }}</div>
          <div v-if="noteTags.length" class="flex flex-wrap gap-1 mt-1">
            <span v-for="tag in noteTags.slice(0,3)" :key="tag" class="note-tag">{{ tag }}</span>
          </div>
          <div class="card-preview">{{ contentPreview }}</div>
          <div class="card-date">edited {{ formatDate(entity.updatedAt) }}</div>
        </div>
      </div>
    </template>

    <!-- Hover actions -->
    <div class="card-actions">
      <button class="act-icon" title="Edit"      @click.stop="$emit('edit')">
        <OhVueIcon name="md-editnote" scale="0.85" />
      </button>
      <button class="act-icon" title="Duplicate" @click.stop="$emit('duplicate')">
        <OhVueIcon name="md-add" scale="0.85" />
      </button>
      <button class="act-icon act-icon--danger" title="Delete" @click.stop="$emit('delete')">
        <OhVueIcon name="md-delete" scale="0.85" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Entity } from '~/stores/notes'
import { ENTITY_TYPE_CONFIG, NOTE_ICONS } from '~/types/entities'

const props = defineProps<{ entity: Entity }>()
defineEmits<{ click: []; edit: []; duplicate: []; delete: [] }>()

const attrs = computed(() => props.entity.attributes as any)
const typeColor = computed(() => ENTITY_TYPE_CONFIG[props.entity.type]?.color ?? '#8888aa')
const noteIcon = computed(() => (attrs.value as any).icon || ENTITY_TYPE_CONFIG.note.defaultIcon)
const noteTags = computed(() => (attrs.value as any).tags ?? [])
const contentPreview = computed(() =>
  props.entity.content.replace(/[#*`\[\]{}]/g, '').slice(0, 80).trim()
)

function imageUrl(source: string, type?: string) {
  return type
}

function formatDate(dt: string) {
  if (!dt) return ''
  const diff = Date.now() - new Date(dt).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7)  return `${days}d ago`
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.entity-card {
  position: relative; background: var(--card, var(--forge-surface));
  border-radius: 16px; overflow: hidden; cursor: pointer;
  transition: all 0.2s; display: flex; flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
.entity-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.4); }
.entity-card:hover .card-actions { opacity: 1; }

/* ── NPC with round portrait ─────────────────────────────────────── */
.npc-inner { display: flex; align-items: flex-start; padding: 14px; gap: 12px; min-height: 90px; }
.npc-avatar-col { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
.npc-avatar {
  width: 60px; height: 60px; border-radius: 50%;
  background: var(--raised, var(--forge-raised));
  border: 2px solid var(--border, var(--forge-border));
  overflow: hidden; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.npc-avatar img { width: 100%; height: 100%; object-fit: cover; }
.alive-dot {
  width: 9px; height: 9px; border-radius: 50%;
  border: 2px solid var(--card, var(--forge-surface));
}
.alive-dot.alive { background: var(--forge-green); }
.alive-dot.dead  { background: var(--forge-danger); }
.card-title { font-size: 11px; color: var(--forge-accent); font-style: italic; }
.card-sub-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.card-level {
  font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 999px;
  background: var(--forge-accent-dim, rgba(235,189,52,0.12));
  color: var(--forge-accent); border: 1px solid rgba(235,189,52,0.3);
}

/* ── Banner (Location / Faction) ─────────────────────────────────── */
.banner { height: 88px; background: var(--raised, var(--forge-raised)); overflow: hidden; position: relative; flex-shrink: 0; }
.banner--short { height: 66px; }
.banner-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.status-pill { position: absolute; top: 8px; right: 8px; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; text-transform: capitalize; }
.status--discovered   { background: rgba(124,196,78,0.18);  color: var(--forge-green);  border: 1px solid rgba(124,196,78,0.35); }
.status--undiscovered { background: rgba(96,96,96,0.18);    color: var(--forge-muted);  border: 1px solid var(--forge-border); }
.status--destroyed    { background: rgba(224,85,85,0.18);   color: var(--forge-danger); border: 1px solid rgba(224,85,85,0.35); }

/* ── Item ────────────────────────────────────────────────────────── */
.item-inner { display: flex; min-height: 90px; }
.item-thumb { width: 70px; flex-shrink: 0; background: var(--raised, var(--forge-raised)); overflow: hidden; }
.thumb-placeholder { width: 100%; min-height: 90px; display: flex; align-items: center; justify-content: center; }
.rarity-badge { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 999px; text-transform: capitalize; }
.rarity--common   { background: rgba(96,96,96,0.15);   color: var(--forge-secondary); border: 1px solid var(--forge-border); }
.rarity--uncommon { background: rgba(124,196,78,0.15); color: var(--forge-green);     border: 1px solid rgba(124,196,78,0.3); }
.rarity--rare     { background: rgba(107,159,232,0.15);color: #6b9fe8;               border: 1px solid rgba(107,159,232,0.3); }
.rarity--unique   { background: rgba(235,189,52,0.15); color: var(--forge-accent);   border: 1px solid rgba(235,189,52,0.3); }
.tag-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 999px; }
.tag--magic  { background: rgba(168,125,232,0.15); color: #a87de8; border: 1px solid rgba(168,125,232,0.3); }
.tag--curse  { background: rgba(224,85,85,0.15);   color: var(--forge-danger);      border: 1px solid rgba(224,85,85,0.3); }
.tag--secret { background: rgba(96,96,96,0.15);    color: var(--forge-muted);        border: 1px solid var(--forge-border); }

/* ── Note ────────────────────────────────────────────────────────── */
.note-inner { display: flex; min-height: 90px; }
.note-icon-col { width: 60px; flex-shrink: 0; border-right: 1px solid; display: flex; align-items: center; justify-content: center; }

/* ── Shared ──────────────────────────────────────────────────────── */
.card-body { padding: 11px 13px; display: flex; flex-direction: column; gap: 3px; }
.card-info { flex: 1; padding: 11px 13px; display: flex; flex-direction: column; gap: 2px; }
.card-name { font-size: 13px; font-weight: 600; color: var(--forge-text); line-height: 1.3; }
.card-role { font-size: 12px; color: var(--forge-secondary); }
.card-sub  { font-size: 11px; color: var(--forge-muted); }
.card-status { font-size: 11px; color: var(--forge-accent); font-style: italic; }
.card-preview { font-size: 11px; color: var(--forge-muted); line-height: 1.4; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-date { font-size: 10px; color: var(--forge-muted); opacity: 0.6; margin-top: auto; padding-top: 4px; }
.note-tag { font-size: 10px; padding: 1px 7px; border-radius: 999px; background: var(--raised, var(--forge-raised)); border: 1px solid var(--forge-border); color: var(--forge-muted); }

/* ── Actions overlay ─────────────────────────────────────────────── */
.card-actions { position: absolute; top: 7px; right: 7px; display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s; }
.act-icon { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: rgba(15,15,15,0.88); border: 1px solid var(--forge-border-l); color: var(--forge-secondary); cursor: pointer; transition: all 0.15s; }
.act-icon:hover { color: var(--forge-text); }
.act-icon--danger:hover { color: var(--forge-danger); border-color: rgba(224,85,85,0.4); }
</style>
