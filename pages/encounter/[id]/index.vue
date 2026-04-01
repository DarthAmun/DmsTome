<template>
  <div class="encounter-shell">
    <div class="enc-sheet enc-sheet-3"></div>
    <div class="enc-sheet enc-sheet-2"></div>
    <div
      class="encounter-page"
      :class="{ 'fog-paint-mode': activeTool === 'fog' || activeTool === 'measure' || activeTool === 'shapes' }"
    >
      <!-- ── Top toolbar ─────────────────────────────────────────────────────── -->
      <header class="encounter-toolbar">
        <div class="toolbar-left">
          <NuxtLink
            :to="
              encounter?.campaignId
                ? `/campaign/${encounter.campaignId}/encounters`
                : '/'
            "
            class="back-btn"
          >
            <OhVueIcon name="md-arrowback" scale="0.75" /> Back
          </NuxtLink>
          <div class="encounter-title">
            <input
              class="encounter-name-input"
              :value="encounter?.name"
              @blur="
                store.updateName(($event.target as HTMLInputElement).value)
              "
              @keyup.enter="($event.target as HTMLInputElement).blur()"
            />
          </div>
        </div>

        <div class="toolbar-right">
          <!-- Player window toggle -->
          <button
            class="back-btn"
            :class="{ 'back-btn--active': playerWindowOpen }"
            @click="togglePlayerWindow"
          >
            <OhVueIcon name="md-desktopmac" scale="0.85" />
            {{ playerWindowOpen ? "Close Player View" : "Open Player View" }}
          </button>
        </div>
      </header>

      <!-- ── Main layout ─────────────────────────────────────────────────────── -->
      <div class="encounter-layout">
        <!-- Left sidebar: Token library -->
        <aside class="encounter-sidebar left-sidebar">
          <div class="sidebar-section">
            <div class="sidebar-header">
              <span class="f-label">Token Library</span>
              <Button
                severity="secondary"
                size="small"
                @click="showAddToken = true"
              >
                <template #icon>
                  <OhVueIcon name="md-add" scale="0.8" /> </template
                >Add
              </Button>
            </div>

            <div class="token-search">
              <InputText v-model="tokenSearch" placeholder="Search tokens…" />
            </div>

            <!-- Draggable token list -->
            <div class="token-list">
              <div
                v-for="token in filteredLibrary"
                :key="token.id"
                class="token-chip"
                draggable="true"
                @dragstart="onTokenDragStart($event, token)"
              >
                <div class="token-thumb">
                  <img
                    v-if="token.imageSource"
                    :src="getImageUrl(token)"
                    class="enc-token-img"
                  />
                  <span v-else class="font-display text-amber-500 text-sm">{{
                    token.name.charAt(0)
                  }}</span>
                </div>
                <span class="token-lib-name">{{ token.name }}</span>
                <button
                  class="icon-btn-sq icon-btn-sq--danger"
                  @click.stop="removeFromLibrary(token.id)"
                >
                  <OhVueIcon name="md-close" scale="0.75" />
                </button>
              </div>
              <p
                v-if="filteredLibrary.length === 0"
                class="text-stone-500 text-sm text-center py-4"
              >
                No tokens yet
              </p>
            </div>
          </div>

          <!-- Grid settings -->
          <div class="sidebar-section">
            <div class="sidebar-header">
              <span class="f-label">Grid Settings</span>
            </div>
            <div class="space-y-2">
              <label class="f-label">Cell Size (px)</label>
              <input
                type="range"
                min="1"
                max="200"
                step="1"
                :value="encounter?.gridSize ?? 70"
                class="w-full accent-amber-500"
                @input="onGridSizeChange"
              />
              <div class="enc-grid-range-labels">
                <span>1px</span>
                <span style="color: var(--ink)"
                  >{{ encounter?.gridSize ?? 70 }}px</span
                >
                <span>200px</span>
              </div>

              <label class="f-label mt-2">Offset X</label>
              <InputNumber
                :model-value="encounter?.gridOffsetX ?? 0"
                @update:model-value="(val) => onOffsetChange('x', val)"
              />
              <label class="f-label">Offset Y</label>
              <InputNumber
                :model-value="encounter?.gridOffsetY ?? 0"
                @update:model-value="(val) => onOffsetChange('y', val)"
              />

              <Button
                severity="secondary"
                style="width: 100%; justify-content: center; margin-top: 6px"
                @click="onSetMap"
              >
                <OhVueIcon name="md-map" scale="0.85" />
                Load Map
              </Button>
            </div>
          </div>
        </aside>

        <!-- Centre: PixiJS Canvas -->
        <main
          class="encounter-canvas-wrapper"
          @dragover.prevent
          @drop="onCanvasDrop"
        >
          <div
            id="pixi-canvas"
            ref="canvasContainer"
            style="width: 100%; height: 100%"
          />

          <!-- Drop hint when no map -->
          <div v-if="!encounter?.mapSource" class="canvas-empty-state">
            <OhVueIcon name="md-map" scale="4" class="enc-empty-icon" />
            <p class="enc-empty-text">
              Drop a map image here or use the sidebar to load one
            </p>
          </div>

          <!-- Floating tool buttons -->
          <div class="map-tool-dock">
            <button
              class="map-tool-btn"
              :class="{ active: activeTool === 'fog' }"
              title="Fog of War"
              @click="toggleTool('fog')"
            >
              <OhVueIcon name="gi-fog" scale="1.1" />
            </button>
            <button
              class="map-tool-btn"
              :class="{ active: activeTool === 'measure' }"
              title="Ruler"
              @click="toggleTool('measure')"
            >
              <OhVueIcon name="gi-pencil-ruler" scale="1.1" />
            </button>
            <button
              class="map-tool-btn"
              :class="{ active: activeTool === 'shapes' }"
              title="Shape Overlays"
              @click="toggleTool('shapes')"
            >
              <OhVueIcon name="fa-shapes" scale="1.0" />
            </button>
          </div>
        </main>

        <!-- Right sidebar: Selected token / encounter tokens -->
        <aside class="encounter-sidebar right-sidebar">
          <!-- Active encounter tokens -->
          <div class="sidebar-section flex-1 overflow-y-auto">
            <div class="sidebar-header">
              <span class="f-label">On Map ({{ encounterTokens.length }})</span>
            </div>
            <div class="enc-token-list">
              <div
                v-for="token in sortedEncounterTokens"
                :key="token.id"
                class="encounter-token-row"
                @click="selectToken(token)"
              >
                <div class="token-thumb-sm">
                  <img
                    v-if="token.imageSource"
                    :src="getImageUrl(token)"
                    class="enc-token-img"
                  />
                  <span v-else class="enc-token-initial">{{
                    token.name.charAt(0)
                  }}</span>
                </div>
                <div class="enc-token-info">
                  <div class="enc-token-name">
                    {{ token.label || token.name }}
                  </div>
                  <div class="enc-token-sub">
                    <span v-if="token.hpMax" class="enc-token-hp">
                      HP {{ token.hpCurrent }}/{{ token.hpMax }}
                    </span>
                  </div>
                </div>
                <div class="enc-token-btns">
                  <button
                    class="icon-btn-sq"
                    :title="
                      token.isVisible ? 'Hide from players' : 'Show to players'
                    "
                    @click.stop="
                      store.updateToken(token.id, {
                        isVisible: !token.isVisible,
                      })
                    "
                  >
                    <OhVueIcon
                      :name="
                        token.isVisible ? 'md-visibility' : 'md-visibilityoff'
                      "
                      scale="0.85"
                    />
                  </button>
                  <button
                    class="icon-btn-sq"
                    :title="token.isDead ? 'Mark alive' : 'Mark dead'"
                    :class="token.isDead ? 'icon-btn-sq--danger' : ''"
                    @click.stop="
                      store.updateToken(token.id, { isDead: !token.isDead })
                    "
                  >
                    <OhVueIcon name="fa-skull-crossbones" scale="0.85" />
                  </button>
                  <button
                    class="icon-btn-sq icon-btn-sq--danger"
                    @click.stop="store.removeToken(token.id)"
                  >
                    <OhVueIcon name="md-delete" scale="0.85" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected token detail panel -->
          <div v-if="selectedToken" class="sidebar-section">
            <div class="sidebar-header">
              <span class="f-label">Selected Token</span>
              <Button
                severity="secondary"
                size="small"
                @click="selectedToken = null"
                >✕</Button
              >
            </div>
            <div class="space-y-2 text-sm">
              <div>
                <label class="f-label">Label</label>
                <InputText
                  :value="selectedToken.label || selectedToken.name"
                  @change="
                    store.updateToken(selectedToken!.id, {
                      label: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
              </div>
              <div class="enc-grid-2">
                <div>
                  <label class="f-label">HP Current</label>
                  <InputNumber
                    :model-value="selectedToken.hpCurrent"
                    @update:model-value="
                      (val) =>
                        store.updateToken(selectedToken!.id, { hpCurrent: val })
                    "
                  />
                </div>
                <div>
                  <label class="f-label">HP Max</label>
                  <InputNumber
                    :model-value="selectedToken.hpMax"
                    @update:model-value="
                      (val) =>
                        store.updateToken(selectedToken!.id, { hpMax: val })
                    "
                  />
                </div>
              </div>
              <div class="enc-grid-2">
                <div>
                  <label class="f-label">Initiative</label>
                  <InputNumber
                    :model-value="selectedToken.initiative"
                    @update:model-value="
                      (val) =>
                        store.updateToken(selectedToken!.id, {
                          initiative: val,
                        })
                    "
                  />
                </div>
                <div>
                  <label class="f-label">Size (tiles)</label>
                  <Select
                    :model-value="selectedToken.size"
                    :options="tokenSizeOptions"
                    option-label="label"
                    option-value="value"
                    @update:model-value="
                      store.updateToken(selectedToken!.id, { size: $event })
                    "
                  />
                </div>
              </div>

              <!-- Conditions -->
              <div>
                <label class="f-label block mb-1.5">Conditions</label>

                <!-- Active conditions -->
                <div class="enc-conditions-list">
                  <div
                    v-for="(cond, idx) in selectedToken.conditions"
                    :key="idx"
                    class="condition-tag"
                  >
                    <span>{{ cond.name }}</span>
                    <div
                      v-if="cond.value !== null"
                      class="condition-value-controls"
                    >
                      <button
                        class="cond-ctrl-btn"
                        @click="adjustConditionValue(idx, -1)"
                      >
                        −
                      </button>
                      <span>{{ cond.value }}</span>
                      <button
                        class="cond-ctrl-btn"
                        @click="adjustConditionValue(idx, 1)"
                      >
                        +
                      </button>
                    </div>
                    <button
                      class="condition-remove"
                      @click="removeCondition(idx)"
                    >
                      ✕
                    </button>
                  </div>
                  <span
                    v-if="selectedToken.conditions.length === 0"
                    class="enc-no-conditions"
                    >None</span
                  >
                </div>

                <!-- Add condition -->
                <div class="enc-add-condition">
                  <AutoComplete
                    v-model="newConditionName"
                    :suggestions="filteredConditions"
                    placeholder="Condition name…"
                    @complete="searchConditions"
                    @keyup.enter="addCondition"
                  />
                  <InputNumber v-model="newConditionValue" :min="1" />
                  <Button
                    severity="secondary"
                    size="small"
                    @click="addCondition"
                    >+</Button
                  >
                </div>
                <p class="enc-token-hp">
                  Leave value empty for conditions without a degree.
                </p>
              </div>

              <!-- Notes -->
              <div>
                <label class="f-label">Notes</label>
                <Textarea
                  :value="selectedToken.notes || ''"
                  placeholder="Anything to remember…"
                  :rows="3"
                  @change="
                    store.updateToken(selectedToken!.id, {
                      notes: ($event.target as HTMLTextAreaElement).value,
                    })
                  "
                />
              </div>
            </div>
          </div>

          <!-- Fog controls — only when fog tool active -->
          <div v-if="activeTool === 'fog'" class="sidebar-section">
            <div class="sidebar-header">
              <span class="f-label">Fog of War</span>
            </div>
            <!-- Mode toggle -->
            <div class="enc-grid-2" style="margin-bottom:8px">
              <button
                class="tool-option-btn"
                :class="{ active: fogMode === 'add' }"
                @click="fogMode = 'add'"
              >
                <OhVueIcon name="md-cloud" scale="0.8" /> Add
              </button>
              <button
                class="tool-option-btn"
                :class="{ active: fogMode === 'remove' }"
                @click="fogMode = 'remove'"
              >
                <OhVueIcon name="md-sunny" scale="0.8" /> Remove
              </button>
            </div>
            <!-- Brush size -->
            <label class="f-label">Brush Size: {{ fogBrushSize }}×{{ fogBrushSize }}</label>
            <input
              v-model.number="fogBrushSize"
              type="range" min="1" max="7" step="2"
              class="w-full accent-amber-500"
              style="margin-top:4px; margin-bottom:8px"
            />
            <div class="enc-grid-2">
              <button
                class="tool-option-btn"
                style="justify-content:center"
                @click="store.hideAllFog()"
              >Hide All</button>
              <button
                class="tool-option-btn"
                style="justify-content:center"
                @click="store.revealAllFog()"
              >Reveal All</button>
            </div>
            <p class="enc-hint">Click or drag to paint fog.</p>
          </div>

          <!-- Ruler hint — only when measure tool active -->
          <div v-if="activeTool === 'measure'" class="sidebar-section">
            <div class="sidebar-header">
              <span class="f-label">Ruler</span>
            </div>
            <p class="enc-hint">Click on the map to set the start point. Move to preview distance. Click again to clear.</p>
          </div>

          <!-- Shape overlays — only when shapes tool active -->
          <div v-if="activeTool === 'shapes'" class="sidebar-section">
            <div class="sidebar-header">
              <span class="f-label">Shape Overlays</span>
            </div>
            <!-- Shape type -->
            <label class="f-label" style="margin-bottom:4px">Type</label>
            <div class="enc-shape-types">
              <button class="tool-option-btn" :class="{ active: shapeType === 'circle' }" @click="shapeType = 'circle'">⬤ Circle</button>
              <button class="tool-option-btn" :class="{ active: shapeType === 'square' }" @click="shapeType = 'square'">■ Square</button>
              <button class="tool-option-btn" :class="{ active: shapeType === 'cone' }" @click="shapeType = 'cone'">▲ Cone</button>
            </div>
            <!-- Color -->
            <label class="f-label" style="margin-bottom:4px">Color</label>
            <input v-model="shapeColor" type="color" class="enc-color-input" />
            <p class="enc-hint" style="margin-top:6px">1st click: anchor (center/tip). 2nd click: edge/end. Right-click to cancel.</p>
            <!-- Placed shapes list -->
            <div v-if="shapes.length" style="margin-top:8px">
              <label class="f-label" style="margin-bottom:4px">Placed Shapes</label>
              <div
                v-for="s in shapes"
                :key="s.id"
                class="enc-shape-row"
              >
                <span class="enc-shape-dot" :style="{ background: shapeColor }" />
                <span class="enc-shape-label">{{ s.type }}</span>
                <button class="icon-btn-sq icon-btn-sq--danger" @click="removeShape(s.id)">
                  <OhVueIcon name="md-delete" scale="0.75" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- ── Add Token Modal ──────────────────────────────────────────────────── -->
      <Teleport to="body">
        <div
          v-if="showAddToken"
          class="modal-overlay"
          @click.self="showAddToken = false"
        >
          <div class="modal-box">
            <div class="modal-title">Add Token to Library</div>
            <div class="space-y-3">
              <div>
                <label class="f-label">Name</label>
                <InputText
                  v-model="newToken.name"
                  placeholder="Goblin, Wizard, etc."
                  autofocus
                />
              </div>
              <div>
                <label class="f-label">Image</label>
                <div class="enc-add-condition">
                  <InputText
                    v-model="newToken.imageSource"
                    placeholder="URL or file path"
                    class="flex-1"
                  />
                  <Button class="icon-btn-sq" @click="browseTokenImage">
                    <OhVueIcon name="fa-folder-open" scale="0.9" />
                  </Button>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <Button severity="secondary" @click="showAddToken = false"
                >Cancel</Button
              >
              <Button @click="confirmAddToken">Add Token</Button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
    <!-- end encounter-page -->
  </div>
  <!-- end encounter-shell -->
</template>

<script setup lang="ts">
import { useEncounterStore } from "~/stores/encounter";
import { useEncounterCanvas, type ShapeType, type ShapeOverlay } from "../../../composables/useEncounterCanvas";
import { dbApi } from "~/composables/useDb";

const route = useRoute();
const store = useEncounterStore();
const canvasContainer = ref<HTMLElement | null>(null);

const activeTool = ref<"select" | "fog" | "measure" | "shapes">("select");

// Fog tool state
const fogMode = ref<"add" | "remove">("add");
const fogBrushSize = ref(1);

// Shape tool state
const shapeType = ref<ShapeType>("circle");
const shapeColor = ref("#e84040");
const shapes = ref<ShapeOverlay[]>([]);

function hexToPixi(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

const tokenSizeOptions = [
  { label: "1×1 (medium)", value: 1 },
  { label: "2×2 (large)", value: 2 },
  { label: "3×3 (huge)", value: 3 },
  { label: "4×4 (gargantuan)", value: 4 },
];
const selectedToken = ref<any>(null);
const showAddToken = ref(false);
const tokenSearch = ref("");
const newToken = ref({
  name: "",
  imageSource: "",
  imageType: "file" as "file" | "url",
});

function toggleTool(tool: "fog" | "measure" | "shapes") {
  activeTool.value = activeTool.value === tool ? "select" : tool;
}

const encounter = computed(() => store.current);
const encounterTokens = computed(() => store.allTokens);
const sortedEncounterTokens = computed(() =>
  store.allTokens.sort((a, b) => {
    // Tokens with initiative set come first, sorted descending
    if (a.initiative === null && b.initiative === null) return 0;
    if (a.initiative === null) return 1;
    if (b.initiative === null) return -1;
    return b.initiative - a.initiative;
  }),
);
const playerWindowOpen = computed(() => store.playerWindowOpen);
const filteredLibrary = computed(() =>
  store.tokenLibrary.filter((t) =>
    t.name.toLowerCase().includes(tokenSearch.value.toLowerCase()),
  ),
);

let canvas: ReturnType<typeof useEncounterCanvas> | null = null;

const newConditionName = ref("");
const newConditionValue = ref<number | null>(null);
const filteredConditions = ref<string[]>([]);

function searchConditions(event: { query: string }) {
  const q = event.query.toLowerCase();
  filteredConditions.value = q
    ? conditionSuggestions.filter((c) => c.toLowerCase().includes(q))
    : [...conditionSuggestions];
}

const conditionSuggestions = [
  "Blinded",
  "Broken",
  "Clumsy",
  "Confused",
  "Controlled",
  "Dazzled",
  "Deafened",
  "Doomed",
  "Drained",
  "Dying",
  "Encumbered",
  "Enfeebled",
  "Fascinated",
  "Fatigued",
  "Flat-Footed",
  "Fleeing",
  "Frightened",
  "Grabbed",
  "Hidden",
  "Immobilized",
  "Invisible",
  "Observed",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Quickened",
  "Restrained",
  "Sickened",
  "Slowed",
  "Stunned",
  "Stupefied",
  "Unconscious",
  "Undetected",
  "Unnoticed",
  "Wounded",
];

function addCondition() {
  if (!selectedToken.value || !newConditionName.value.trim()) return;
  const current = [...selectedToken.value.conditions];
  current.push({
    name: newConditionName.value.trim(),
    value: newConditionValue.value ?? null,
  });
  store.updateToken(selectedToken.value.id, { conditions: current });
  newConditionName.value = "";
  newConditionValue.value = null;
}

function removeCondition(idx: number) {
  if (!selectedToken.value) return;
  const current = [...selectedToken.value.conditions];
  current.splice(idx, 1);
  store.updateToken(selectedToken.value.id, { conditions: current });
}

function adjustConditionValue(idx: number, delta: number) {
  if (!selectedToken.value) return;
  const current = [...selectedToken.value.conditions].map((c) => ({ ...c }));
  const cond = current[idx];
  if (cond.value === null) return;
  cond.value = cond.value + delta;
  if (cond.value <= 0) {
    current.splice(idx, 1);
  }
  store.updateToken(selectedToken.value.id, { conditions: current });
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  const id = Number(route.params.id);
  await store.loadEncounter(id);
  await store.loadTokenLibrary();

  if (!canvasContainer.value) return;

  canvas = useEncounterCanvas({
    container: canvasContainer.value,
    isDmMode: true,
    getActiveTool: () => activeTool.value,
    getFogMode: () => fogMode.value,
    getFogBrushSize: () => fogBrushSize.value,
    getShapeType: () => shapeType.value,
    getShapeColor: () => hexToPixi(shapeColor.value),
    onTokenMoved: (instanceId, gridX, gridY) => {
      store.moveToken(instanceId, gridX, gridY);
    },
    onFogToggle: (cellKey, newState) => {
      store.setFogCell(cellKey, newState);
      canvas?.redrawFog();
    },
    onShapeCommit: (anchorCol, anchorRow, endCol, endRow) => {
      addShape(anchorCol, anchorRow, endCol, endRow);
    },
  });

  await canvas.init();

  if (store.current?.mapSource) {
    await canvas.loadMap(store.current.mapSource, store.current.mapType);
  }
  await canvas.renderTokens();

  // Listen for player window close
  dbApi.window.onPlayerClosed(() => {
    store.playerWindowOpen = false;
  });
});

watch(
  () => store.current?.mapSource,
  async (src, old) => {
    if (src && src !== old && canvas) {
      await canvas.loadMap(src, store.current!.mapType);
    }
  },
);

watch(
  () => store.current?.tokens,
  async () => {
    await canvas?.renderTokens();
  },
  { deep: true },
);

watch(
  () => store.current?.fogData,
  () => {
    canvas?.redrawFog();
  },
  { deep: true },
);

watch(
  () => [
    store.current?.gridSize,
    store.current?.gridOffsetX,
    store.current?.gridOffsetY,
  ],
  () => {
    canvas?.drawGrid();
    canvas?.redrawFog();
  },
);

onUnmounted(() => canvas?.destroy());

// ── Handlers ───────────────────────────────────────────────────────────────
async function onSetMap() {
  const dataUrl = await dbApi.system.openFileDialog();
  if (dataUrl) await store.setMap(dataUrl, "file");
}

async function onGridSizeChange(e: Event) {
  const size = Number((e.target as HTMLInputElement).value);
  const enc = store.current;
  if (!enc) return;
  await store.updateGrid(size, enc.gridOffsetX, enc.gridOffsetY);
}

async function onOffsetChange(axis: "x" | "y", val: number | null) {
  if (val === null) return;
  const enc = store.current;
  if (!enc) return;
  if (axis === "x") await store.updateGrid(enc.gridSize, val, enc.gridOffsetY);
  else await store.updateGrid(enc.gridSize, enc.gridOffsetX, val);
}

let draggingTokenId: number | null = null;
function onTokenDragStart(e: DragEvent, token: any) {
  draggingTokenId = token.id;
  e.dataTransfer?.setData("tokenId", String(token.id));
}

async function onCanvasDrop(e: DragEvent) {
  if (!canvas || draggingTokenId === null) return;
  const { gridX, gridY } = canvas.getGridPosFromScreen(e.offsetX, e.offsetY);
  await store.addTokenToEncounter(draggingTokenId, gridX, gridY);
  draggingTokenId = null;
}

async function togglePlayerWindow() {
  if (playerWindowOpen.value) await store.closePlayerWindow();
  else await store.openPlayerWindow();
}

function selectToken(token: any) {
  selectedToken.value = token;
}

async function browseTokenImage() {
  const dataUrl = await dbApi.system.openFileDialog();
  if (dataUrl) {
    newToken.value.imageSource = dataUrl;
    newToken.value.imageType = "file";
  }
}

async function confirmAddToken() {
  if (!newToken.value.name.trim()) return;
  const type = newToken.value.imageSource.startsWith("http") ? "url" : "file"; // data: URLs are stored as 'file' type
  await store.addToLibrary(
    newToken.value.name,
    newToken.value.imageSource || null,
    type,
  );
  newToken.value = { name: "", imageSource: "", imageType: "file" };
  showAddToken.value = false;
}

function addShape(anchorCol: number, anchorRow: number, endCol: number, endRow: number) {
  const id = `shape-${Date.now()}`;
  const shape: ShapeOverlay = {
    id,
    type: shapeType.value,
    anchorCol,
    anchorRow,
    endCol,
    endRow,
    colorHex: hexToPixi(shapeColor.value),
  };
  shapes.value.push(shape);
  canvas?.addShapeOverlay(shape);
}

function removeShape(id: string) {
  shapes.value = shapes.value.filter((s: ShapeOverlay) => s.id !== id);
  canvas?.removeShapeOverlay(id);
}

// Clear ruler when switching away from measure tool
watch(activeTool, (tool: string) => {
  if (tool !== "measure") canvas?.clearRuler();
  if (tool !== "shapes") canvas?.clearShapeAnchor();
});

async function removeFromLibrary(id: number) {
  await dbApi.tokens.delete(id);
  store.tokenLibrary = store.tokenLibrary.filter((t) => t.id !== id);
}

function getImageUrl(token: any): string {
  if (!token.imageSource) return "";
  if (token.imageType === "url") return token.imageSource;
  return `${token.imageSource}`;
}
</script>

<style scoped>
/* ── Encounter VTT — parchment sidebars + dark canvas ── */

.encounter-shell {
  position: relative;
  width: 100%;
  height: 100vh;
  padding: 20px 28px;
  box-sizing: border-box;
  background: var(--leather);
  overflow: hidden;
}

.enc-sheet {
  position: absolute;
  border-radius: 2px;
  pointer-events: none;
}

/* Sheet 3 — furthest back, rotated right, slightly larger */
.enc-sheet-3 {
  inset: 18px 20px 12px 20px;
  background-color: #b8ac96;
  background-image: var(--paper);
  background-blend-mode: multiply;
  transform: rotate(1.4deg) translateX(10px);
  transform-origin: top center;
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.45);
}

/* Sheet 2 — middle, rotated left */
.enc-sheet-2 {
  inset: 18px 20px 12px 20px;
  background-color: #cdc09e;
  background-image: var(--paper);
  background-blend-mode: multiply;
  transform: rotate(-1.0deg) translateX(-8px);
  transform-origin: top center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.32);
}

.encounter-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  border-radius: 2px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.4);
}

/* ── Toolbar — parchment page header ── */
.encounter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 24px;
  flex-shrink: 0;
  background: var(--parch-dark);
  border-bottom: 1px solid var(--parch-line);
  position: relative;
  height: auto;
  padding-top: 12px;
  padding-bottom: 0;
  flex-direction: column;
  align-items: stretch;
}

/* Title row */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-tools {
  display: flex;
  gap: 3px;
}

/* Make toolbar a compact single row */
.encounter-toolbar {
  flex-direction: row;
  align-items: center;
  padding: 0 24px;
  height: 52px;
}

.page-rule-wrapper {
  position: absolute;
  bottom: 0;
  left: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  height: 12px;
}

.page-rule-wrapper::before {
  content: "✦";
  font-size: 10px;
  color: var(--gold);
  flex-shrink: 0;
  margin-right: 6px;
  line-height: 1;
}

.page-rule-wrapper::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--ink-faded), transparent);
}

.encounter-title {
  padding: 2px 14px;
  border-left: 1px solid var(--parch-line);
}

.encounter-name-input {
  font-family: var(--font-head);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 2px;
  padding: 2px 6px;
  outline: none;
  min-width: 120px;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.encounter-name-input:hover {
  border-color: var(--parch-line);
}
.encounter-name-input:focus {
  border-color: var(--ink-ghost);
  background: var(--parch-dark);
}

/* ── Main layout ── */
.encounter-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ── Parchment sidebars ── */
.encounter-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  overflow-y: auto;
}

.left-sidebar {
  border-right: 1px solid var(--parch-line);
}

.right-sidebar {
  border-left: 1px solid var(--parch-line);
}

/* Section headers — like chapter subheadings */
.sidebar-section {
  padding: 12px 14px;
  border-bottom: 1px dashed var(--parch-line);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

/* Labels — matches all other parchment pages */
.f-label {
  display: block;
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  margin-bottom: 5px;
}

/* Range labels row */
.enc-grid-range-labels {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-ui);
  font-size: 10px;
  color: var(--ink-ghost);
}

/* ── Token chip — unified style for both left and right sidebars ── */
.token-search {
  margin-bottom: 8px;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.enc-token-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Single shared token-row style */
.token-chip,
.encounter-token-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  background: transparent;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}

/* Left bar: draggable */
.token-chip {
  border: none;
  cursor: grab;
}

.token-chip:active {
  cursor: grabbing;
}

.token-chip:hover,
.encounter-token-row:hover {
  background: rgba(28, 20, 16, 0.04);
  padding-left: 10px;
  border-left-color: var(--ink-ghost);
}

.encounter-token-row.selected {
  background: rgba(139, 26, 26, 0.05);
  border-left-color: var(--blood);
  padding-left: 10px;
}

/* Unified token thumbnail */
.token-thumb,
.token-thumb-sm {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--parch-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

/* Token name — ink dark, IM Fell English */
.token-lib-name {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enc-token-info {
  flex: 1;
  min-width: 0;
}

.enc-token-name {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enc-token-sub {
  display: flex;
  align-items: center;
  gap: 6px;
}

.enc-token-hp {
  font-family: var(--font-head);
  font-size: 9px;
  color: var(--ink-ghost);
}

.enc-token-btns {
  display: flex;
  gap: 3px;
}

.enc-token-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.enc-token-initial {
  font-family: var(--font-head);
  font-size: 11px;
  color: var(--gold);
}

/* ── Canvas — dark, full remaining height ── */
.encounter-canvas-wrapper {
  flex: 1;
  min-width: 0;
  min-height: 0;
  /* crucial: flex children need min-height:0 to shrink */
  position: relative;
  overflow: hidden;
  background: #050310;
}

.canvas-empty-state {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.enc-empty-icon {
  opacity: 0.12;
  margin-bottom: 14px;
}

.enc-empty-text {
  font-family: var(--font-body);
  font-size: 15px;
  color: #4a3a5a;
  font-style: italic;
}

/* ── Grid helpers ── */
.enc-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.space-y-1 {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.space-y-2 {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mt-2 {
  margin-top: 6px;
}

.flex-1 {
  flex: 1;
}

.min-w-0 {
  min-width: 0;
}

.w-full {
  width: 100%;
}

.justify-center {
  justify-content: center;
}

/* ── Conditions ── */
.enc-conditions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.enc-no-conditions {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-ghost);
  font-style: italic;
}

.enc-add-condition {
  display: flex;
  gap: 6px;
  align-items: center;
}

.enc-hint {
  font-family: var(--font-ui);
  font-size: 10px;
  color: var(--ink-ghost);
  margin-top: 4px;
  line-height: 1.5;
}

.condition-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1px solid var(--arcane);
  color: var(--arcane-l);
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.condition-value-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.cond-ctrl-btn {
  background: none;
  border: none;
  color: var(--arcane-l);
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
  line-height: 1;
}

.condition-remove {
  background: none;
  border: none;
  color: var(--ink-ghost);
  cursor: pointer;
  font-size: 10px;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}

.condition-remove:hover {
  color: var(--blood);
}

/* ── Add Token modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 3, 8, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  padding: 24px;
  width: 420px;
  max-width: 92vw;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-family: var(--font-head);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink);
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--parch-line);
}

/* Fog / measure / shapes cursor */
.fog-paint-mode { cursor: crosshair; }

/* ── Floating tool dock ── */
.map-tool-dock {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(12, 8, 4, 0.72);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(232, 220, 197, 0.12);
  border-radius: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  pointer-events: all;
  z-index: 20;
}

.map-tool-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(232, 220, 197, 0.15);
  background: rgba(232, 220, 197, 0.06);
  color: rgba(232, 220, 197, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.map-tool-btn:hover {
  background: rgba(232, 220, 197, 0.14);
  color: rgba(232, 220, 197, 0.9);
  border-color: rgba(232, 220, 197, 0.35);
}
.map-tool-btn.active {
  background: rgba(184, 134, 11, 0.25);
  color: var(--gold);
  border-color: var(--gold);
  box-shadow: 0 0 10px rgba(184,134,11,0.3);
}

/* Tool option buttons (fog mode, shape type) */
.tool-option-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  padding: 4px 6px;
  border-radius: 2px;
  border: 1px solid var(--parch-line);
  background: rgba(28,20,16,0.04);
  color: var(--ink-ghost);
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}
.tool-option-btn:hover { border-color: var(--ink-faded); color: var(--ink); }
.tool-option-btn.active { border-color: var(--gold); color: var(--gold); background: rgba(184,134,11,0.08); }

/* Shape type row — 3 buttons */
.enc-shape-types { display: flex; gap: 4px; margin-bottom: 2px; }

/* Color picker */
.enc-color-input {
  width: 100%;
  height: 28px;
  border: 1px solid var(--parch-line);
  border-radius: 2px;
  padding: 2px;
  background: transparent;
  cursor: pointer;
}

/* Placed shapes list */
.enc-shape-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid var(--parch-line);
}
.enc-shape-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0.8;
}
.enc-shape-label {
  flex: 1;
  font-family: var(--font-head);
  font-size: 10px;
  color: var(--ink);
  text-transform: capitalize;
}
</style>
