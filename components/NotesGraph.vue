<template>
  <div class="graph-container">
    <div class="graph-toolbar">
      <button class="f-btn f-btn--ghost f-btn--sm" @click="resetLayout">
        <OhVueIcon name="md-autoawesome" scale="0.8" /> Reset
      </button>
      <button class="f-btn f-btn--ghost f-btn--sm" @click="fitView">
        <OhVueIcon name="md-map" scale="0.8" /> Fit
      </button>
      <div class="type-filters">
        <button v-for="t in typeTabs" :key="t.type"
          class="type-filter-btn"
          :class="{ active: activeTypes.has(t.type) }"
          :style="activeTypes.has(t.type) ? { borderColor: t.color, color: t.color, background: t.color + '18' } : {}"
          @click="toggleType(t.type)">
          <span class="legend-dot" :style="{ background: activeTypes.has(t.type) ? t.color : 'var(--ink-ghost)' }" />
          {{ t.plural }}
        </button>
      </div>
    </div>
    <div ref="cyContainer" class="cy-canvas" />
    <div v-if="tooltip.show" class="graph-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      <div class="tooltip-name">{{ tooltip.name }}</div>
      <div class="tooltip-type">{{ tooltip.type }}</div>
      <div v-if="tooltip.meta" class="tooltip-meta">{{ tooltip.meta }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotesStore } from '~/stores/notes'
import { ENTITY_TYPE_CONFIG } from '~/types/entities'
import {
  GiScrollUnfurled, GiBookAura, GiDeathNote, GiMagicHat,
  GiHouseKeys, GiSandsOfTime, GiAllSeeingEye, GiCastle,
  GiCoins, GiBroadsword,
} from 'oh-vue-icons/icons/gi'

const props = defineProps<{ campaignId: number }>()
const emit = defineEmits<{ navigate: [type: string, name: string] }>()

const store = useNotesStore()
const cyContainer = ref<HTMLElement | null>(null)
let cy: any = null

const tooltip = ref({ show: false, x: 0, y: 0, name: '', type: '', meta: '' })
const typeTabs = Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => ({ type, ...cfg }))
const typeColorMap = Object.fromEntries(Object.entries(ENTITY_TYPE_CONFIG).map(([t, c]) => [t, c.color]))
const activeTypes = ref<Set<string>>(new Set(Object.keys(ENTITY_TYPE_CONFIG)))

function toggleType(type: string) {
  const next = new Set(activeTypes.value)
  if (next.has(type)) {
    if (next.size === 1) return // keep at least one
    next.delete(type)
  } else {
    next.add(type)
  }
  activeTypes.value = next
  applyTypeFilter()
}

function applyTypeFilter() {
  if (!cy) return
  cy.nodes().forEach((node: any) => {
    if (activeTypes.value.has(node.data('type'))) {
      node.style('display', 'element')
    } else {
      node.style('display', 'none')
    }
  })
  cy.edges().forEach((edge: any) => {
    const srcVisible = activeTypes.value.has(edge.source().data('type'))
    const tgtVisible = activeTypes.value.has(edge.target().data('type'))
    edge.style('display', srcVisible && tgtVisible ? 'element' : 'none')
  })
}

// Registry mapping icon name -> oh-vue-icons icon object
const iconRegistry: Record<string, any> = {
  'gi-scroll-unfurled': GiScrollUnfurled,
  'gi-book-aura': GiBookAura,
  'gi-death-note': GiDeathNote,
  'gi-magic-hat': GiMagicHat,
  'gi-house-keys': GiHouseKeys,
  'gi-sands-of-time': GiSandsOfTime,
  'gi-all-seeing-eye': GiAllSeeingEye,
  'gi-castle': GiCastle,
  'gi-coins': GiCoins,
  'gi-broadsword': GiBroadsword,
}

// Fallback: colored circle with initial letter
function makeInitialDataUrl(color: string, initial: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="21" fill="#1e1e1e" stroke="${color}" stroke-width="1.5"/>
    <text x="22" y="28" text-anchor="middle" font-family="var(--font-display)" font-size="16" font-weight="700" fill="${color}">${initial}</text>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

// Render an oh-vue-icons icon as a circular SVG data URL
function makeOhIconDataUrl(iconName: string, color: string): string | null {
  const icon = iconRegistry[iconName]
  if (!icon?.raw) return null

  const iconSize = 28
  const offset = (44 - iconSize) / 2
  const scaleX = iconSize / icon.width
  const scaleY = iconSize / icon.height
  const translateX = offset - icon.minX * scaleX
  const translateY = offset - icon.minY * scaleY

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="21" fill="#1e1e1e" stroke="${color}" stroke-width="1.5"/>
    <g transform="translate(${translateX},${translateY}) scale(${scaleX},${scaleY})" fill="${color}">
      ${icon.raw}
    </g>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

async function getNodeImage(entity: any): Promise<string> {
  const attrs = entity.attributes ?? {}
  const color = typeColorMap[entity.type] ?? '#606060'

  // Notes: render the selected icon
  if (entity.type === 'note' && attrs.icon) {
    const iconUrl = makeOhIconDataUrl(attrs.icon, color)
    if (iconUrl) return iconUrl
  }

  // Other entities: use portrait/image if available
  const imageSrc = attrs.portraitSource || attrs.imageSource
  const imageType = attrs.portraitType || attrs.imageType
  if (imageSrc) {
    try {
      // Images are stored as data URLs in IndexedDB, just return directly
      if (imageSrc) return imageSrc
    } catch { /* fall through */ }
  }

  // Fallback: initial letter in type color
  return makeInitialDataUrl(color, entity.name.charAt(0).toUpperCase())
}

async function buildNodesWithImages() {
  const entityMap = Object.fromEntries(
    store.entities
      .filter(e => e.campaignId === props.campaignId)
      .map(e => [`${e.type}-${e.id}`, e])
  )
  const imageMap: Record<string, string> = {}
  await Promise.all(
    Object.entries(entityMap).map(async ([key, entity]) => {
      imageMap[key] = await getNodeImage(entity)
    })
  )
  const { nodes, edges } = store.getGraphData(props.campaignId)
  const nodesWithImages = nodes.map((n: any) => ({
    data: { ...n.data, image: imageMap[n.data.id] ?? '' }
  }))
  return { nodesWithImages, edges }
}

onMounted(async () => {
  const [cytoscape, layoutExt] = await Promise.all([
    import('cytoscape'),
    import('cytoscape-cose-bilkent'),
  ])
  const Cytoscape = cytoscape.default
  Cytoscape.use(layoutExt.default)

  const { nodesWithImages, edges } = await buildNodesWithImages()

  cy = Cytoscape({
    container: cyContainer.value,
    elements: [...nodesWithImages, ...edges],
    style: buildStyle(),
    layout: { name: 'cose-bilkent', animate: true, animationDuration: 500, randomize: true, idealEdgeLength: 120, nodeRepulsion: 8000 },
    wheelSensitivity: 0.3,
  })

  cy.on('tap', 'node', (evt: any) => {
    const { type, label } = evt.target.data()
    emit('navigate', type, label)
  })
  cy.on('mouseover', 'node', (evt: any) => {
    const pos = evt.renderedPosition
    tooltip.value = { show: true, x: pos.x + 12, y: pos.y - 10, name: evt.target.data('label'), type: evt.target.data('type'), meta: '' }
  })
  cy.on('mouseover', 'edge', (evt: any) => {
    const pos = evt.renderedPosition
    tooltip.value = { show: true, x: pos.x + 12, y: pos.y - 10, name: `${evt.target.source().data('label')} → ${evt.target.target().data('label')}`, type: 'link', meta: evt.target.data('label') ?? '' }
  })
  cy.on('mouseout', 'node edge', () => { tooltip.value.show = false })
})

watch(() => store.links, async () => {
  if (!cy) return
  const { nodesWithImages, edges } = await buildNodesWithImages()
  cy.elements().remove()
  cy.add([...nodesWithImages, ...edges])
  cy.style(buildStyle())
  resetLayout()
}, { deep: true })

function buildStyle() {
  return [
    {
      selector: 'node',
      style: {
        'width': '44px',
        'height': '44px',
        'background-color': (ele: any) => typeColorMap[ele.data('type')] ?? '#606060',
        'background-image': (ele: any) => ele.data('image') || 'none',
        'background-fit': 'cover',
        'background-clip': 'node',
        'border-width': '2px',
        'border-color': (ele: any) => typeColorMap[ele.data('type')] ?? '#606060',
        'border-opacity': 0.8,
        'shape': 'ellipse',
        'label': 'data(label)',
        'color': '#f0f0f0',
        'font-family': 'DM Sans, system-ui, sans-serif',
        'font-size': '11px',
        'text-valign': 'bottom',
        'text-margin-y': '6px',
        'text-outline-color': '#141414',
        'text-outline-width': '2px',
        'cursor': 'pointer',
      },
    },
    {
      selector: 'node:selected',
      style: { 'border-width': '3px', 'border-opacity': 1, 'width': '52px', 'height': '52px' },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#484848',
        'target-arrow-color': '#484848',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'color': '#a0a0a0',
        'text-outline-color': '#141414',
        'text-outline-width': '2px',
        'font-family': 'DM Sans, system-ui, sans-serif',
      },
    },
    {
      selector: 'edge:hover',
      style: { 'line-color': '#b8860b', 'target-arrow-color': '#b8860b' },
    },
  ]
}

function resetLayout() {
  cy?.layout({ name: 'cose-bilkent', animate: true, animationDuration: 400, randomize: false, idealEdgeLength: 120, nodeRepulsion: 8000 }).run()
}
function fitView() { cy?.fit(undefined, 40) }
onUnmounted(() => { cy?.destroy() })
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
  position: relative;
}

.graph-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--parch-dark);
  border-bottom: 1px solid var(--parch-line);
  flex-shrink: 0;
}

.type-filters {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 8px;
  flex-wrap: wrap;
}

.type-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--parch-dark);
  border: 1px solid var(--parch-line);
  color: var(--ink-ghost);
  font-size: 11px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}
.type-filter-btn:hover { color: var(--ink); }

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cy-canvas {
  flex: 1;
  background-color: var(--parch); background-image: var(--paper); background-blend-mode: multiply;
}

.graph-tooltip {
  position: absolute;
  pointer-events: none;
  background: #1e1e1e;
  border: 1px solid #484848;
  border-radius: 8px;
  padding: 8px 12px;
  z-index: 100;
  max-width: 200px;
}

.tooltip-name {
  font-family: var(--font-display);
  font-size: 13px;
  color: var(--gold);
}

.tooltip-type {
  font-size: 11px;
  color: #606060;
  font-family: 'DM Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.tooltip-meta {
  font-size: 11px;
  color: var(--gold);
  margin-top: 2px;
  font-family: 'DM Sans', sans-serif;
}
</style>