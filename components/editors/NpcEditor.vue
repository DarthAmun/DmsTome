<template>
    <div class="npc-editor">
        <EditorHeader
            v-if="entity"
            :entity="entity"
            :display-name="displayName"
            @delete="onDelete"
            @rename="onRename"
        >
            <template #actions>
                <button
                    class="hdr-btn"
                    :class="{ active: showAttributes }"
                    @click="showAttributes = !showAttributes"
                >
                    <OhVueIcon name="md-editnote" scale="0.8" />
                    <span>Attributes</span>
                </button>
                <button
                    class="hdr-btn"
                    title="Record Historical State"
                    @click="showCreateDialog = true"
                >
                    <OhVueIcon name="gi-backward-time" scale="0.8" />
                    <span>History</span>
                </button>
            </template>
        </EditorHeader>

        <div v-if="showAttributes && entity" class="attributes-pane">
            <AttributeEditor
                type="npc"
                :model-value="draftAttributes"
                @update:model-value="onAttributesChange"
            />
        </div>

        <MarkdownEditor
            v-if="entity"
            :entity-id="props.entityId"
            :campaign-id="props.campaignId"
            :content="draftContent"
            @update:content="onContentUpdate"
            @navigate="(t, n) => $emit('navigate', t, n)"
        >
            <template #above-editor>
                <SnapshotTimeline
                    v-if="snapshots.length > 0 || isHistoryMode"
                    :snapshots="snapshots"
                    :viewing-snapshot="viewingSnapshot"
                    @view-snapshot="onViewSnapshot"
                    @return-to-present="onReturnToPresent"
                    @create-snapshot="showCreateDialog = true"
                    @edit-snapshot="onEditSnapshot"
                />
                <NpcCard
                    :name="displayName"
                    :attrs="displayAttrs"
                    :color="typeColor"
                    class="npc-card-editor"
                />
            </template>
            <template #below-content>
                <LinkBar
                    :entity-id="props.entityId"
                    :campaign-id="props.campaignId"
                    entity-type="npc"
                    @navigate="(t, n) => $emit('navigate', t, n)"
                />
            </template>
        </MarkdownEditor>

        <SnapshotCreateDialog
            :open="showCreateDialog"
            :entity-id="props.entityId"
            :campaign-id="props.campaignId"
            @close="showCreateDialog = false"
            @created="onSnapshotCreated"
        />
        <SnapshotEditDialog
            :open="showEditDialog"
            :snapshot="editingSnapshot"
            :campaign-id="props.campaignId"
            @close="showEditDialog = false; editingSnapshot = null"
            @deleted="onSnapshotDeleted"
            @saved="onSnapshotSaved"
        />
    </div>
</template>

<script setup lang="ts">
import { useNotesStore } from "~/stores/notes";
import type { EntitySnapshot } from "~/stores/notes";
import type { EntityAttributes } from "~/types/entities";
import { ENTITY_TYPE_CONFIG } from "~/types/entities";

const props = defineProps<{ entityId: number; campaignId: number }>();
const emit = defineEmits<{
    navigate: [type: string, name: string];
    deleted: [];
}>();

const store = useNotesStore();
const router = useRouter();
const route = useRoute();

const entity = computed(
    () => store.entities.find((e) => e.id === props.entityId) ?? store.currentEntity,
);

const typeColor = ENTITY_TYPE_CONFIG.npc.color;

// ── Draft state ───────────────────────────────────────────────────────────────
const draftContent = ref("");
const draftAttributes = ref<EntityAttributes>({});
let attrSaveTimer: ReturnType<typeof setTimeout> | null = null;

// ── Attributes panel ──────────────────────────────────────────────────────────
const showAttributes = ref(false);

// ── Snapshot state ────────────────────────────────────────────────────────────
const viewingSnapshot = ref<EntitySnapshot | null>(null);
const isHistoryMode = computed(() => viewingSnapshot.value !== null);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editingSnapshot = ref<EntitySnapshot | null>(null);

const snapshots = computed(() =>
    store.snapshotsEntityId === entity.value?.id ? store.snapshots : [],
);

const displayName = computed(() =>
    isHistoryMode.value
        ? (viewingSnapshot.value?.name ?? entity.value?.name ?? "")
        : (entity.value?.name ?? ""),
);

const displayAttrs = computed(() => {
    if (isHistoryMode.value) return draftAttributes.value as any;
    return { ...((entity.value?.attributes as any) ?? {}), ...(draftAttributes.value as any) };
});

// ── Entity load ───────────────────────────────────────────────────────────────
watch(
    () => props.entityId,
    async (id) => {
        viewingSnapshot.value = null;
        showCreateDialog.value = false;
        showEditDialog.value = false;
        editingSnapshot.value = null;
        showAttributes.value = false;
        await store.loadEntity(id);
        draftContent.value = entity.value?.content ?? "";
        draftAttributes.value = { ...(entity.value?.attributes ?? {}) };
    },
    { immediate: true },
);

watch(
    () => entity.value?.id,
    async (id) => {
        if (!id) return
        await store.loadSnapshots(id)
        const snapId = Number(route.query.snap)
        if (snapId) {
            const snap = store.snapshots.find(s => s.id === snapId)
            if (snap) onViewSnapshot(snap)
        }
    },
    { immediate: true },
);

// ── Content / attribute saves ─────────────────────────────────────────────────
function onContentUpdate(value: string) {
    if (viewingSnapshot.value) {
        store.updateSnapshotContent(viewingSnapshot.value.id, { content: value });
    } else {
        store.updateEntity(props.entityId, { content: value });
    }
}

function onAttributesChange(attrs: EntityAttributes) {
    draftAttributes.value = attrs;
    if (attrSaveTimer) clearTimeout(attrSaveTimer);
    attrSaveTimer = setTimeout(() => {
        if (viewingSnapshot.value) {
            store.updateSnapshotContent(viewingSnapshot.value.id, { attributes: attrs });
        } else {
            store.updateEntity(props.entityId, { attributes: attrs });
        }
    }, 500);
}

async function onRename(name: string) {
    if (viewingSnapshot.value) {
        await store.updateSnapshotContent(viewingSnapshot.value.id, { name });
        viewingSnapshot.value = { ...viewingSnapshot.value, name };
    } else {
        await store.updateEntity(props.entityId, { name });
    }
}

async function onDelete() {
    await store.deleteEntity(props.entityId);
    emit("deleted");
}

// ── Snapshot handlers ─────────────────────────────────────────────────────────
watch(() => route.query.snap, (snapId) => {
    const id = snapId ? Number(snapId) : null
    if (!id) {
        if (viewingSnapshot.value) {
            viewingSnapshot.value = null
            draftContent.value = entity.value?.content ?? ''
            draftAttributes.value = { ...(entity.value?.attributes ?? {}) }
        }
        return
    }
    if (viewingSnapshot.value?.id === id) return
    const snap = store.snapshots.find(s => s.id === id)
    if (snap) {
        viewingSnapshot.value = snap
        draftContent.value = snap.content
        draftAttributes.value = { ...snap.attributes }
    }
})

function onViewSnapshot(snap: EntitySnapshot) {
    viewingSnapshot.value = snap;
    draftContent.value = snap.content;
    draftAttributes.value = { ...snap.attributes };
    router.replace({ query: { snap: snap.id } })
}

function onReturnToPresent() {
    viewingSnapshot.value = null;
    draftContent.value = entity.value?.content ?? "";
    draftAttributes.value = { ...(entity.value?.attributes ?? {}) };
    router.replace({ query: {} })
}

function onEditSnapshot(snap: EntitySnapshot) {
    editingSnapshot.value = snap;
    showEditDialog.value = true;
}

function onSnapshotCreated(_id: number) {
    viewingSnapshot.value = null;
}

function onSnapshotDeleted(id: number) {
    if (viewingSnapshot.value?.id === id) viewingSnapshot.value = null;
}

function onSnapshotSaved() {}
</script>

<style scoped>
.npc-editor {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.attributes-pane {
    flex-shrink: 0;
    overflow-y: auto;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border);
    max-height: 40vh;
}

.npc-card-editor {
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    box-shadow: none;
    flex-shrink: 0;
}

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
.hdr-btn:hover {
    border-color: var(--border-hi);
    background: var(--surface-hi);
}
.hdr-btn.active {
    background: var(--accent-bg);
    border-color: var(--accent);
    color: var(--accent-l);
}
</style>
