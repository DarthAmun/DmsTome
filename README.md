# DM Forge

An offline-first Progressive Web App for Dungeon Masters — campaign notes, world maps, and a full VTT encounter system. Runs entirely in the browser with no server required. Can be hosted for free on GitHub Pages.

## Technology Stack

| Layer | Tech |
|-------|------|
| App | PWA (installable, offline-capable) |
| Database | IndexedDB via Dexie.js |
| Frontend | Nuxt 3 (static/CSR) + Vue 3 |
| Styling | Tailwind CSS |
| UI Components | PrimeVue (unstyled) |
| Icons | oh-vue-icons |
| State | Pinia |
| Canvas / VTT | PixiJS v8 |
| Sync | BroadcastChannel API |

---

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 — all data is stored in your browser's IndexedDB.

## Production Build

```bash
pnpm generate     # outputs to .output/public/
```

## Deploy to GitHub Pages

1. Push to GitHub
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. Edit `.github/workflows/deploy.yml` — set `NUXT_APP_BASE_URL` to `/your-repo-name/`
4. Push to `main` → auto-deploys

Live at: `https://your-username.github.io/your-repo-name/`

---

## Project Structure

```
dm-forge/
├── composables/
│   ├── useDb.ts               # Dexie/IndexedDB layer (all data access)
│   └── useEncounterCanvas.ts  # PixiJS VTT engine
│
├── plugins/
│   ├── dmforge.client.ts      # Exposes window.dmforge → Dexie API
│   └── oh-vue-icons.client.ts
│
├── pages/
│   ├── index.vue                          # Campaign dashboard
│   ├── campaign/[id]/encounters.vue       # Encounters list
│   ├── campaign/[id]/notes.vue            # Notes / NPCs / Locations
│   ├── campaign/[id]/map.vue              # World map with pins
│   └── encounter/[id]/
│       ├── index.vue                      # DM encounter view (PixiJS)
│       └── player.vue                     # Player view (read-only)
│
├── components/
│   ├── WorldMap.vue           # Interactive map with entity pins
│   ├── NoteEditor.vue         # Split-pane markdown editor + preview
│   ├── EntityCard.vue         # Card for notes/NPCs/locations/items/factions
│   ├── AttributeEditor.vue    # Per-type attribute forms
│   └── NotesGraph.vue         # Cytoscape relationship graph
│
├── stores/
│   ├── encounter.ts           # Encounter state + player sync
│   └── notes.ts               # Entities (notes, NPCs, locations…)
│
├── types/
│   └── dmforge.d.ts           # window.dmforge type declarations
│
├── public/
│   ├── icons/                 # PWA icons (replace placeholders)
│   └── favicon.svg
│
└── .github/workflows/
    └── deploy.yml             # GitHub Pages auto-deploy
```

---

## Features

### Campaign Management
- Multiple campaigns, each with their own encounters, notes, and world map
- All data persists offline in IndexedDB

### Notes & Entities
- Five entity types: Notes, NPCs, Locations, Items, Factions
- Markdown editor with live split-pane preview
- `{{type: Name | key=value}}` syntax for entity links
- Relationship graph view (Cytoscape)
- World map with pins linking entities to locations

### World Map
- Load any image as a map (stored as base64)
- Pin any entity (NPC, faction, note…) to a location on the map
- Click pins for inline preview, drill down into sub-maps (city → district → dungeon)
- Locations support separate logo/banner and map images

### Encounters (VTT)
- Load map image, configure grid size and offset
- Token library — drag tokens onto the map, snap to grid
- Per-token: HP, initiative, size, conditions, visibility, dead/alive
- Fog of War — paint cells, hide all / reveal all
- Player View — opens in a separate browser tab, syncs in real-time via BroadcastChannel

---

## Data & Backups

All data lives in browser IndexedDB under the key `dmforge`.

To export: DevTools → Application → IndexedDB → right-click → Export  
The Dexie export/import plugin can be added for in-app backup/restore.

---

## window.dmforge API

The `window.dmforge` object is the unified data API, backed by Dexie in the browser.

```ts
// Campaigns
window.dmforge.campaigns.list()
window.dmforge.campaigns.create({ name, description })
window.dmforge.campaigns.delete(id)

// Encounters
window.dmforge.encounters.list(campaignId)
window.dmforge.encounters.get(id)          // includes joined tokens
window.dmforge.encounters.update({ id, ... })

// System
window.dmforge.system.openFileDialog()     // returns base64 data URL
window.dmforge.system.readImage(src)       // returns src (already data URL)

// Player window sync
window.dmforge.window.openPlayer(encounterId)   // window.open()
window.dmforge.window.syncEncounter(data)       // BroadcastChannel
```
