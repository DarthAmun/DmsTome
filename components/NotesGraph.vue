<template>
    <div class="graph-container">
        <!-- Toolbar -->
        <div class="graph-toolbar">
            <!-- Entity search -->
            <div class="graph-search" ref="searchWrapRef">
                <input
                    v-model="searchQuery"
                    class="graph-search-input"
                    placeholder="Add entity to graph…"
                    @input="onSearchInput"
                    @focus="onSearchInput"
                />
                <div
                    v-if="searchResults.length > 0"
                    class="graph-search-dropdown"
                >
                    <div
                        v-for="entity in searchResults"
                        :key="entity.id"
                        class="graph-search-item"
                        @mousedown.prevent="
                            addEntityToGraph(entity);
                            searchQuery = '';
                            searchResults = [];
                        "
                    >
                        <span
                            class="gsi-type"
                            :style="{ color: typeColor(entity.type) }"
                            >{{ entity.type }}</span
                        >
                        {{ entity.name }}
                    </div>
                </div>
            </div>

            <!-- Type filters -->
            <div class="type-filters">
                <button
                    v-for="t in typeTabs"
                    :key="t.type"
                    class="type-filter-btn"
                    :class="{ active: visibleTypes.has(t.type) }"
                    :style="
                        visibleTypes.has(t.type)
                            ? {
                                  borderColor: t.color,
                                  color: t.color,
                                  background: t.color + '18',
                              }
                            : {}
                    "
                    @click="toggleType(t.type)"
                >
                    <span
                        class="legend-dot"
                        :style="{
                            background: visibleTypes.has(t.type)
                                ? t.color
                                : 'var(--text3)',
                        }"
                    />
                    {{ t.plural }}
                </button>
            </div>

            <div class="graph-toolbar-right">
                <button
                    class="toolbar-btn"
                    :class="{ active: showMentions }"
                    @click="toggleMentions"
                    title="Toggle mention edges"
                >
                    <OhVueIcon name="md-link" scale="0.8" />
                    Mentions
                </button>
                <button
                    class="toolbar-btn"
                    :class="{ active: showHiddenPanel }"
                    @click="showHiddenPanel = !showHiddenPanel"
                >
                    <OhVueIcon name="md-visibilityoff" scale="0.8" />
                    Hidden ({{ hiddenNodes.size }})
                </button>
                <button class="toolbar-btn" @click="fitGraph" title="Fit view">
                    <OhVueIcon name="md-fitscreen" scale="0.8" />
                    Fit
                </button>
            </div>
        </div>

        <!-- Vue Flow canvas -->
        <div class="graph-canvas-wrapper">
            <VueFlow
                v-model:nodes="nodes"
                v-model:edges="edges"
                :node-types="nodeTypes"
                :default-edge-options="{ type: 'smoothstep', animated: false }"
                :delete-key-code="null"
                @pane-ready="onPaneReady"
                @connect="onConnect"
                @node-drag-stop="onNodeDragStop"
                @move-end="onMoveEnd"
                @node-double-click="onNodeDoubleClick"
                @edge-context-menu="onEdgeContextMenu"
                :snap-to-grid="true"
                :snap-grid="[10, 10]"
            >
                <Background pattern-color="var(--text)" :gap="20" />
                <Controls />
            </VueFlow>
        </div>

        <!-- Hidden nodes panel -->
        <HiddenNodesPanel
            :open="showHiddenPanel"
            :hidden-entities="hiddenEntities"
            @close="showHiddenPanel = false"
            @show-node="onShowNode"
        />

        <!-- Connection modal -->
        <ConnectionModal
            :open="connModal.show"
            :connection="connModal.connection"
            :source-name="connModal.sourceName"
            :target-name="connModal.targetName"
            @close="connModal.show = false"
            @saved="onConnectionSaved"
            @deleted="onConnectionDeleted"
        />
    </div>
</template>

<script setup lang="ts">
import {
    VueFlow,
    type Node,
    type Edge,
    type Connection,
    type VueFlowStore,
} from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { useNotesStore, type Entity } from "~/stores/notes";
import { ENTITY_TYPE_CONFIG } from "~/types/entities";
import { dbApi, type DbEntityConnection } from "~/composables/useDb";
import EntityNode from "~/components/graph/EntityNode.vue";
import { markRaw } from "vue";
import {
    GiScrollUnfurled,
    GiBookAura,
    GiDeathNote,
    GiMagicHat,
    GiHouseKeys,
    GiSandsOfTime,
    GiAllSeeingEye,
    GiCastle,
    GiCoins,
    GiBroadsword,
} from "oh-vue-icons/icons/gi";

const props = defineProps<{ campaignId: number }>();
const emit = defineEmits<{ navigate: [type: string, name: string] }>();

const store = useNotesStore();
let flowApi: VueFlowStore | null = null;

function onPaneReady(api: VueFlowStore) {
    flowApi = api;
}

// ── Node type registration ────────────────────────────────────────────────────
const nodeTypes = { entity: markRaw(EntityNode) };

// ── Reactive state ────────────────────────────────────────────────────────────
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const positions = ref<Record<number, { x: number; y: number }>>({});
const hiddenNodes = ref<Set<number>>(new Set());
const visibleTypes = ref<Set<string>>(new Set(Object.keys(ENTITY_TYPE_CONFIG)));
const showMentions = ref(true);
const showHiddenPanel = ref(false);
const connections = ref<DbEntityConnection[]>([]);
const imageCache = new Map<string, string>();

const searchQuery = ref("");
const searchResults = ref<Entity[]>([]);
const searchWrapRef = ref<HTMLElement | null>(null);

const connModal = ref({
    show: false,
    connection: null as DbEntityConnection | null,
    sourceName: "",
    targetName: "",
});

let viewportZoom = 1;
let viewportX = 0;
let viewportY = 0;
let layoutSaveTimer: ReturnType<typeof setTimeout> | null = null;

// ── Type config helpers ───────────────────────────────────────────────────────
const typeTabs = Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => ({
    type,
    ...cfg,
}));

function typeColor(type: string): string {
    return (ENTITY_TYPE_CONFIG as any)[type]?.color ?? "var(--text3)";
}

// ── Icon registry for SVG fallback ───────────────────────────────────────────
const iconRegistry: Record<string, any> = {
    "gi-scroll-unfurled": GiScrollUnfurled,
    "gi-book-aura": GiBookAura,
    "gi-death-note": GiDeathNote,
    "gi-magic-hat": GiMagicHat,
    "gi-house-keys": GiHouseKeys,
    "gi-sands-of-time": GiSandsOfTime,
    "gi-all-seeing-eye": GiAllSeeingEye,
    "gi-castle": GiCastle,
    "gi-coins": GiCoins,
    "gi-broadsword": GiBroadsword,
};

function makeInitialDataUrl(color: string, initial: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="21" fill="#1e1e1e" stroke="${color}" stroke-width="1.5"/>
    <text x="22" y="28" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="${color}">${initial}</text>
  </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function makeOhIconDataUrl(iconName: string, color: string): string | null {
    const icon = iconRegistry[iconName];
    if (!icon?.raw) return null;
    const iconSize = 28;
    const offset = (44 - iconSize) / 2;
    const scaleX = iconSize / icon.width;
    const scaleY = iconSize / icon.height;
    const translateX = offset - icon.minX * scaleX;
    const translateY = offset - icon.minY * scaleY;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="21" fill="#1e1e1e" stroke="${color}" stroke-width="1.5"/>
    <g transform="translate(${translateX},${translateY}) scale(${scaleX},${scaleY})" fill="${color}">
      ${icon.raw}
    </g>
  </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

async function getNodeImage(entity: Entity): Promise<string> {
    const attrs = entity.attributes ?? {};
    const color = typeColor(entity.type);
    if (entity.type === "note" && (attrs as any).icon) {
        const url = makeOhIconDataUrl((attrs as any).icon, color);
        if (url) return url;
    }
    const imageSrc =
        (attrs as any).portraitSource || (attrs as any).imageSource;
    if (imageSrc) return imageSrc;
    return makeInitialDataUrl(color, entity.name.charAt(0).toUpperCase());
}

function imageCacheKey(entity: Entity): string {
    const attrs = entity.attributes ?? {};
    return `${entity.id}:${(attrs as any).portraitSource || (attrs as any).imageSource || (attrs as any).icon || ""}`;
}

// ── Computed helpers ──────────────────────────────────────────────────────────
const canvasEntityIds = computed(
    () => new Set(Object.keys(positions.value).map(Number)),
);

const hiddenEntities = computed(() =>
    store.entities.filter((e) => hiddenNodes.value.has(e.id!)),
);

// ── Build helpers ─────────────────────────────────────────────────────────────
function buildNode(entity: Entity, position: { x: number; y: number }, imageUrl: string): Node {
    const entityId = entity.id!
    return {
        id: String(entityId),
        type: 'entity',
        position,
        data: {
            entityId,
            name: entity.name,
            type: entity.type,
            color: typeColor(entity.type),
            imageUrl,
            attributes: entity.attributes ?? {},
            onOpen: () => emit('navigate', entity.type, entity.name),
            onHide: () => {
                hiddenNodes.value = new Set([...hiddenNodes.value, entityId])
                nodes.value = nodes.value.filter(n => Number(n.id) !== entityId)
                edges.value = buildEdges()
                scheduleLayoutSave()
            },
            onRemove: () => {
                const { [entityId]: _dropped, ...rest } = positions.value
                positions.value = rest
                nodes.value = nodes.value.filter(n => Number(n.id) !== entityId)
                edges.value = buildEdges()
                scheduleLayoutSave()
            },
        },
        hidden: !visibleTypes.value.has(entity.type),
    }
}

function buildEdges(): Edge[] {
    const result: Edge[] = [];
    const onCanvasIds = new Set(
        store.entities
            .filter(
                (e) =>
                    canvasEntityIds.value.has(e.id!) &&
                    !hiddenNodes.value.has(e.id!),
            )
            .map((e) => e.id!),
    );
    const explicitPairs = new Set<string>();

    for (const conn of connections.value) {
        if (
            !onCanvasIds.has(conn.source_entity_id) ||
            !onCanvasIds.has(conn.target_entity_id)
        )
            continue;
        explicitPairs.add(`${conn.source_entity_id}-${conn.target_entity_id}`);
        explicitPairs.add(`${conn.target_entity_id}-${conn.source_entity_id}`);

        const edgeStyle: Record<string, any> = {};
        if (conn.color) edgeStyle.stroke = conn.color;

        const markerEnd =
            conn.direction !== "none" ? { type: "arrowclosed" } : undefined;
        const markerStart =
            conn.direction === "two-way" ? { type: "arrowclosed" } : undefined;

        result.push({
            id: `conn-${conn.id}`,
            type: conn.edgeType ?? 'smoothstep',
            source: String(conn.source_entity_id),
            target: String(conn.target_entity_id),
            label: conn.label || undefined,
            style: edgeStyle,
            markerEnd,
            markerStart,
            data: { isExplicit: true, connectionId: conn.id },
        } as Edge);
    }

    if (showMentions.value) {
        for (const link of store.links) {
            const sourceEntity = store.entities.find(
                (e) => e.id === link.sourceId,
            );
            if (!sourceEntity || !onCanvasIds.has(sourceEntity.id!)) continue;
            const targetEntity = store.findByTypeAndName(
                link.targetType,
                link.targetName,
            );
            if (!targetEntity || !onCanvasIds.has(targetEntity.id!)) continue;
            const pairKey = `${sourceEntity.id}-${targetEntity.id}`;
            if (explicitPairs.has(pairKey)) continue;
            result.push({
                id: `mention-${link.sourceId}-${link.targetType}-${link.targetName}`,
                source: String(sourceEntity.id),
                target: String(targetEntity.id),
                style: { strokeDasharray: "5,5", stroke: "var(--text3)" },
                selectable: false,
                focusable: false,
                data: { isExplicit: false },
            } as Edge);
        }
    }

    return result;
}

async function rebuildGraph() {
    const canvasEnts = store.entities.filter(
        (e) =>
            canvasEntityIds.value.has(e.id!) && !hiddenNodes.value.has(e.id!),
    );
    await Promise.all(
        canvasEnts.map(async (entity) => {
            const key = imageCacheKey(entity);
            if (!imageCache.has(key)) {
                imageCache.set(key, await getNodeImage(entity));
            }
        }),
    );
    nodes.value = canvasEnts.map((e) =>
        buildNode(
            e,
            positions.value[e.id!],
            imageCache.get(imageCacheKey(e)) ?? "",
        ),
    );
    edges.value = buildEdges();
}

// ── Add entity to graph ───────────────────────────────────────────────────────
async function addEntityToGraph(entity: Entity) {
    const entityId = entity.id!;
    if (canvasEntityIds.value.has(entityId)) return;
    hiddenNodes.value.delete(entityId);
    positions.value = {
        ...positions.value,
        [entityId]: {
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
        },
    };
    await rebuildGraph();
    scheduleLayoutSave();
}

// ── Search ────────────────────────────────────────────────────────────────────
function onSearchInput() {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) {
        searchResults.value = [];
        return;
    }
    searchResults.value = store.entities
        .filter(
            (e) =>
                e.campaignId === props.campaignId &&
                !canvasEntityIds.value.has(e.id!) &&
                e.name.toLowerCase().includes(q),
        )
        .slice(0, 8);
}

// ── Type visibility ───────────────────────────────────────────────────────────
function toggleType(type: string) {
    const next = new Set(visibleTypes.value);
    if (next.has(type)) {
        if (next.size === 1) return;
        next.delete(type);
    } else next.add(type);
    visibleTypes.value = next;
    nodes.value = nodes.value.map((n) => ({
        ...n,
        hidden: !next.has(n.data.type),
    }));
}

// ── Mentions toggle ───────────────────────────────────────────────────────────
function toggleMentions() {
    showMentions.value = !showMentions.value;
    edges.value = buildEdges();
}

// ── Events ────────────────────────────────────────────────────────────────────
async function onConnect(conn: Connection) {
    const sourceId = Number(conn.source);
    const targetId = Number(conn.target);
    if (!sourceId || !targetId || sourceId === targetId) return;
    const newConn = await dbApi.connections.add({
        campaign_id: props.campaignId,
        source_entity_id: sourceId,
        target_entity_id: targetId,
        label: "",
        direction: "one-way",
        color: null,
    });
    connections.value = [...connections.value, newConn];
    edges.value = buildEdges();
}

function onNodeDragStop(event: {
    event: MouseEvent;
    node: Node;
    nodes: Node[];
}) {
    const { node } = event;
    positions.value = {
        ...positions.value,
        [Number(node.id)]: node.position,
    };
    scheduleLayoutSave();
}

function onMoveEnd({
    flowTransform,
}: {
    flowTransform: { x: number; y: number; zoom: number };
}) {
    viewportZoom = flowTransform.zoom;
    viewportX = flowTransform.x;
    viewportY = flowTransform.y;
    scheduleLayoutSave();
}

function onNodeDoubleClick(event: { node: Node }) {
    const entity = store.entities.find((e) => e.id === Number(event.node.id));
    if (entity) emit("navigate", entity.type, entity.name);
}

function onEdgeContextMenu(event: { event: MouseEvent; edge: Edge }) {
    event.event.preventDefault();
    if (!event.edge.data?.isExplicit) return;
    const conn = connections.value.find(
        (c) => c.id === event.edge.data.connectionId,
    );
    if (!conn) return;
    const src = store.entities.find((e) => e.id === conn.source_entity_id);
    const tgt = store.entities.find((e) => e.id === conn.target_entity_id);
    connModal.value = {
        show: true,
        connection: conn,
        sourceName: src?.name ?? "",
        targetName: tgt?.name ?? "",
    };
}

// ── Show hidden node ──────────────────────────────────────────────────────────
async function onShowNode(entityId: number) {
    hiddenNodes.value = new Set(
        [...hiddenNodes.value].filter((id) => id !== entityId),
    );
    if (!positions.value[entityId]) {
        positions.value = {
            ...positions.value,
            [entityId]: {
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
            },
        };
    }
    await rebuildGraph();
    scheduleLayoutSave();
}

// ── Connection modal ──────────────────────────────────────────────────────────
async function onConnectionSaved(updated: DbEntityConnection) {
    if (!updated.id) return;
    await dbApi.connections.update(updated.id, {
        label: updated.label,
        direction: updated.direction,
        color: updated.color,
        edgeType: updated.edgeType,
    });
    connections.value = connections.value.map((c) =>
        c.id === updated.id ? updated : c,
    );
    edges.value = buildEdges();
    connModal.value.show = false;
}

async function onConnectionDeleted(id: number) {
    await dbApi.connections.delete(id);
    connections.value = connections.value.filter((c) => c.id !== id);
    edges.value = buildEdges();
    connModal.value.show = false;
}

// ── Layout persistence ────────────────────────────────────────────────────────
function scheduleLayoutSave() {
    if (layoutSaveTimer) clearTimeout(layoutSaveTimer);
    layoutSaveTimer = setTimeout(saveLayout, 1000);
}

async function saveLayout() {
    await dbApi.graphLayout.save({
        campaign_id: props.campaignId,
        positions: JSON.stringify(positions.value),
        hidden_nodes: JSON.stringify([...hiddenNodes.value]),
        zoom: viewportZoom,
        pan_x: viewportX,
        pan_y: viewportY,
    });
}

function fitGraph() {
    flowApi?.fitView({ padding: 0.1 })
}

// ── Mount ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
    if (!store.entities.length) await store.loadAll(props.campaignId);

    const [layout, conns] = await Promise.all([
        dbApi.graphLayout.get(props.campaignId),
        dbApi.connections.list(props.campaignId),
    ]);

    connections.value = conns;

    if (layout) {
        positions.value = JSON.parse(layout.positions);
        hiddenNodes.value = new Set(JSON.parse(layout.hidden_nodes));
        viewportZoom = layout.zoom;
        viewportX = layout.pan_x;
        viewportY = layout.pan_y;
    }

    await rebuildGraph()
    if (layout && flowApi) {
        await nextTick()
        flowApi.setViewport({ x: viewportX, y: viewportY, zoom: viewportZoom })
    }
})

// Watch for entity/link changes
watch([() => store.entities.length, () => store.links.length], () => {
    rebuildGraph();
});

onUnmounted(() => {
    if (layoutSaveTimer) clearTimeout(layoutSaveTimer);
});
</script>

<style scoped>
.graph-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    position: relative;
    overflow: hidden;
}

.graph-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    flex-wrap: wrap;
    position: relative;
    z-index: 10;
}

.graph-toolbar-right {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
}

.graph-search {
    position: relative;
    flex-shrink: 0;
}

.graph-search-input {
    width: 200px;
    height: 28px;
    padding: 0 10px;
    border-radius: var(--r1);
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: 12px;
    outline: none;
    transition: border-color 0.12s;
}
.graph-search-input:focus {
    border-color: var(--accent);
}

.graph-search-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 240px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
    z-index: 100;
    overflow: hidden;
}

.graph-search-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;
    color: var(--text);
    cursor: pointer;
    transition: background 0.1s;
}
.graph-search-item:hover {
    background: var(--surface-hi);
}

.gsi-type {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    flex-shrink: 0;
}

.type-filters {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
}

.type-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 9px;
    border-radius: 999px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text3);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s;
}
.type-filter-btn:hover {
    color: var(--text2);
}

.legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.toolbar-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: var(--r1);
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text2);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.12s;
    flex-shrink: 0;
}
.toolbar-btn:hover {
    border-color: var(--border-hi);
    background: var(--surface-hi);
}
.toolbar-btn.active {
    background: var(--accent-bg);
    border-color: var(--accent);
    color: var(--accent-l);
}

.graph-canvas-wrapper {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
}

</style>
