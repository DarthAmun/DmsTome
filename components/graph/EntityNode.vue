<template>
    <div
        class="en-node"
        :class="[`en-node--${data.type}`, { 'en-node--hovered': isHovered }]"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
    >
        <Handle id="top" type="target" :position="Position.Top" class="en-handle" />
        <Handle id="bottom" type="source" :position="Position.Bottom" class="en-handle" />

        <!-- Hover toolbar -->
        <div v-if="isHovered" class="en-toolbar" @click.stop @mousedown.stop>
            <button class="en-tb-btn" @click="data.onOpen?.()">Open</button>
            <button class="en-tb-btn" @click="data.onHide?.()">Hide</button>
            <button class="en-tb-btn en-tb-btn--danger" @click="data.onRemove?.()">Remove</button>
        </div>

        <!-- NPC: portrait on left, content on right -->
        <div v-if="data.type === 'npc'" class="en-inner en-inner--row">
            <div class="en-portrait" :style="{ borderColor: data.color + '66' }">
                <img v-if="data.imageUrl" :src="data.imageUrl" class="en-portrait-img" />
                <span v-else class="en-portrait-initial" :style="{ color: data.color }">
                    {{ data.name.charAt(0).toUpperCase() }}
                </span>
            </div>
            <div class="en-body">
                <div class="en-badge" :style="{ color: data.color, borderColor: data.color + '44', background: data.color + '11' }">{{ data.type }}</div>
                <div class="en-name">{{ data.name }}</div>
                <div v-if="keyAttrs.length" class="en-attrs">
                    <div v-for="[k, v] in keyAttrs" :key="k" class="en-attr">
                        <span class="en-attr-key">{{ formatKey(k) }}</span>
                        <span class="en-attr-val">{{ v }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- All other types: image on top, content below -->
        <div v-else class="en-inner">
            <div class="en-image" :style="{ borderColor: data.color + '66' }">
                <img v-if="data.imageUrl" :src="data.imageUrl" class="en-image-img" />
            </div>
            <div class="en-body">
                <div class="en-badge" :style="{ color: data.color, borderColor: data.color + '44', background: data.color + '11' }">{{ data.type }}</div>
                <div class="en-name">{{ data.name }}</div>
                <div v-if="keyAttrs.length" class="en-attrs">
                    <div v-for="[k, v] in keyAttrs" :key="k" class="en-attr">
                        <span class="en-attr-key">{{ formatKey(k) }}</span>
                        <span class="en-attr-val">{{ v }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

const props = defineProps<{
    data: {
        entityId: number
        name: string
        type: string
        color: string
        imageUrl: string
        attributes: Record<string, any>
        onOpen?: () => void
        onHide?: () => void
        onRemove?: () => void
    }
}>()

const isHovered = ref(false)

const EXCLUDED_SUFFIXES = ['Source', 'source', 'Type', 'type', 'Content', 'content']

const keyAttrs = computed(() => {
    const attrs = props.data.attributes ?? {}
    return Object.entries(attrs)
        .filter(([k, v]) =>
            typeof v === 'string' && v.length > 0 &&
            !EXCLUDED_SUFFIXES.some(s => k.endsWith(s))
        )
        .slice(0, 4)
})

function formatKey(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim()
}
</script>

<style scoped>
.en-node {
    width: 200px;
    border-radius: var(--r2);
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    transition: border-color 0.15s, box-shadow 0.15s;
    position: relative;
}
.en-node--npc { width: 240px; }
.en-node--hovered {
    border-color: var(--border-hi);
    box-shadow: 0 4px 16px rgba(0,0,0,0.28);
}

/* Inner wrapper clips content to rounded corners without clipping handles */
.en-inner {
    border-radius: var(--r2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.en-inner--row {
    flex-direction: row;
    height: 110px;
}

/* ── Hover toolbar ── */
.en-toolbar {
    position: absolute;
    top: -32px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r2);
    padding: 3px 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.28);
    z-index: 20;
    white-space: nowrap;
}
.en-tb-btn {
    font-size: 10px;
    font-weight: 600;
    color: var(--text2);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--r1);
    transition: background 0.1s, color 0.1s;
}
.en-tb-btn:hover { background: var(--surface-hi); color: var(--text); }
.en-tb-btn--danger:hover { color: var(--danger); background: var(--danger-bg, #3a1a1a); }

/* ── Handles ── */
.en-handle {
    width: 20px !important;
    height: 10px !important;
    border-radius: 5px !important;
    background: var(--accent) !important;
    border: 2px solid var(--bg) !important;
    opacity: 0.35;
    transition: opacity 0.15s;
}
.en-node--hovered .en-handle { opacity: 1; }

/* ── Image (top, non-NPC) ── */
.en-image {
    width: 100%;
    height: 80px;
    border-bottom: 1px solid;
    background: var(--bg2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.en-image-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

/* ── Portrait (left side, NPC) ── */
.en-portrait {
    width: 80px;
    flex-shrink: 0;
    border-right: 1px solid;
    background: var(--bg2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.en-portrait-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
}
.en-portrait-initial {
    font-size: 26px;
    font-weight: 700;
    opacity: 0.6;
}

/* ── Body ── */
.en-body {
    padding: 8px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}
.en-badge {
    display: inline-block;
    align-self: flex-start;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border: 1px solid;
    border-radius: var(--r4);
    padding: 1px 6px;
    margin-bottom: 2px;
}
.en-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.en-attrs {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
}
.en-attr {
    display: flex;
    gap: 5px;
    font-size: 10px;
    line-height: 1.3;
    min-width: 0;
}
.en-attr-key { color: var(--text3); flex-shrink: 0; }
.en-attr-val {
    color: var(--text2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}
</style>
