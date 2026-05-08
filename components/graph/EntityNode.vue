<template>
    <div
        class="en-node"
        :class="{ 'en-node--hovered': isHovered }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
    >
        <Handle
            id="top"
            type="target"
            :position="Position.Top"
            class="en-handle"
        />
        <Handle
            id="bottom"
            type="source"
            :position="Position.Bottom"
            class="en-handle"
        />

        <!-- Image header -->
        <div class="en-image" :style="{ borderColor: data.color + '66' }">
            <img
                v-if="data.imageUrl"
                :src="data.imageUrl"
                class="en-image-img"
            />
        </div>

        <!-- Body -->
        <div class="en-body">
            <div
                class="en-badge"
                :style="{
                    color: data.color,
                    borderColor: data.color + '44',
                    background: data.color + '11',
                }"
            >
                {{ data.type }}
            </div>
            <div class="en-name">{{ data.name }}</div>
            <div v-if="keyAttrs.length" class="en-attrs">
                <div v-for="[k, v] in keyAttrs" :key="k" class="en-attr">
                    <span class="en-attr-key">{{ formatKey(k) }}</span>
                    <span class="en-attr-val">{{ v }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";

const props = defineProps<{
    data: {
        entityId: number;
        name: string;
        type: string;
        color: string;
        imageUrl: string;
        attributes: Record<string, any>;
    };
}>();

const isHovered = ref(false);

const EXCLUDED_SUFFIXES = [
    "Source",
    "source",
    "Type",
    "type",
    "Content",
    "content",
];

const keyAttrs = computed(() => {
    const attrs = props.data.attributes ?? {};
    return Object.entries(attrs)
        .filter(
            ([k, v]) =>
                typeof v === "string" &&
                v.length > 0 &&
                !EXCLUDED_SUFFIXES.some((s) => k.endsWith(s)),
        )
        .slice(0, 4);
});

function formatKey(key: string): string {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
}
</script>

<style scoped>
.en-node {
    width: 200px;
    border-radius: var(--r2);
    border: 1px solid var(--border);
    background: var(--surface);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    overflow: hidden;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;
}
.en-node--hovered {
    border-color: var(--border-hi);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
}

.en-image {
    width: 100%;
    height: 80px;
    overflow: hidden;
    border-bottom: 1px solid;
    background: var(--bg2);
    display: flex;
    align-items: center;
    justify-content: center;
}
.en-image-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.en-body {
    padding: 8px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
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

.en-attr-key {
    color: var(--text3);
    flex-shrink: 0;
}

.en-attr-val {
    color: var(--text2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}

.en-handle {
    width: 20px !important;
    height: 10px !important;
    border-radius: 5px !important;
    background: var(--accent) !important;
    border: 2px solid var(--bg) !important;
}
</style>
