<template>
  <div id="app-root" @click="onMagicClick">
    <NuxtPage />
    <DiceRoller v-if="!isPlayerRoute" />
    <div id="spark-layer" aria-hidden="true" />
    <Transition name="install">
      <button v-if="installPrompt" class="install-pill" @click="installApp" title="Install DM's Tome">
        <OhVueIcon name="md-install-mobile" scale="0.9" />
        Install App
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useSettings } from '~/composables/useSettings'
const { settings } = useSettings()

const route = useRoute()
const isPlayerRoute = computed(() =>
  route.path.endsWith('/player') || route.path.endsWith('/map-player')
)

// ── Ink write animation ──────────────────────────────────────────
const INK_SELECTORS = [
  '.entry-name',
  '.leaf-type',
  '.leaf-new-label',
  '.page-title',
  '.right-hint',
  '.folio-chapter-name',
  '.folio-chapter-sub',
  '.sys-stat-num',
  '.loc-detail-name',
]

function inkWritePage() {
  const targets = document.querySelectorAll(INK_SELECTORS.join(','))
  let t = 0
  targets.forEach((el: Element) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.opacity = ''  // clear pre-hide
    const nodes = Array.from(htmlEl.childNodes)
    interface Part { ch: string; tag: string | null }
    const parts: Part[] = []
    nodes.forEach(node => {
      if (node.nodeType === Node.COMMENT_NODE) return
      if (node.nodeType === Node.TEXT_NODE) {
        (node.textContent || '').split('').forEach(ch => parts.push({ ch, tag: null }))
      } else if ((node as Element).tagName === 'EM') {
        (node.textContent || '').split('').forEach(ch => parts.push({ ch, tag: 'em' }))
      } else {
        (node.textContent || '').split('').forEach(ch => parts.push({ ch, tag: null }))
      }
    })
    const n = parts.length
    if (n === 0) return
    const stagger = Math.min(14, Math.max(3, 220 / n))
    htmlEl.innerHTML = parts.map((p, i) => {
      const delay = (t + i * stagger).toFixed(1)
      const ch = p.ch === ' ' ? '&nbsp;' : p.ch.replace(/&/g,'&amp;').replace(/</g,'&lt;')
      const span = `<span class="ink-c" style="animation-delay:${delay}ms">${ch}</span>`
      return p.tag ? `<${p.tag}>${span}</${p.tag}>` : span
    }).join('')
    t += n * stagger * 0.55
    if (t > 320) t = 320
  })
}

const { public: { version } } = useRuntimeConfig()

// ── PWA install prompt ───────────────────────────────────────────
const installPrompt = ref<Event | null>(null)

if (import.meta.client) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installPrompt.value = e
  })
  window.addEventListener('appinstalled', () => {
    installPrompt.value = null
  })
}

async function installApp() {
  const prompt = installPrompt.value as any
  if (!prompt) return
  prompt.prompt()
  const { outcome } = await prompt.userChoice
  if (outcome === 'accepted') installPrompt.value = null
}

const router = useRouter()
router.afterEach(() => {
  nextTick(() => {
    if (!settings.value.inkWrite) return
    document.querySelectorAll(INK_SELECTORS.join(',')).forEach(el => {
      (el as HTMLElement).style.opacity = '0'
    })
    setTimeout(inkWritePage, 60)
  })
})

function onMagicClick(e: MouseEvent) {
  if (!settings.value.sparkEffects) return
  const el = e.target as HTMLElement
  if (!el.closest('button, a, .spine-tab, .ink-card, .v6-card, .ink-card-new, .entry')) return
  const layer = document.getElementById('spark-layer')
  if (!layer) return
  const palette = ['var(--gold)', '#f0bc2a', 'var(--blood)', '#c05000', '#e8dcc5', '#7c3aed']
  const n = 5 + Math.floor(Math.random() * 6)
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div')
    s.className = 'arcane-spark'
    s.style.left = e.clientX + 'px'
    s.style.top = e.clientY + 'px'
    const col = palette[Math.floor(Math.random() * palette.length)]
    s.style.background = col
    s.style.boxShadow = `0 0 4px ${col}`
    const a = (Math.PI * 2 * i / n) + (Math.random() - 0.5)
    const d = 15 + Math.random() * 45
    s.style.setProperty('--sx', (Math.cos(a) * d) + 'px')
    s.style.setProperty('--sy', (Math.sin(a) * d - 15) + 'px')
    s.style.animationDuration = (0.35 + Math.random() * 0.35) + 's'
    layer.appendChild(s)
    s.addEventListener('animationend', () => s.remove(), { once: true })
  }
}
</script>

<style>
#app-root {
  height: 100vh;
  overflow: hidden;
  background: var(--leather);
}

#spark-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99999;
  overflow: hidden;
}

/* PWA install pill — bottom-center, only when browser offers install */
.install-pill {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: var(--leather);
  border: 1px solid rgba(184,134,11,0.4);
  border-radius: 999px;
  color: rgba(184,134,11,0.8);
  font-family: var(--font-head);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0,0,0,0.6);
  transition: all 0.2s;
}
.install-pill:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: #1a1208;
}

/* Slide up / fade in transition */
.install-enter-active, .install-leave-active { transition: opacity 0.3s, transform 0.3s; }
.install-enter-from, .install-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }
</style>
