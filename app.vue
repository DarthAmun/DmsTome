<template>
  <div id="app-root" @click="onMagicClick">
    <NuxtPage />
    <div id="spark-layer" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
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
</style>
