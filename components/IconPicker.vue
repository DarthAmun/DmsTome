<template>
  <div class="icon-picker">
    <!-- Trigger -->
    <button ref="triggerEl" class="icon-trigger" :style="{ borderColor: color + '55' }" @click.stop="toggle">
      <OhVueIcon :name="modelValue || 'gi-scroll-unfurled'" scale="1.2" :style="{ color }" />
      <span class="icon-trigger-name">{{ modelValue || 'choose icon' }}</span>
      <OhVueIcon name="md-arrowdropdown" scale="0.9" style="color:var(--ink-ghost);margin-left:auto" />
    </button>

    <!-- Dropdown (teleported to body to escape overflow clipping) -->
    <Teleport to="body">
      <div v-if="open" class="icon-dropdown" :style="dropStyle" @click.stop>

        <!-- Search -->
        <div class="icon-search-wrap">
          <OhVueIcon name="fa-search" scale="0.75" style="color:var(--ink-ghost)" />
          <input ref="searchEl" v-model="query" class="icon-search" placeholder="Search the codex…" />
          <button v-if="query" class="icon-clear" @click="query = ''">
            <OhVueIcon name="md-close" scale="0.8" />
          </button>
        </div>

        <!-- Category tabs (hidden while searching) -->
        <div v-if="!query" class="icon-cats">
          <button
            v-for="cat in CATEGORIES" :key="cat.id"
            class="icon-cat" :class="{ active: activeCat === cat.id }"
            @click="activeCat = cat.id"
          >
            <OhVueIcon :name="cat.icon" scale="0.85" />
            <span>{{ cat.label }}</span>
          </button>
        </div>

        <!-- Chapter divider -->
        <div class="icon-chapter">
          <span class="icon-chapter-rule" />
          <span class="icon-chapter-label">
            {{ query ? `Results for "${query}"` : currentCat.label }}
          </span>
          <span class="icon-chapter-rule" />
        </div>

        <!-- Grid -->
        <div class="icon-grid">
          <button
            v-for="name in visible" :key="name"
            class="icon-cell"
            :class="{ selected: modelValue === name }"
            :style="modelValue === name ? { background: color + '1a', borderColor: color + '99' } : {}"
            :title="name.replace('gi-', '').replace(/-/g, ' ')"
            @click="select(name)"
          >
            <OhVueIcon :name="name" scale="1.3" :style="{ color: modelValue === name ? color : '' }" />
            <span class="icon-cell-label">{{ name.replace('gi-', '').replace(/-/g, ' ') }}</span>
          </button>
          <div v-if="visible.length === 0" class="icon-empty">
            <OhVueIcon name="gi-scroll-unfurled" scale="2" style="opacity:0.1;margin-bottom:8px" />
            <em>Nothing found in the codex.</em>
          </div>
        </div>

      </div>

      <!-- Backdrop -->
      <div v-if="open" class="icon-backdrop" @click="open = false" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import * as GiIcons from 'oh-vue-icons/icons/gi'

const ALL_GI: string[] = Object.values(GiIcons)
  .map((v: any) => v?.name)
  .filter((n): n is string => typeof n === 'string' && n.startsWith('gi-'))

const ICON_SET = new Set(ALL_GI)
function avail(names: string[]): string[] {
  return names.filter(n => ICON_SET.has(n))
}

const CATEGORIES = [
  { id: 'combat',   label: 'Combat',   icon: 'gi-broadsword' },
  { id: 'magic',    label: 'Magic',    icon: 'gi-magic-palm' },
  { id: 'creature', label: 'Creatures',icon: 'gi-spiked-dragon-head' },
  { id: 'world',    label: 'World',    icon: 'gi-castle' },
  { id: 'item',     label: 'Items',    icon: 'gi-open-treasure-chest' },
  { id: 'people',   label: 'People',   icon: 'gi-hood' },
  { id: 'symbol',   label: 'Symbols',  icon: 'gi-all-seeing-eye' },
]

const CAT_ICONS: Record<string, string[]> = {
  combat: avail([
    'gi-broadsword','gi-crossed-swords','gi-dagger','gi-axe','gi-war-hammer',
    'gi-two-handed-sword','gi-sword-wound','gi-lightning-sword','gi-flame-sword',
    'gi-ice-sword','gi-crystal-sword','gi-poison-dagger','gi-throwing-knife',
    'gi-katana','gi-sai','gi-halberd','gi-trident','gi-spear','gi-lance',
    'gi-bow-arrow','gi-crossbow','gi-arrow-cluster','gi-quiver',
    'gi-shield','gi-round-shield','gi-spiked-shield','gi-shield-reflect',
    'gi-knight-helmet','gi-full-metal-bucket-helmet','gi-barbute','gi-spartan-helmet',
    'gi-chest-armor','gi-gauntlet','gi-boots','gi-greaves','gi-pauldrons',
    'gi-backstab','gi-sword-break','gi-spinning-sword','gi-whirlwind-blade',
  ]),
  magic: avail([
    'gi-magic-palm','gi-crystal-ball','gi-wizard-staff','gi-spell-book','gi-book-aura',
    'gi-magic-hat','gi-magic-swirl','gi-fairy-wand','gi-crystal-wand','gi-wand',
    'gi-all-seeing-eye','gi-rune-stone','gi-pentacle','gi-pentagram-rose',
    'gi-cauldron','gi-bubbling-potion','gi-health-potion','gi-potion-ball',
    'gi-ancient-scroll','gi-alchemy-juggling','gi-fire-symbol','gi-ice-spell-cast',
    'gi-lightning-storm','gi-holy-symbol','gi-summoning','gi-teleport',
    'gi-orb','gi-scrying-orb','gi-eye-of-newt','gi-witch-flight',
    'gi-ankh','gi-infinity','gi-chakra','gi-spiral',
  ]),
  creature: avail([
    'gi-dragon','gi-dragon-head','gi-dragon-spiral','gi-wolf-head','gi-bear-head',
    'gi-shark','gi-brain-tentacle','gi-hydra','gi-kraken-tentacle','gi-crab-claw',
    'gi-snake','gi-bat','gi-spider','gi-spider-web','gi-scorpion',
    'gi-skull','gi-burning-skull','gi-candle-skull','gi-demon-skull','gi-bone',
    'gi-ghost','gi-ghost-ally','gi-wraith','gi-undead-slayer',
    'gi-bull-horns','gi-ram-head','gi-horse-head','gi-hawk-emblem',
    'gi-goblin','gi-troll','gi-ogre','gi-imp','gi-demon-fire',
    'gi-fairy','gi-pixie-boots','gi-elf-ear',
  ]),
  world: avail([
    'gi-castle','gi-tower','gi-dungeon-gate','gi-cave',
    'gi-campfire','gi-ancient-ruins','gi-lighthouse','gi-windmill',
    'gi-treasure-map','gi-map','gi-path-tile','gi-mountain-road',
    'gi-bridge','gi-port','gi-sailing-ship','gi-longboat',
    'gi-forest','gi-tree','gi-pine-tree','gi-cactus','gi-mushrooms',
    'gi-door','gi-prison','gi-stairs','gi-pillar',
    'gi-throne','gi-altar','gi-fireplace','gi-tombstone',
    'gi-galaxy','gi-moon','gi-sun','gi-cloud',
  ]),
  item: avail([
    'gi-scroll-unfurled','gi-open-treasure-chest','gi-chest','gi-key','gi-lock',
    'gi-pouch','gi-backpack','gi-sack','gi-barrel',
    'gi-gem','gi-ring','gi-necklace','gi-earrings',
    'gi-coins','gi-gold-bar','gi-diamond','gi-ruby',
    'gi-book','gi-notebook','gi-death-note','gi-tied-scroll',
    'gi-anvil-impact','gi-blacksmith','gi-hammer','gi-pickaxe',
    'gi-health-potion','gi-potion','gi-flask','gi-bottle',
    'gi-holy-grail','gi-chalice','gi-lantern','gi-torch',
    'gi-telescope','gi-compass','gi-hourglass','gi-sands-of-time',
    'gi-rope','gi-wavy-chains','gi-fishing-hook',
  ]),
  people: avail([
    'gi-person','gi-hood','gi-ninja-heroic-stance','gi-cloak-and-dagger',
    'gi-knight-banner','gi-archer','gi-wizard-face','gi-alchemist',
    'gi-witch-flight','gi-sorceress','gi-druid','gi-monk-face',
    'gi-king','gi-queen-crown','gi-noble-woman','gi-peasant',
    'gi-spy','gi-assassin','gi-thief','gi-pirate',
    'gi-viking','gi-samurai','gi-ninja-heroic-stance',
    'gi-skeleton','gi-zombie-grab','gi-mummy-head',
  ]),
  symbol: avail([
    'gi-all-seeing-eye','gi-crown','gi-triple-corn','gi-trefoil-lily',
    'gi-american-shield','gi-crest','gi-heraldic-sun','gi-moon-claws',
    'gi-sands-of-time','gi-scales','gi-justice-sword','gi-gavel',
    'gi-dice-six','gi-dice-twenty','gi-rolling-dice-cup','gi-card-ace-spades',
    'gi-playing-cards','gi-poker-hand','gi-card-draw','gi-card-pickup',
    'gi-ankh','gi-ouroboros','gi-yin-yang','gi-triforce',
    'gi-celtic-shield-knot','gi-nordic-helm','gi-rune-stone',
    'gi-star','gi-compass','gi-infinity','gi-target',
  ]),
}

const props = defineProps<{
  modelValue: string
  color?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)
const query = ref('')
const activeCat = ref('combat')
const searchEl = ref<HTMLInputElement | null>(null)
const triggerEl = ref<HTMLElement | null>(null)
const dropPos = ref({ top: 0, left: 0 })

const currentCat = computed(() => CATEGORIES.find(c => c.id === activeCat.value) ?? CATEGORIES[0])

const dropStyle = computed(() => ({
  position: 'fixed' as const,
  top: dropPos.value.top + 'px',
  left: dropPos.value.left + 'px',
}))

const visible = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (q) return ALL_GI.filter(n => n.includes(q)).slice(0, 120)
  return CAT_ICONS[activeCat.value] ?? []
})

watch(open, v => {
  if (v) nextTick(() => searchEl.value?.focus())
})

function toggle() {
  if (!open.value) {
    const rect = triggerEl.value?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 476)
      dropPos.value = { top: rect.bottom + 6, left: Math.max(0, left) }
    }
  }
  open.value = !open.value
}

function select(name: string) {
  emit('update:modelValue', name)
  open.value = false
  query.value = ''
}
</script>

<style scoped>
.icon-picker { position: relative; }

.icon-trigger {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; border-radius: var(--r);
  background: var(--parch-dark); border: 1px solid;
  color: var(--ink); cursor: pointer;
  font-size: 13px; font-family: var(--font-ui);
  width: 100%; transition: all 0.15s;
}
.icon-trigger:hover { background: rgba(28,20,16,0.08); /* = var(--ink) at 8% opacity */ }
.icon-trigger-name { font-size: 12px; color: var(--ink-ghost); flex: 1; text-align: left; }

/* ── Dropdown ── */
.icon-dropdown {
  position: fixed;
  width: 470px; max-height: 480px;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply; border: 1px solid var(--ink-ghost);
  border-radius: 3px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2),
              inset 0 1px 0 rgba(255,255,255,0.06);
  z-index: var(--z-sidebar); display: flex; flex-direction: column; overflow: hidden;
}
.icon-backdrop { position: fixed; inset: 0; z-index: calc(var(--z-sidebar) - 1); }

/* ── Search ── */
.icon-search-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0; background: var(--parch-dark);
}
.icon-search {
  flex: 1; background: none; border: none; outline: none;
  font-size: 13px; color: var(--ink); font-family: var(--font-ui);
}
.icon-search::placeholder { color: var(--ink-ghost); font-style: italic; }
.icon-clear { background: none; border: none; color: var(--ink-ghost); cursor: pointer; padding: 2px; line-height: 0; }

/* ── Category tabs ── */
.icon-cats {
  display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 0;
  border-bottom: 1px solid var(--parch-line); flex-shrink: 0;
  background: var(--parch-dark);
  scrollbar-width: none;
}
.icon-cats::-webkit-scrollbar { display: none; }

.icon-cat {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 6px 8px; flex-shrink: 0;
  background: none; border: none; border-right: 1px solid var(--parch-line);
  color: var(--ink-ghost); cursor: pointer;
  font-family: var(--font-head); font-size: 7px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  transition: all 0.15s; position: relative;
}
.icon-cat:last-child { border-right: none; }
.icon-cat:hover { color: var(--ink); background: rgba(28,20,16,0.04); /* = var(--ink) at 4% opacity */ }
.icon-cat.active {
  color: var(--blood); background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  border-bottom: 2px solid var(--blood);
  margin-bottom: -1px;
}

/* ── Chapter divider ── */
.icon-chapter {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 14px; flex-shrink: 0;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
}
.icon-chapter-rule { flex: 1; height: 1px; background: var(--parch-line); }
.icon-chapter-label {
  font-family: var(--font-head); font-size: 8px; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-ghost);
  white-space: nowrap; flex-shrink: 0;
}

/* ── Icon grid ── */
.icon-grid {
  flex: 1; overflow-y: auto;
  display: grid; grid-template-columns: repeat(8, 1fr);
  gap: 3px; padding: 10px 10px 14px;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  scrollbar-width: thin;
  scrollbar-color: var(--parch-line) transparent;
}
.icon-grid::-webkit-scrollbar { width: 5px; }
.icon-grid::-webkit-scrollbar-track { background: transparent; }
.icon-grid::-webkit-scrollbar-thumb { background: var(--parch-line); border-radius: 3px; }

.icon-cell {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; padding: 7px 4px 6px;
  border-radius: 3px; background: transparent;
  border: 1px solid transparent;
  cursor: pointer; transition: all 0.12s;
  color: var(--ink-faded);
  min-height: 56px;
}
.icon-cell:hover {
  background: var(--parch-dark);
  border-color: var(--parch-line);
  color: var(--ink);
}
.icon-cell.selected {
  border-color: currentColor;
}

.icon-cell-label {
  font-family: var(--font-head);
  font-size: 6.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  width: 100%;
}
.icon-cell:hover .icon-cell-label { color: var(--ink-faded); }
.icon-cell.selected .icon-cell-label { color: inherit; opacity: 0.7; }

/* ── Empty state ── */
.icon-empty {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 16px;
  color: var(--ink-ghost);
  font-family: var(--font-body); font-size: 14px; font-style: italic;
}
</style>
