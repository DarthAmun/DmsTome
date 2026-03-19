# DM Forge

A local-first Dungeon Master campaign management tool with a full VTT encounter system.

## Technology Stack

| Layer | Tech |
|-------|------|
| Shell | Electron 29 |
| Database | SQLite3 via better-sqlite3 |
| Frontend | Nuxt 3 (client-side only) + Vue 3 |
| Styling | Tailwind CSS |
| UI Components | PrimeVue or shadcn-vue (add as needed) |
| Icons | oh-vue-icons |
| State | Pinia |
| Canvas / VTT | PixiJS v8 |

---

## Project Structure

```
dm-forge/
├── electron/
│   ├── main.js          # Electron main process, SQLite, IPC handlers
│   └── preload.js       # Secure contextBridge API (window.dmforge)
│
├── pages/
│   ├── index.vue                          # Dashboard
│   ├── campaign/[id]/encounters.vue       # Campaign encounters list
│   └── encounter/
│       ├── [id]/index.vue                 # DM encounter editor (PixiJS)
│       └── [id]/player.vue               # Player view (read-only)
│
├── stores/
│   └── encounter.ts      # Pinia store: encounter state, sync, persistence
│
├── composables/
│   └── useEncounterCanvas.ts  # PixiJS VTT engine
│
├── plugins/
│   └── oh-vue-icons.client.ts
│
├── assets/css/main.css   # Global styles + Tailwind base
├── tailwind.config.ts
└── nuxt.config.ts
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm

### Install

```bash
cd dm-forge
npm install
# Also install Nuxt-specific packages:
npm install @pinia/nuxt @nuxtjs/tailwindcss pinia
npm install pixi.js oh-vue-icons
npm install -D @types/better-sqlite3
```

### Development

```bash
npm run dev
# Starts Nuxt dev server + Electron concurrently
```

### Production Build

```bash
npm run build
# Outputs to /dist
```

---

## Encounter Features

### Map
- Load from local disk (file picker) or paste a URL
- Configurable grid: size (px per cell) + X/Y offset to align with map art grids
- Infinite pan (middle-mouse drag or Alt+drag) and scroll zoom

### Tokens
- Token Library: reusable tokens stored in SQLite, shown in left sidebar
- Drag tokens from sidebar directly onto the map → snap to grid
- Per-token state:
  - **Visible** — shown in Player View (toggle per token)
  - **Dead** — red ring, grayed image
  - **Size** — 1×1, 2×2, 3×3, 4×4 (tiles)
  - **Position** — grid coordinates, draggable
  - HP current/max, initiative, label, notes

### Fog of War
- Select the Fog tool → click or paint cells to reveal/hide
- "Hide All" covers entire map; "Reveal All" clears fog
- Fog state syncs to Player View in real-time

### Dual Window
- **DM View**: full controls, invisible tokens visible (dimmed), fog paintable
- **Player View**: separate Electron window → use for screenshare or second screen
  - Only shows visible tokens
  - Fog cells are fully opaque (players can't see through)
  - Real-time sync via Electron IPC

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `campaigns` | Top-level campaign records |
| `encounters` | Encounter per campaign, stores map + grid + fog + viewport |
| `tokens` | Reusable token library (image + name) |
| `encounter_tokens` | Token instances placed in a specific encounter |

All data is stored in `{userData}/dmforge.db` (SQLite).

---

## Extending (Roadmap Stubs)

The dashboard already has placeholder cards for:
- **NPCs** — character sheets, relationships
- **Notes** — rich text per campaign
- **Locations** — gazetteer
- **Timeline** — event log
- **Items** — loot & equipment tracker

Each module gets its own `pages/`, `stores/`, and DB tables added incrementally.

---

## Fog of War Internals

Fog is stored as a sparse JSON map: `{ "col,row": "hidden" | "revealed" | "partial" }`.
The special key `_allHidden: "hidden"` acts as a "cover everything" flag, so revealing
cells just adds them to the revealed set without needing to enumerate every cell upfront.

---

## IPC API (`window.dmforge`)

Exposed via `electron/preload.js` using `contextBridge`. All calls are `async`.

```ts
window.dmforge.campaigns.list()
window.dmforge.encounters.get(id)
window.dmforge.encounterTokens.update({ id, gridX, gridY })
window.dmforge.system.openFileDialog()
window.dmforge.system.readImage(filePath)  // returns base64 data URL
window.dmforge.window.openPlayer(encounterId)
window.dmforge.window.syncEncounter(data)  // pushes to player window via IPC
```
