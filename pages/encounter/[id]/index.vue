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
                  <span v-else class="enc-token-initial">{{
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
                class="enc-hint"
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
            <div class="enc-grid-col">
              <label class="f-label">Cell Size (px)</label>
              <input
                type="range"
                min="1"
                max="200"
                step="1"
                :value="encounter?.gridSize ?? 70"
                class="enc-range"
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
          <!-- Tab switcher -->
          <div class="rsb-tabs">
            <button class="rsb-tab" :class="{ 'rsb-tab--active': rightTab === 'tokens' }" @click="rightTab = 'tokens'">Tokens</button>
            <button class="rsb-tab" :class="{ 'rsb-tab--active': rightTab === 'log' }" @click="rightTab = 'log'">Log</button>
          </div>

          <!-- ── Tokens tab ──────────────────────────────────────────────── -->
          <template v-if="rightTab === 'tokens'">
          <!-- Active encounter tokens + initiative tracker -->
          <div class="sidebar-section flex-1 overflow-y-auto">
            <div class="sidebar-header">
              <span class="f-label">On Map ({{ encounterTokens.length }})</span>
            </div>
            <!-- Round counter + prev/next turn -->
            <div class="initiative-bar">
              <button class="init-nav-btn" @click="store.prevTurn()">
                <OhVueIcon name="md-chevronleft" scale="0.8" />
              </button>
              <span class="init-round-label">Round {{ store.roundNumber }}</span>
              <button class="init-nav-btn" @click="store.nextTurn()">
                <OhVueIcon name="md-chevronright" scale="0.8" />
              </button>
            </div>
            <div class="enc-token-cards">
              <div
                v-for="token in sortedEncounterTokens"
                :key="token.id"
                class="token-card"
                :class="{
                  'token-card--selected': selectedToken?.id === token.id,
                  'token-card--active': token.id === currentTurnTokenId,
                  'token-card--dead': token.isDead,
                  'token-card--hidden': !token.isVisible,
                }"
                @click="selectToken(token)"
              >
                <!-- Row 1: avatar + name + initiative -->
                <div class="token-card-top">
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
                  <span class="token-card-name">{{ token.label || token.name }}</span>
                  <span class="token-card-init" :class="{ 'token-card-init--set': token.initiative !== null }">
                    {{ token.initiative !== null ? `⚡${token.initiative}` : '—' }}
                  </span>
                </div>
                <!-- Row 2: HP + action buttons -->
                <div class="token-card-bottom">
                  <span v-if="token.hpMax" class="enc-token-hp">
                    HP {{ token.hpCurrent }}/{{ token.hpMax }}
                  </span>
                  <span v-else class="enc-token-hp" style="opacity:0.3">no HP</span>
                  <div class="token-card-btns">
                    <button
                      class="icon-btn-sq"
                      :title="token.isVisible ? 'Hide from players' : 'Show to players'"
                      @click.stop="store.updateToken(token.id, { isVisible: !token.isVisible })"
                    >
                      <OhVueIcon :name="token.isVisible ? 'md-visibility' : 'md-visibilityoff'" scale="0.8" />
                    </button>
                    <button
                      class="icon-btn-sq"
                      :title="token.isDead ? 'Mark alive' : 'Mark dead'"
                      :class="token.isDead ? 'icon-btn-sq--danger' : ''"
                      @click.stop="store.updateToken(token.id, { isDead: !token.isDead })"
                    >
                      <OhVueIcon name="fa-skull-crossbones" scale="0.8" />
                    </button>
                    <button
                      class="icon-btn-sq icon-btn-sq--danger"
                      @click.stop="store.removeToken(token.id)"
                    >
                      <OhVueIcon name="md-delete" scale="0.8" />
                    </button>
                  </div>
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
            <div class="enc-token-detail">
              <!-- Linked record badge -->
              <div v-if="selectedToken.linkedRecordId && selectedTokenLinkedName" class="enc-linked-record">
                <button class="enc-linked-btn" @click="openRecordPanel(selectedToken.linkedRecordId)">
                  📖 {{ selectedTokenLinkedName }}
                </button>
                <button class="enc-linked-unlink" title="Unlink record"
                  @click="store.updateToken(selectedToken.id, { linkedRecordId: null })">✕</button>
              </div>
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
                    <span class="condition-tag-name" @click="openConditionPanel(cond.name, cond.value)">{{ cond.name }}</span>
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
              class="enc-range"
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
          </template>

          <!-- ── Log tab ────────────────────────────────────────────────── -->
          <template v-else-if="rightTab === 'log'">
            <!-- Add note row -->
            <div class="log-note-bar">
              <select v-model="logNoteTokenId" class="log-note-select">
                <option :value="null" disabled>Token…</option>
                <option v-for="t in encounterTokens" :key="t.id" :value="t.id">
                  {{ t.label || t.name }}
                </option>
              </select>
              <input v-model="logNoteText" class="log-note-input" placeholder="Note…" @keyup.enter="submitLogNote" />
              <button class="log-note-add" :disabled="!logNoteTokenId || !logNoteText.trim()" @click="submitLogNote">+</button>
            </div>

            <!-- Log entries — newest first -->
            <div class="log-entries">
              <div v-if="!store.current?.combatLog.length" class="log-empty">No events yet this session.</div>
              <div
                v-for="entry in reversedLog"
                :key="entry.id"
                class="log-row"
              >
                <span class="log-round-badge">R{{ entry.round }}</span>
                <span class="log-token-name">{{ entry.tokenName }}</span>
                <span class="log-event" :class="`log-event--${entry.type}`">
                  <template v-if="entry.type === 'damage'">took {{ entry.value }} damage</template>
                  <template v-else-if="entry.type === 'healing'">healed {{ entry.value }} HP</template>
                  <template v-else-if="entry.type === 'condition-added'">gained {{ entry.conditionName }}</template>
                  <template v-else-if="entry.type === 'condition-removed'">lost {{ entry.conditionName }}</template>
                  <template v-else-if="entry.type === 'death'">fell unconscious ☠</template>
                  <template v-else-if="entry.type === 'revival'">revived</template>
                  <template v-else-if="entry.type === 'note'">{{ entry.note }}</template>
                </span>
              </div>
            </div>

            <!-- Clear log -->
            <div class="log-footer">
              <button class="log-clear-btn" @click="confirmClearLog">Clear Log</button>
            </div>
          </template>
        </aside>
      </div>

      <!-- ── Log clear confirmation ─────────────────────────────────────────── -->
      <Teleport to="body">
        <div v-if="clearLogConfirm" class="pv-dialog-mask" @click.self="clearLogConfirm = false">
          <div class="pv-dialog" style="max-width:360px">
            <div class="link-modal-header">
              <span class="link-modal-title">Clear Combat Log?</span>
              <button class="link-modal-close" @click="clearLogConfirm = false">✕</button>
            </div>
            <p class="link-modal-hint">This cannot be undone.</p>
            <div class="link-modal-footer">
              <button class="link-btn link-btn--skip" @click="clearLogConfirm = false">Cancel</button>
              <button class="link-btn link-btn--link" style="background:var(--blood)" @click="doClearLog">Clear</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ── Link to Stat Block Modal ───────────────────────────────────────────── -->
      <Teleport to="body">
        <div v-if="linkModalOpen" class="pv-dialog-mask" @click.self="linkModalOpen = false">
          <div class="pv-dialog link-modal">
            <div class="link-modal-header">
              <span class="link-modal-title">Link to Stat Block?</span>
              <button class="link-modal-close" @click="linkModalOpen = false">✕</button>
            </div>
            <p class="link-modal-hint">Auto-fill HP, AC and conditions from a system record.</p>
            <div class="link-modal-search">
              <OhVueIcon name="fa-search" scale="0.75" style="color:var(--ink-ghost)" />
              <input v-model="linkSearch" class="link-search-input" placeholder="Search records…" autocomplete="off" />
            </div>
            <div class="link-record-list">
              <button v-for="rec in filteredLinkRecords" :key="rec.id"
                class="link-record-row"
                :class="{ 'link-record-row--selected': linkSelectedId === rec.id }"
                @click="linkSelectedId = rec.id">
                {{ rec.name }}
              </button>
              <div v-if="!filteredLinkRecords.length" class="link-record-empty">
                {{ linkSearch ? 'No matches' : 'No creature records found' }}
              </div>
            </div>
            <div class="link-modal-footer">
              <button class="link-btn link-btn--skip" @click="linkModalOpen = false">Skip</button>
              <button class="link-btn link-btn--link" :disabled="!linkSelectedId" @click="confirmLink">Link</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ── Record Slide-In Panel ───────────────────────────────────────────── -->
      <Teleport to="body">
        <Transition name="record-panel-slide">
          <div v-if="recordPanel?.open" class="record-panel">
            <button class="record-panel-close" @click="recordPanel = null">✕</button>
            <div class="record-panel-inner">
              <div v-if="recordPanel.entityType" class="record-panel-title">
                {{ recordPanel.record?.name }}
              </div>
              <EntityLayout v-if="recordPanel.entityType"
                :entity-type="recordPanel.entityType"
                :data="recordPanel.record.data"
                mode="view"
                :system-id="recordPanel.systemId"
                :accent-color="recordPanel.entityType?.color"
              />
              <div v-else class="record-panel-fallback">
                <pre class="record-panel-raw">{{ JSON.stringify(recordPanel.record?.data, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ── Condition Reference Panel ─────────────────────────────────────────── -->
      <ConditionPanel
        :condition-name="conditionPanelName"
        :system-id="linkCampaignSystemId"
        :value="conditionPanelValue"
        :open="conditionPanelOpen"
        @close="conditionPanelOpen = false"
      />

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
import { dbApi, getDb } from "~/composables/useDb";
import { useSystemsStore } from "~/stores/systems";

const route = useRoute();
const store = useEncounterStore();
const systemsStore = useSystemsStore();
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

// ── Stat-block link modal ──────────────────────────────────────────────────
const linkModalOpen = ref(false);
const linkPendingTokenId = ref<number | null>(null);
const linkCampaignSystemId = ref<number | null>(null);
const linkRecords = ref<Array<{ id: number; name: string; entityTypeId: string; data: string }>>([]);
const linkSelectedId = ref<number | null>(null);
const linkSearch = ref('');

const filteredLinkRecords = computed(() =>
  linkRecords.value.filter(r =>
    r.name.toLowerCase().includes(linkSearch.value.toLowerCase())
  )
);

// Resolve a record name from id — used in the token detail badge
const linkedRecordCache = ref<Map<number, string>>(new Map());
async function resolveRecordName(id: number): Promise<string> {
  if (linkedRecordCache.value.has(id)) return linkedRecordCache.value.get(id)!;
  const db = getDb();
  const rec = await db.records.get(id);
  const name = rec?.name ?? '(unknown)';
  linkedRecordCache.value.set(id, name);
  return name;
}
const selectedTokenLinkedName = ref<string | null>(null);
watch(() => selectedToken.value?.linkedRecordId, async (id) => {
  selectedTokenLinkedName.value = id ? await resolveRecordName(id) : null;
}, { immediate: true });

async function openLinkModal(tokenId: number) {
  if (!store.current) return;
  // Load campaign to find system_id
  const campaign = await getDb().campaigns.get(store.current.campaignId);
  const systemId: number | null | undefined = (campaign as any)?.system_id;
  if (!systemId) return; // no linked system — skip modal

  linkCampaignSystemId.value = systemId;
  if (!systemsStore.getSystem(systemId)) await systemsStore.loadAll();
  const sys = systemsStore.getSystem(systemId);
  if (!sys) return;

  // Find entity types that look like combatants — check key AND label for HP/AC hints.
  // Fall back to ALL entity types if none match, so custom key names still work.
  const HP_RE = /\b(hp|health|hit.?point|hpmax|hp.?max)\b/i;
  const AC_RE = /\b(ac|armou?r.?class|armor)\b/i;
  const NON_COMBAT = /\b(condition|spell|item|feat|trait|skill|background|ancestry)\b/i;
  const allTypes: any[] = sys.entityTypes ?? [];
  let creatureTypeIds: string[] = allTypes
    .filter((et: any) => {
      const fields: any[] = et.fields ?? [];
      return fields.some((f: any) =>
        HP_RE.test(f.key) || HP_RE.test(f.label ?? '') ||
        AC_RE.test(f.key) || AC_RE.test(f.label ?? '')
      );
    })
    .map((et: any) => et.id);

  // Fallback: show all non-utility types so custom field keys still work
  if (!creatureTypeIds.length) {
    creatureTypeIds = allTypes
      .filter((et: any) => !NON_COMBAT.test(et.name ?? '') && !NON_COMBAT.test(et.id ?? ''))
      .map((et: any) => et.id);
  }
  // Last resort: show everything
  if (!creatureTypeIds.length) {
    creatureTypeIds = allTypes.map((et: any) => et.id);
  }
  if (!creatureTypeIds.length) return;

  // Load all records of creature types for this system
  const db = getDb();
  const rows: any[] = [];
  for (const typeId of creatureTypeIds) {
    const recs = await db.records
      .where('systemId').equals(systemId)
      .filter((r: any) => r.entityTypeId === typeId)
      .toArray();
    rows.push(...recs);
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));

  linkRecords.value = rows;
  linkSelectedId.value = null;
  linkSearch.value = '';
  linkPendingTokenId.value = tokenId;
  linkModalOpen.value = true;
}

async function confirmLink() {
  if (!linkSelectedId.value || !linkPendingTokenId.value) return;
  const db = getDb();
  const rec = await db.records.get(linkSelectedId.value);
  if (!rec) return;

  const data: Record<string, any> =
    typeof rec.data === 'string' ? JSON.parse(rec.data || '{}') : (rec.data ?? {});

  // Extract HP — try known keys first, then scan all fields by label
  let hpCurrent: number | null = null;
  let hpMax: number | null = null;
  const HP_RE = /\b(hp|health|hit.?point|hpmax|hp.?max)\b/i;
  const AC_RE = /\b(ac|armou?r.?class|armor)\b/i;

  // Get entity type field metadata for label-based fallback
  if (!systemsStore.getSystem(rec.systemId)) await systemsStore.loadAll();
  const recSys = systemsStore.getSystem(rec.systemId);
  const recEt: any = recSys?.entityTypes?.find((et: any) => et.id === rec.entityTypeId);
  const recFields: any[] = recEt?.fields ?? [];

  function extractStatValue(data: Record<string, any>, keyRe: RegExp): number | null {
    // 1. Try well-known keys by regex on key name
    for (const k of Object.keys(data)) {
      if (keyRe.test(k)) {
        const raw = data[k];
        if (raw && typeof raw === 'object' && 'max' in raw) return Number(raw.max) || null;
        const n = Number(raw);
        return !isNaN(n) && n > 0 ? n : null;
      }
    }
    // 2. Try by field label from entity type schema
    for (const f of recFields) {
      if (keyRe.test(f.label ?? '')) {
        const raw = data[f.key];
        if (raw === undefined || raw === null) continue;
        if (raw && typeof raw === 'object' && 'max' in raw) return Number(raw.max) || null;
        const n = Number(raw);
        return !isNaN(n) && n > 0 ? n : null;
      }
    }
    return null;
  }

  function extractHp(data: Record<string, any>): { current: number | null; max: number | null } {
    for (const k of Object.keys(data)) {
      if (HP_RE.test(k)) {
        const raw = data[k];
        if (raw && typeof raw === 'object' && 'max' in raw) {
          return { max: Number(raw.max) || null, current: Number(raw.current ?? raw.max) || null };
        }
        const n = Number(raw);
        if (!isNaN(n) && n > 0) return { max: n, current: n };
      }
    }
    for (const f of recFields) {
      if (HP_RE.test(f.label ?? '')) {
        const raw = data[f.key];
        if (raw === undefined || raw === null) continue;
        if (raw && typeof raw === 'object' && 'max' in raw) {
          return { max: Number(raw.max) || null, current: Number(raw.current ?? raw.max) || null };
        }
        const n = Number(raw);
        if (!isNaN(n) && n > 0) return { max: n, current: n };
      }
    }
    return { max: null, current: null };
  }

  const hpResult = extractHp(data);
  hpMax = hpResult.max;
  hpCurrent = hpResult.current;

  // Extract AC
  let ac: number | null = extractStatValue(data, AC_RE);

  const token = store.current?.tokens.find(t => t.id === linkPendingTokenId.value);
  const updates: Record<string, any> = { linkedRecordId: rec.id };
  if (hpMax !== null) { updates.hpMax = hpMax; updates.hpCurrent = hpCurrent; }
  if (!token?.label) updates.label = rec.name;

  // Extract conditions if present
  if (Array.isArray(data.conditions) && data.conditions.length) {
    updates.conditions = data.conditions.map((c: any) =>
      typeof c === 'string' ? { name: c, value: null } : c
    );
  }

  await store.updateToken(linkPendingTokenId.value, updates as any);
  linkModalOpen.value = false;
  linkPendingTokenId.value = null;
}

// ── Record slide-in panel ──────────────────────────────────────────────────
const recordPanel = ref<{ open: boolean; record: any; entityType: any; systemId: number } | null>(null);

async function openRecordPanel(recordId: number) {
  const db = getDb();
  const rec = await db.records.get(recordId);
  if (!rec) return;
  if (!systemsStore.getSystem(rec.systemId)) await systemsStore.loadAll();
  const sys = systemsStore.getSystem(rec.systemId);
  const entityType = sys?.entityTypes?.find((et: any) => et.id === rec.entityTypeId) ?? null;
  recordPanel.value = {
    open: true,
    record: { ...rec, data: typeof rec.data === 'string' ? JSON.parse(rec.data || '{}') : rec.data },
    entityType,
    systemId: rec.systemId,
  };
}

// ── Condition reference panel ──────────────────────────────────────────────
const conditionPanelOpen = ref(false);
const conditionPanelName = ref('');
const conditionPanelValue = ref<number | null>(null);

function openConditionPanel(name: string, value: number | null = null) {
  conditionPanelName.value = name;
  conditionPanelValue.value = value;
  conditionPanelOpen.value = true;
}

// ── Right sidebar tab ─────────────────────────────────────────────────────
const rightTab = ref<'tokens' | 'log'>('tokens');

// ── Combat log UI ─────────────────────────────────────────────────────────
const logNoteTokenId = ref<number | null>(null);
const logNoteText = ref('');
const clearLogConfirm = ref(false);

const reversedLog = computed(() =>
  store.current ? [...store.current.combatLog].reverse() : []
);

function submitLogNote() {
  if (!logNoteTokenId.value || !logNoteText.value.trim()) return;
  store.addLogNote(logNoteTokenId.value, logNoteText.value.trim());
  logNoteText.value = '';
}

function confirmClearLog() { clearLogConfirm.value = true; }

async function doClearLog() {
  await store.clearCombatLog();
  clearLogConfirm.value = false;
}

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
const dbConditionNames = ref<string[]>([]);

async function loadConditionNames(systemId: number) {
  if (!systemsStore.getSystem(systemId)) await systemsStore.loadAll();
  const sys = systemsStore.getSystem(systemId);
  if (!sys) return;
  // Find all entity types whose id or name contains "condition"
  const condTypeIds: string[] = (sys.entityTypes ?? [])
    .filter((et: any) => /condition/i.test(et.id ?? '') || /condition/i.test(et.name ?? ''))
    .map((et: any) => et.id);
  if (!condTypeIds.length) return;
  const db = getDb();
  const names: string[] = [];
  for (const typeId of condTypeIds) {
    const recs = await db.records
      .where('systemId').equals(systemId)
      .filter((r: any) => r.entityTypeId === typeId)
      .toArray();
    names.push(...recs.map((r: any) => r.name));
  }
  dbConditionNames.value = names.sort((a, b) => a.localeCompare(b));
}

// ── Initiative tracker ─────────────────────────────────────────────────────
const rollingInitiativeFor = ref<number | null>(null);
const initInputValue = ref("");

const currentTurnTokenId = computed(
  () => store.initiativeOrder[store.currentTurnIndex]?.id ?? null
);

function startRollInitiative(e: Event, token: any) {
  e.stopPropagation();
  rollingInitiativeFor.value = token.id;
  initInputValue.value = token.initiative !== null ? String(token.initiative) : "";
  nextTick(() => {
    (document.querySelector(".init-input-inline") as HTMLInputElement | null)?.focus();
  });
}

async function confirmInitiative(e: Event, tokenId: number) {
  e.stopPropagation();
  const val = parseInt(initInputValue.value);
  if (!isNaN(val)) await store.updateToken(tokenId, { initiative: val });
  rollingInitiativeFor.value = null;
  initInputValue.value = "";
}

function cancelInitiative(e: Event) {
  e.stopPropagation();
  rollingInitiativeFor.value = null;
  initInputValue.value = "";
}

function searchConditions(event: { query: string }) {
  const q = event.query.toLowerCase();
  // Merge DB conditions (from linked system) with hardcoded fallback list
  const merged = [...new Set([...dbConditionNames.value, ...conditionSuggestions])];
  filteredConditions.value = q
    ? merged.filter((c) => c.toLowerCase().includes(q))
    : merged;
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

  // Load condition names from the campaign's linked system
  const camp = await getDb().campaigns.get(store.current!.campaignId);
  if ((camp as any)?.system_id) {
    linkCampaignSystemId.value = (camp as any).system_id;
    loadConditionNames((camp as any).system_id);
  }

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
  const newToken = store.current?.tokens[store.current.tokens.length - 1];
  if (newToken) await openLinkModal(newToken.id);
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

watch(shapes, () => {
  store.setShapeOverlays(shapes.value);
}, { deep: true });

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

/* ── Token cards (right sidebar) ── */
.enc-token-cards {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.token-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 8px;
  border-radius: 3px;
  border: 1px solid var(--parch-line);
  border-left: 3px solid transparent;
  background: rgba(28, 20, 16, 0.03);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.token-card:hover {
  border-color: var(--parch-line);
  border-left-color: var(--ink-ghost);
  background: rgba(28, 20, 16, 0.06);
}
.token-card--selected {
  border-left-color: var(--blood) !important;
  background: rgba(139, 26, 26, 0.06) !important;
}
.token-card--active {
  border-left-color: var(--gold) !important;
  background: rgba(184, 134, 11, 0.08) !important;
}
.token-card--dead { opacity: 0.45; }
.token-card--hidden { opacity: 0.55; }

/* Top row: avatar + name + initiative */
.token-card-top {
  display: flex;
  align-items: center;
  gap: 7px;
}
.token-card-name {
  flex: 1;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.token-card-init {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--ink-ghost);
  flex-shrink: 0;
}
.token-card-init--set { color: var(--gold); }

/* Bottom row: HP + buttons */
.token-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding-left: 33px; /* align with name, past avatar */
}
.token-card-btns {
  display: flex;
  gap: 0;
}

/* Ghost icon buttons inside cards — no border, smaller, always visible */
.token-card-btns .icon-btn-sq {
  width: 22px;
  height: 22px;
  background: none;
  border: none;
  color: var(--ink-ghost);
  opacity: 0.5;
  transition: opacity 0.15s, color 0.15s;
}
.token-card-btns .icon-btn-sq:hover {
  background: none;
  border: none;
  color: var(--ink);
  opacity: 1;
}
.token-card-btns .icon-btn-sq--danger:hover {
  background: none;
  color: var(--blood);
  opacity: 1;
}
.token-card-btns .icon-btn-sq.init-roll-btn { color: var(--gold); opacity: 0.5; }
.token-card-btns .icon-btn-sq.init-roll-btn:hover { opacity: 1; }

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
  color: var(--ink);
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

.enc-grid-col { display: flex; flex-direction: column; gap: 8px; }
.enc-range { width: 100%; accent-color: var(--gold); }
.enc-token-detail { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--ink); }

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

.condition-tag-name {
  cursor: pointer;
  border-radius: 2px;
  padding: 0 1px;
}
.condition-tag-name:hover { text-decoration: underline; opacity: 0.8; }

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

/* ── Base border for token rows (enables hover + current-turn colour) ── */
.token-chip,
.encounter-token-row {
  border-left: 2px solid transparent;
}

/* ── Initiative tracker bar ── */
.initiative-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 6px 7px;
  border-bottom: 1px solid var(--parch-line);
  margin-bottom: 2px;
}
.init-round-label {
  font-family: 'Cinzel', var(--font-head);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--gold);
}
.init-nav-btn {
  width: 22px;
  height: 22px;
  border-radius: 2px;
  border: 1px solid var(--parch-line);
  background: none;
  color: var(--ink-ghost);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.init-nav-btn:hover { border-color: var(--gold); color: var(--gold); }

/* ── Current-turn highlight ── */
.encounter-token-row.current-turn {
  border-left-color: var(--gold) !important;
  background: rgba(184, 134, 11, 0.07) !important;
}

/* ── Initiative badge ── */
.enc-initiative-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--gold);
  letter-spacing: 0.04em;
}

/* ── Roll-initiative button ── */
.init-roll-btn {
  font-size: 11px;
  line-height: 1;
}

/* ── Linked record badge ── */
.enc-linked-record {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  background: color-mix(in srgb, var(--gold) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--gold) 30%, transparent);
  border-radius: 4px;
  margin-bottom: 6px;
}
.enc-linked-btn {
  flex: 1;
  background: none;
  border: none;
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--gold);
  cursor: pointer;
  text-align: left;
  padding: 0;
  transition: color 0.15s;
}
.enc-linked-btn:hover { color: var(--ink); }
.enc-linked-unlink {
  background: none;
  border: none;
  font-size: 10px;
  color: var(--ink-ghost);
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  transition: color 0.15s;
}
.enc-linked-unlink:hover { color: var(--blood); }

/* ── Link to Stat Block modal ── */
.link-modal {
  width: 420px;
  max-width: 94vw;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.link-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--parch-line);
}
.link-modal-title {
  font-family: var(--font-head);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink);
}
.link-modal-close {
  background: none;
  border: none;
  color: var(--ink-ghost);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}
.link-modal-close:hover { color: var(--blood); }
.link-modal-hint {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--ink-ghost);
  font-style: italic;
  padding: 8px 16px 4px;
}
.link-modal-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-bottom: 1px solid var(--parch-line);
}
.link-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink);
}
.link-search-input::placeholder { color: var(--ink-ghost); font-style: italic; }
.link-record-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}
.link-record-row {
  display: block;
  width: 100%;
  padding: 7px 16px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.1s;
}
.link-record-row:hover { background: rgba(184,134,11,0.06); }
.link-record-row--selected {
  background: rgba(184,134,11,0.12);
  color: var(--ink);
  font-weight: 600;
  border-left: 2px solid var(--gold);
  padding-left: 14px;
}
.link-record-empty {
  padding: 16px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--ink-ghost);
  font-style: italic;
  text-align: center;
}
.link-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px 14px;
  border-top: 1px solid var(--parch-line);
}
.link-btn {
  font-family: var(--font-head);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
}
.link-btn--skip {
  background: none;
  color: var(--ink-ghost);
  border-color: var(--parch-line);
}
.link-btn--skip:hover { color: var(--ink); border-color: var(--ink-ghost); }
.link-btn--link {
  background: rgba(184,134,11,0.12);
  color: var(--gold);
  border-color: rgba(184,134,11,0.4);
}
.link-btn--link:hover:not(:disabled) { background: rgba(184,134,11,0.22); border-color: var(--gold); }
.link-btn--link:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Record slide-in panel ── */
.record-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  z-index: 500;
  background-color: var(--parch);
  background-image: var(--paper);
  background-blend-mode: multiply;
  box-shadow: -4px 0 32px rgba(28, 20, 16, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.record-panel-close {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  font-size: 14px;
  color: var(--ink-ghost);
  cursor: pointer;
  z-index: 1;
  line-height: 1;
  padding: 4px;
  transition: color 0.15s;
}
.record-panel-close:hover { color: var(--blood); }
.record-panel-inner {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 24px;
}
.record-panel-title {
  font-family: 'Cinzel', var(--font-deco);
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--parch-line);
}
.record-panel-raw {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-faded);
  white-space: pre-wrap;
  word-break: break-all;
}
.record-panel-slide-enter-active,
.record-panel-slide-leave-active { transition: transform 0.25s ease; }
.record-panel-slide-enter-from,
.record-panel-slide-leave-to { transform: translateX(100%); }

/* ── Right sidebar tabs ── */
.rsb-tabs {
  display: flex;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}
.rsb-tab {
  flex: 1;
  padding: 7px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}
.rsb-tab:hover { color: var(--ink); }
.rsb-tab--active { color: var(--blood); border-bottom-color: var(--blood); }

/* ── Log tab layout ── */
.log-note-bar {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}
.log-note-select {
  flex: 0 0 90px;
  font-size: 11px;
  padding: 3px 4px;
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  background: var(--parch);
  color: var(--ink);
  font-family: var(--font-ui);
}
.log-note-input {
  flex: 1;
  font-size: 11px;
  padding: 3px 6px;
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  background: var(--parch);
  color: var(--ink);
  font-family: var(--font-ui);
}
.log-note-input::placeholder { color: var(--ink-ghost); }
.log-note-add {
  flex: 0 0 26px;
  height: 26px;
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  background: var(--parch);
  color: var(--ink-ghost);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.log-note-add:not(:disabled):hover { color: var(--ink); border-color: var(--gold); }
.log-note-add:disabled { opacity: 0.35; cursor: not-allowed; }

.log-entries {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
.log-empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 11px;
  color: var(--ink-ghost);
  font-style: italic;
}
.log-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 3px 10px;
  font-size: 11px;
  line-height: 1.4;
  border-bottom: 1px solid rgba(28,20,16,0.04);
}
.log-row:last-child { border-bottom: none; }
.log-round-badge {
  flex: 0 0 auto;
  background: var(--parch-dark, rgba(28,20,16,0.08));
  color: var(--ink-ghost);
  font-family: 'Cinzel', serif;
  font-size: 8px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 2px;
  letter-spacing: 0.04em;
}
.log-token-name {
  flex: 0 0 auto;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink-faded);
  font-style: italic;
  font-size: 10px;
}
.log-event { flex: 1; }
.log-event--damage        { color: var(--blood); }
.log-event--healing       { color: #4a8f5a; }
.log-event--condition-added  { color: var(--arcane-l, #9f7abf); }
.log-event--condition-removed { color: var(--ink-ghost); }
.log-event--death         { color: var(--blood); font-weight: 700; }
.log-event--revival       { color: #4a8f5a; }
.log-event--note          { color: var(--ink-faded); font-style: italic; }

.log-footer {
  padding: 8px 10px;
  border-top: 1px solid var(--parch-line);
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}
.log-clear-btn {
  background: none;
  border: 1px solid var(--parch-line);
  border-radius: 3px;
  padding: 3px 12px;
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  cursor: pointer;
}
.log-clear-btn:hover { border-color: var(--blood); color: var(--blood); }
</style>
