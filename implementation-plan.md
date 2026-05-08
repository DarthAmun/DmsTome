# DM's Tome — Implementation Plan
## NoteEditor Split + Knowledge Graph Overhaul

---

## THE BIG PICTURE

### What we are building

Two interconnected features that clean up the existing architecture and add new capability:

**1. NoteEditor Split**
The current `NoteEditor.vue` is a ~1000 line monolith handling eight different entity types (NPC, location, faction, quest, event, session, note) with type-specific branching everywhere (`v-if="entity.type === 'session'"` scattered throughout). We are splitting it into dedicated editor components per entity type, sharing a common `MarkdownEditor` primitive. This also introduces new routes for views that previously lived as internal toggle state.

**2. Knowledge Graph Overhaul**
Replace the current Cytoscape.js based `NotesGraph.vue` with a vue-flow based implementation. The new graph supports custom entity card nodes, two edge types (explicit GM-drawn connections vs dashed mention edges from wikilinks), persistent layout per campaign, node hiding with a slide-out panel, and right-click context menus.

---

## ARCHITECTURAL DECISIONS

### Component hierarchy after the split

```
MarkdownEditor.vue              ← generic primitive: textarea/mixed/preview + slots
  #above-editor slot            ← SnapshotTimeline, NpcCard, etc. injected here
  #below-content slot           ← LinkBar injected here

EditorHeader.vue                ← shared: type badge, editable name, delete button

LinkBar.vue                     ← extracted from NoteEditor: outgoing links, backlinks, pinned-on

editors/NpcEditor.vue           ← AttributeEditor above + MarkdownEditor with SnapshotTimeline + NpcCard in #above-editor
editors/LocationEditor.vue      ← AttributeEditor above + MarkdownEditor with SnapshotTimeline in #above-editor + "View Map" button
editors/FactionEditor.vue       ← AttributeEditor above + MarkdownEditor with SnapshotTimeline in #above-editor
editors/QuestEditor.vue         ← AttributeEditor above + MarkdownEditor with SnapshotTimeline in #above-editor
editors/EventEditor.vue         ← AttributeEditor above + MarkdownEditor (no snapshots)
editors/NoteEditorSimple.vue    ← bare MarkdownEditor only (notes have no structured attributes)
editors/SessionEditor.vue       ← AttributeEditor above + two MarkdownEditors side by side (script/notes)
```

### Slot contract for MarkdownEditor

```vue
<AttributeEditor />                    <!-- outside MarkdownEditor, owned by each editor component -->
<MarkdownEditor
  :entity-id="..."
  :campaign-id="..."
  :content="..."
  @update:content="..."
  @navigate="..."
>
  <template #above-editor>
    <SnapshotTimeline ... />           <!-- NPC/Location/Faction/Quest only -->
    <NpcCard ... />                    <!-- NpcEditor only -->
  </template>
  <template #below-content>
    <LinkBar ... />                    <!-- all editors -->
  </template>
</MarkdownEditor>
```

MarkdownEditor does NOT:
- Save to the store (parent handles this via `@update:content`)
- Know the entity type
- Show attributes
- Show the entity name or header

### Snapshot-aware save routing

All editor components that support snapshots (NPC, Location, Faction, Quest) must route save calls:
- If `viewingSnapshot` is set → call `store.updateSnapshotContent(snapshotId, changes)`
- If `viewingSnapshot` is null → call `store.updateEntity(entityId, changes)`

This applies to content saves, attribute saves, and name saves.

### Session editor layout

SessionEditor renders two MarkdownEditor instances side by side — Script/Prep on the left, Session Notes on the right. No toggle. Both always visible. AttributeEditor sits above both spanning full width. The session split content lives in `entity.attributes.scriptContent` and `entity.attributes.notesContent`.

### Location map route structure

Location uses a Nuxt nested route with a shared parent layout:

```
pages/campaign/[id]/locations/[entryId].vue        ← parent layout: sidebar + <NuxtPage />
pages/campaign/[id]/locations/[entryId]/index.vue  ← LocationEditor (notes view)
pages/campaign/[id]/locations/[entryId]/map.vue    ← WorldMap full view
```

The parent layout renders the location list in a sidebar so the user can switch locations without going back to the list. Both child routes are bookmarkable.

### New routes introduced

```
/campaign/:id/sessions/log              ← session log (was a toggle inside sessions/index)
/campaign/:id/events/timeline           ← event timeline (was a toggle inside events/index)
/campaign/:id/locations/:entryId        ← location notes (was single page, now parent layout)
/campaign/:id/locations/:entryId/map    ← location map view (new, bookmarkable)
```

Session log and event timeline list pages become list-only. They navigate to the new routes instead of toggling internal view mode.

---

## WIKILINK SYSTEM — WHAT CHANGES AND WHAT DOESN'T

The existing wikilink syntax has three forms. Only one changes:

| Syntax | Behaviour | Change? |
|---|---|---|
| `{{npc: Aldric}}` | Clickable navigation chip | No change |
| `{{npc: Aldric \| entry}}` | Embeds full NPC entry inline | No change |
| `{{npc: Aldric \| entry:portraitSource}}` | Embeds specific attribute inline | No change |
| `{{npc: Aldric \| reputation: good}}` | Was graph edge metadata | Silently ignored — link still renders and navigates, `key: value` pairs have no effect |

Do NOT change `useEntityParser` or `renderEntityRefs` beyond stopping the reading of `key: value` metadata pairs for graph purposes. The embed rendering is completely untouched.

---

## GRAPH ARCHITECTURE

### Two edge types

**Mention edges** (from `DbEntityLink` records / wikilinks):
- Dashed line, reduced opacity
- Auto-derived, read-only in graph
- Toggleable via "Mentions" toolbar button
- Not selectable, not editable
- Skipped if an explicit connection already exists between the same two entities

**Explicit edges** (from `DbEntityConnection` records):
- Solid line, full opacity
- Created by dragging a handle from one node to another — instant, no modal
- Right-click to open ConnectionModal for label, direction, color, delete
- Persisted to `DbEntityConnection` table immediately on creation

### Graph canvas behavior

- Canvas starts empty for new campaigns — entities are added via search box in toolbar
- Node positions, hidden nodes, zoom, and pan are saved to `DbGraphLayout` per campaign, debounced 1 second after drag
- Right-click node → context menu: Open, Hide, Remove from graph
- "Hide" moves node to hidden list (saves to layout). "Remove from graph" removes position from layout entirely
- Hidden nodes panel: slide-out from right, lists hidden entities with "Show" button to restore
- Double-click node → navigate to that entity's route
- Type filter buttons show/hide all nodes of a type simultaneously

### DB additions

```typescript
DbEntityConnection {
  id?: number
  campaign_id: number
  source_entity_id: number
  target_entity_id: number
  label: string           // empty string = no label
  direction: 'one-way' | 'two-way' | 'none'
  color: string | null    // null = default edge color
}

DbGraphLayout {
  id?: number
  campaign_id: number     // one per campaign (designed for easy multi-layout extension later)
  positions: string       // JSON: Record<entityId, {x, y}>
  hidden_nodes: string    // JSON: number[]
  zoom: number
  pan_x: number
  pan_y: number
}
```

Dexie version 9 adds tables: `entityConnections` and `graphLayouts`.

### Entity node cards

Each node shows:
- Image header: portrait/banner image if available (`attributes.portraitSource` or `attributes.imageSource`), otherwise type icon rendered as SVG data URL using the existing `makeOhIconDataUrl` logic from the old NotesGraph
- Type badge (colored)
- Entity name
- Up to 4 key attributes (non-empty string values, excluding `*Source` fields)

Node size: 200px wide, variable height.
Connection handles appear on hover only (left and right sides).

### Dependencies to install

```
pnpm add @vue-flow/core @vue-flow/background @vue-flow/controls
```

Add vue-flow global CSS to `app.vue` or a global CSS file:
```
@import '@vue-flow/core/dist/style.css'
@import '@vue-flow/core/dist/theme-default.css'
```

---

## WHAT STAYS UNCHANGED

- `CampaignEntityList.vue` — the list pages are untouched
- `NpcCard.vue` — used by NpcEditor in the `#above-editor` slot
- `AttributeEditor.vue` — used by all editor components
- `SnapshotTimeline.vue`, `SnapshotCreateDialog.vue`, `SnapshotEditDialog.vue` — moved into individual editors
- `WorldMap.vue` — used by the new location map route
- `stores/notes.ts` — unchanged except `deleteEntity` cleans up connections
- `SpineNav.vue` level-3 detection — add `/sessions/log` and `/events/timeline` patterns
- All snapshot store actions from the H1-H6 commands — unchanged
- The `graph.vue` page wrapper — unchanged, it just renders `NotesGraph`
- `dbApi.connections.deleteByEntity(id)` must be called inside `deleteEntity` in `stores/notes.ts`

---

## TODO LIST

Work through these steps in order. The app will be in an intermediate broken state between steps — this is expected. Do not test until the final step.

### Phase 1: Generic primitives

- [ x ] **E1** — Create `components/MarkdownEditor.vue`
  - Extract from `NoteEditor.vue`: tab bar (Edit/Mixed/Preview), textarea/mixed-blocks/preview renderer, `renderContent()` and full markdown pipeline, `renderEntityRefs` integration, keyboard shortcuts (Tab, Shift+Tab, Cmd+B, Cmd+I)
  - Props: `entityId: number`, `campaignId: number`, `content: string`, `readonly?: boolean`, `showTabBar?: boolean`, `initialViewMode?: 'edit'|'mixed'|'preview'`
  - Emits: `update:content (value: string)` debounced 800ms, `navigate (type: string, name: string)`
  - Slots: `#above-editor`, `#below-content`
  - Move all editor CSS (edit-pane, preview-pane, mixed-pane, mixed-block, mixed-textarea, editor-tabbar, etab-*) into scoped styles
  - Component does NOT save to store — parent handles persistence

- [ x ] **E2** — Create `components/LinkBar.vue`
  - Extract from `NoteEditor.vue`: `outgoingLinks`, `backlinks`, `pinnedOn`, `scriptLinks`, `linkAvatar()`, full links panel template for both session and non-session types
  - Props: `entityId: number`, `campaignId: number`, `entityType: string`
  - Emits: `navigate (type: string, name: string)`
  - Renders nothing if no links exist
  - Move `.links-panel`, `.links-section`, `.link-row`, `.link-avatar`, `.link-icon`, `.link-label`, `.link-meta` CSS into scoped styles

- [ x ] **E2b** — Create `components/EditorHeader.vue`
  - Extract from `NoteEditor.vue`: entity type badge, inline-editable name (click to edit), delete button
  - Props: `entity: Entity`
  - Emits: `delete: []`, `rename: [name: string]`
  - Accepts an optional `#actions` slot for extra buttons (e.g. "View Map" in LocationEditor)
  - Move `.editor-header`, `.entity-type-badge`, `.editor-name`, `.editor-name-input`, `.hdr-btn` CSS into scoped styles

### Phase 2: Dedicated editor components

- [ x ] **E3a** — Create `components/editors/NpcEditor.vue`
  - `EditorHeader` + `AttributeEditor` above + `MarkdownEditor` with `#above-editor` containing `SnapshotTimeline` then `NpcCard`, `#below-content` containing `LinkBar`
  - Snapshot-aware save: content/attributes/name saves route to `updateSnapshotContent` when `viewingSnapshot` is set, otherwise to `updateEntity`
  - All snapshot dialog state (`showCreateSnapshot`, `showEditSnapshot`, `viewingSnapshot`, etc.) lives here
  - `displayAttrs` and `displayName` computed: use snapshot values when `viewingSnapshot` is set
  - `typeColor` from `ENTITY_TYPE_CONFIG.npc.color`

- [ x ] **E3b** — Create `components/editors/FactionEditor.vue`
  - Same structure as NpcEditor but no NpcCard in `#above-editor`
  - Show banner image (`attributes.imageSource`) above MarkdownEditor if present, same as current NoteEditor `entity-banner` pattern
  - SnapshotTimeline in `#above-editor`
  - `entity-type="faction"` on LinkBar

- [ x ] **E3c** — Create `components/editors/QuestEditor.vue`
  - Identical structure to FactionEditor
  - SnapshotTimeline included
  - `entity-type="quest"` on LinkBar

- [ x ] **E3d** — Create `components/editors/EventEditor.vue`
  - Same structure but no SnapshotTimeline (events do not support snapshots)
  - `entity-type="event"` on LinkBar

- [ x ] **E3e** — Create `components/editors/NoteEditorSimple.vue`
  - Bare `MarkdownEditor` only — no AttributeEditor, no SnapshotTimeline, no card
  - `EditorHeader` at top
  - `LinkBar` in `#below-content`
  - `entity-type="note"` on LinkBar

- [ x ] **E3f** — Create `components/editors/SessionEditor.vue`
  - `EditorHeader` + `AttributeEditor` spanning full width above
  - Two `MarkdownEditor` instances side by side in a `.session-split` flex container
  - Left: Script/Prep — content from `entity.attributes.scriptContent ?? ''`
  - Right: Session Notes — content from `entity.attributes.notesContent ?? ''`
  - `onScriptChange(value)`: `store.updateEntity(entityId, { attributes: { ...entity.attributes, scriptContent: value } })`
  - `onNotesChange(value)`: `store.updateEntity(entityId, { attributes: { ...entity.attributes, notesContent: value } })`
  - `LinkBar` in `#below-content` of the left MarkdownEditor
  - No SnapshotTimeline (sessions do not support snapshots)
  - Copy `.session-split`, `.session-pane`, `.session-pane-label`, `.session-split-divider` CSS from NoteEditor

- [ x ] **E3g** — Update `CampaignEntityEntry.vue` to use dedicated editors
  - Replace the single `<NoteEditor>` with type-switched components:
    ```vue
    <NpcEditor       v-if="type === 'npc'"      ... />
    <LocationEditor  v-else-if="type === 'location'" ... />
    <FactionEditor   v-else-if="type === 'faction'"  ... />
    <QuestEditor     v-else-if="type === 'quest'"    ... />
    <EventEditor     v-else-if="type === 'event'"    ... />
    <SessionEditor   v-else-if="type === 'session'"  ... />
    <NoteEditorSimple v-else                          ... />
    ```
  - All pass the same props: `:entity-id`, `:campaign-id`, `@navigate`, `@deleted`
  - After this step `NoteEditor.vue` is no longer used — do not delete it yet, keep as reference until E4 and E5 are complete

### Phase 3: Location map route

- [ ] **E4a** — Create `pages/campaign/[id]/locations/[entryId].vue` (parent layout)
  - Renders a sidebar with the location list + `<NuxtPage />`
  - Sidebar shows all locations for the campaign, active one highlighted
  - Each list item has two small icon buttons: Notes (navigate to `index.vue`) and Map (navigate to `map.vue`)
  - Current view type derived from route path: `isMapView` = path ends with `/map`
  - `createLocation()` creates a new entity and navigates to its route
  - Sidebar width ~220px, `location-content` takes `flex: 1`

- [ ] **E4b** — Create `pages/campaign/[id]/locations/[entryId]/index.vue`
  - `<LocationEditor :entity-id="entryId" :campaign-id="campaignId" @navigate="..." @deleted="goToList()" />`
  - `goToList()` navigates to `/campaign/${campaignId}/locations`

- [ ] **E4c** — Create `pages/campaign/[id]/locations/[entryId]/map.vue`
  - Full-page WorldMap using the location's stored map image
  - Header showing location name
  - Fallback message if no map is set with link back to notes view

- [ ] **E4d** — Create `components/editors/LocationEditor.vue`
  - Same structure as FactionEditor
  - SnapshotTimeline in `#above-editor`
  - `EditorHeader` with a "View Map" button in its `#actions` slot that navigates to `map.vue` route
  - `entity-type="location"` on LinkBar

- [ ] **E4e** — Delete the old `pages/campaign/[id]/locations/[entryId].vue` flat entry page
  - It is now replaced by the parent layout + index child
  - Verify routing works before deleting

### Phase 4: Session log and event timeline routes

- [ ] **E5a** — Create `pages/campaign/[id]/sessions/log.vue`
  - Move the SessionLog component render here (was a toggle view inside sessions/index)
  - Header with back link to `/sessions`
  - `openSession(id)` navigates to `/sessions/${id}`

- [ ] **E5b** — Update `pages/campaign/[id]/sessions/index.vue`
  - Remove the view toggle button and `v-if="viewMode === 'log'"` branch
  - Add a "Session Log" button in the list header that navigates to `/sessions/log`
  - List page is now list-only

- [ ] **E5c** — Create `pages/campaign/[id]/events/timeline.vue`
  - Move the EventTimeline component render here
  - Header with back link to `/events`
  - `openEvent(id)` navigates to `/events/${id}`

- [ ] **E5d** — Update `pages/campaign/[id]/events/index.vue`
  - Remove toggle and timeline branch
  - Add "Timeline" button navigating to `/events/timeline`
  - List page is now list-only

- [ ] **E5e** — Update `composables/useSpineContext.ts`
  - Add `/sessions/log` detection → Level 3: `{ icon: 'gi-book-aura', label: 'Log', color: ENTITY_TYPE_CONFIG.session.color }`
  - Add `/events/timeline` detection → Level 3: `{ icon: 'gi-sands-of-time', label: 'Timeline', color: ENTITY_TYPE_CONFIG.event.color }`

- [ ] **E5f** — Delete `NoteEditor.vue`
  - Only after E3g, E4, and E5 are complete and verified
  - Confirm no remaining imports of NoteEditor anywhere

### Phase 5: Graph DB schema

- [ ] **G1** — Add `DbEntityConnection` and `DbGraphLayout` to `composables/useDb.ts`
  - Add interfaces (see DB ADDITIONS section above)
  - Add Dexie version 9 migration with tables: `entityConnections: '++id, campaign_id, source_entity_id, target_entity_id'` and `graphLayouts: '++id, campaign_id'`
  - Add table declarations to DmsTomeDb class body
  - Add `dbApi.connections` with methods: `list(campaignId)`, `add(conn)`, `update(id, changes)`, `delete(id)`, `deleteByEntity(entityId)`
  - Add `dbApi.graphLayout` with methods: `get(campaignId)`, `save(layout)` (upsert by campaign_id)
  - In `stores/notes.ts` `deleteEntity` action: add `await dbApi.connections.deleteByEntity(id)` after existing snapshot cleanup

### Phase 6: Graph overhaul

- [ ] **G2a** — Install dependencies
  - `pnpm add @vue-flow/core @vue-flow/background @vue-flow/controls`
  - Add to global CSS (app.vue or assets/css/main.css):
    ```css
    @import '@vue-flow/core/dist/style.css';
    @import '@vue-flow/core/dist/theme-default.css';
    ```

- [ ] **G2b** — Create `components/graph/EntityNode.vue`
  - vue-flow custom node component
  - Props via `data`: `entityId`, `name`, `type`, `color`, `imageUrl`, `attributes`
  - Template: image header (portrait/banner or icon SVG), type badge, name, up to 4 key attributes (non-empty strings, excluding `*Source` fields)
  - Connection Handles: left (target) and right (source), visible on hover only
  - Node width: 200px
  - Reuse `makeInitialDataUrl` and `makeOhIconDataUrl` logic from old NotesGraph for image generation

- [ ] **G2c** — Create `components/graph/ConnectionModal.vue`
  - Opens on right-click of explicit edge
  - Props: `open`, `connection: DbEntityConnection | null`, `sourceName`, `targetName`
  - Emits: `close`, `saved (connection)`, `deleted (id)`
  - Fields: label input (empty = unlabeled), direction select (One-way →, Bidirectional ↔, Undirected —), color picker (6 presets + null/default)
  - Delete button with confirmation
  - Uses `pv-dialog-mask / pv-dialog` pattern

- [ ] **G2d** — Create `components/graph/HiddenNodesPanel.vue`
  - Slide-out panel from right side of graph area
  - Props: `open`, `hiddenEntities: Entity[]`
  - Emits: `close`, `show-node (entityId: number)`
  - Lists hidden entities with type icon (colored) and "Show" button per entry
  - CSS: `position: absolute; right: 0; top: 0; bottom: 0; width: 260px; transform: translateX(100%)` when closed, `translateX(0)` when open, `transition: 0.2s ease`

- [ ] **G2e** — Rewrite `components/NotesGraph.vue`
  - Replace entire file — Cytoscape.js is removed, vue-flow is the new base
  - Toolbar contains: entity search box, type filter buttons, Mentions toggle, Hidden panel toggle, Fit button
  - Entity search: text input, results dropdown, clicking result calls `addEntityToGraph(entity)`, only shows entities not already on canvas
  - `addEntityToGraph`: creates a vue-flow node at a random position near center, saves layout
  - Node right-click: context menu with Open, Hide, Remove from graph
    - "Hide" → adds entityId to `hiddenNodes`, removes from canvas, saves layout
    - "Remove" → removes position from layout entirely, removes from canvas
  - Edge creation: `@connect` event → `dbApi.connections.add(...)` immediately (no modal), then rebuild edges
  - Edge right-click: only works on explicit edges (`edge.data.isExplicit === true`) → opens ConnectionModal
  - Mention edges: derived from `store.links`, rendered as dashed, `selectable: false`, skipped if explicit connection exists between same pair
  - Type visibility: `visibleTypes` Set, filter buttons toggle visibility, hidden types set `node.hidden = true`
  - Layout persistence: load `DbGraphLayout` on mount, save (upsert) debounced 1s on `@node-drag-stop` and `@move-end`
  - `hidden_nodes` persisted in layout so hidden state survives reload
  - Reuse image generation functions (`getNodeImage`, `makeOhIconDataUrl`, `makeInitialDataUrl`, `imageCacheKey`) from old implementation — copy them into the new file
  - Double-click node → `emit('navigate', entity.type, entity.name)`
  - `nodeTypes = { entity: EntityNode }` registered with vue-flow

---

## TESTING CHECKLIST

Run through this only after all TODO steps are complete.

### Editor split

- [ ] NPC entry opens NpcEditor — attributes above, SnapshotTimeline in editor, NpcCard below timeline, LinkBar at bottom
- [ ] Snapshot history: view past state shows snapshot content, editing while viewing snapshot saves to snapshot (not live entity), returning to present restores live content
- [ ] Session entry opens SessionEditor — two editors side by side, prep on left notes on right, attributes above both
- [ ] Saving script content updates `attributes.scriptContent`, saving notes updates `attributes.notesContent`
- [ ] Location entry opens in parent layout with sidebar, notes view shows LocationEditor
- [ ] Location map route `/locations/:id/map` shows WorldMap
- [ ] Navigating between locations via sidebar works without going back to list
- [ ] `/sessions/log` route shows session log, `/events/timeline` shows timeline
- [ ] Spine Level 3 shows correct label for `/sessions/log` ("Log") and `/events/timeline` ("Timeline")
- [ ] Wikilinks `{{npc: Name}}`, `{{npc: Name | entry}}`, `{{npc: Name | entry:attr}}` all still work
- [ ] Wikilinks with metadata `{{npc: Name | key: value}}` still render as clickable chip (metadata silently ignored)
- [ ] LinkBar shows outgoing links, backlinks, pinned-on for all entity types
- [ ] NoteEditor.vue is deleted and no import errors exist

### Graph

- [ ] Graph page loads with empty canvas for new campaign
- [ ] Searching for an entity and selecting it adds a node card to canvas
- [ ] Node card shows: image/icon, type badge, name, attributes
- [ ] Dragging node repositions it, position is saved after 1 second
- [ ] Reloading the page restores node positions
- [ ] Dragging from node handle to another node creates an instant explicit edge (solid line)
- [ ] Right-clicking an explicit edge opens ConnectionModal
- [ ] ConnectionModal: saving updates label/direction/color on the edge, deleting removes the connection
- [ ] Toggling "Mentions" button shows/hides dashed mention edges
- [ ] Mention edges do not appear when an explicit connection exists between the same pair
- [ ] Right-clicking a mention edge does nothing (not selectable)
- [ ] Right-clicking a node opens context menu: Open navigates, Hide removes node and adds to hidden panel
- [ ] Hidden panel shows hidden entities, clicking Show restores the node to canvas
- [ ] Hidden nodes survive page reload (stored in DbGraphLayout)
- [ ] Type filter buttons show/hide all nodes of a type
- [ ] Double-clicking a node navigates to that entity
- [ ] Fit button fits all visible nodes in view
- [ ] Deleting an entity in the Chronicle removes its connections from DbEntityConnection
