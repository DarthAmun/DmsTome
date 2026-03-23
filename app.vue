<template>
  <div id="app-root" @click="onMagicClick">
    <NuxtPage />
    <div id="spark-layer" aria-hidden="true" />
    <div class="spine-brand">
      <img src="/icons/icon-512.png" class="spine-logo" alt="GM Toolkit" />
      <span class="spine-version">v{{ version }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// ── Ink write animation ──────────────────────────────────────────
// Animates text characters as if being written on the parchment.
// Called on every route navigation.
function inkWritePage() {
  // Target all entry names, type labels, page titles, hints on the new page
  const selectors = [
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
  const targets = document.querySelectorAll(selectors.join(','))
  let t = 0
  targets.forEach((el: Element) => {
    const htmlEl = el as HTMLElement
    // Parse existing HTML to preserve em/strong tags
    const nodes = Array.from(htmlEl.childNodes)
    interface Part { ch: string; tag: string | null }
    const parts: Part[] = []
    nodes.forEach(node => {
      if (node.nodeType === Node.COMMENT_NODE) return  // skip Vue v-if/v-else markers
      if (node.nodeType === Node.TEXT_NODE) {
        (node.textContent || '').split('').forEach(ch => parts.push({ ch, tag: null }))
      } else if ((node as Element).tagName === 'EM') {
        (node.textContent || '').split('').forEach(ch => parts.push({ ch, tag: 'em' }))
      } else {
        // Other tags — treat as text
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

const router = useRouter()
router.afterEach(() => {
  // Small delay so the DOM has rendered the new route content
  nextTick(() => setTimeout(inkWritePage, 60))
})

function onMagicClick(e: MouseEvent) {
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

.spine-brand {
  position: fixed;
  right: 0;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 9px;
  background: var(--chrome);
  border: 1px solid var(--rim);
  border-right: none;
  border-radius: 4px 0 0 4px;
  z-index: 100;
  pointer-events: none;
}

.spine-logo {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
  opacity: 0.75;
}

.spine-version {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: var(--font-head);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #8a7a9a;
}
</style>
