import * as PIXI from 'pixi.js'
import { useEncounterStore } from '~/stores/encounter'

export interface CanvasOptions {
  container: HTMLElement
  isDmMode: boolean
  getActiveTool: () => string
  onTokenMoved?: (instanceId: number, gridX: number, gridY: number) => void
  onFogToggle?: (cellKey: string, newState: 'revealed' | 'hidden') => void
}

export function useEncounterCanvas(options: CanvasOptions) {
  const store = useEncounterStore()
  let app: PIXI.Application | null = null
  let worldContainer: PIXI.Container | null = null
  let mapSprite: PIXI.Sprite | null = null
  let gridGraphics: PIXI.Graphics | null = null
  let fogContainer: PIXI.Container | null = null
  let tokenContainer: PIXI.Container | null = null

  let viewport = { x: 0, y: 0, scale: 1 }
  let isPanning = false
  let panStart = { x: 0, y: 0 }
  let panViewStart = { x: 0, y: 0 }

  let fogPaintActive = false
  let fogPaintMode: 'revealed' | 'hidden' = 'revealed'

  // ── Fog painting ───────────────────────────────────────────────────────────
  function paintFogAtScreen(screenX: number, screenY: number) {
    const enc = store.current
    if (!enc) return
    const { gridSize, gridOffsetX, gridOffsetY } = enc
    const worldX = (screenX - viewport.x) / viewport.scale
    const worldY = (screenY - viewport.y) / viewport.scale
    const col = Math.floor((worldX - gridOffsetX) / gridSize)
    const row = Math.floor((worldY - gridOffsetY) / gridSize)
    if (col < 0 || row < 0) return

    console.log('painting fog at', col, row, fogPaintMode)  // ← add this
    options.onFogToggle?.(`${col},${row}`, fogPaintMode)
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    app = new PIXI.Application()
    await app.init({
      resizeTo: options.container,
      backgroundColor: 0x0e0e1a,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    })

    options.container.appendChild(app.canvas)

    worldContainer = new PIXI.Container()
    app.stage.addChild(worldContainer)

    mapSprite = new PIXI.Sprite()
    gridGraphics = new PIXI.Graphics()
    fogContainer = new PIXI.Container()
    tokenContainer = new PIXI.Container()

    worldContainer.addChild(mapSprite)
    worldContainer.addChild(gridGraphics)
    worldContainer.addChild(fogContainer)
    worldContainer.addChild(tokenContainer)

    setupInteraction()
    return app
  }

  // ── Map ────────────────────────────────────────────────────────────────────
  async function loadMap(source: string, type: 'file' | 'url') {
    if (!app || !worldContainer || !mapSprite) return

    let url = source

    const texture = await PIXI.Assets.load(url)
    mapSprite.texture = texture
    mapSprite.x = 0
    mapSprite.y = 0

    viewport.x = (app.screen.width - texture.width * viewport.scale) / 2
    viewport.y = (app.screen.height - texture.height * viewport.scale) / 2
    applyViewport()

    drawGrid()
    redrawFog()
  }

  // ── Grid ───────────────────────────────────────────────────────────────────
  function drawGrid() {
    if (!gridGraphics || !mapSprite) return
    const enc = store.current
    if (!enc) return

    gridGraphics.clear()
    const { gridSize, gridOffsetX, gridOffsetY } = enc
    const mapW = mapSprite.texture.width
    const mapH = mapSprite.texture.height

    gridGraphics.setStrokeStyle({ width: 1 / viewport.scale, color: 0xeeeeee, alpha: 0.35 })
    gridGraphics.beginPath()

    for (let x = gridOffsetX % gridSize; x < mapW; x += gridSize) {
      gridGraphics.moveTo(x, 0)
      gridGraphics.lineTo(x, mapH)
    }
    for (let y = gridOffsetY % gridSize; y < mapH; y += gridSize) {
      gridGraphics.moveTo(0, y)
      gridGraphics.lineTo(mapW, y)
    }
    gridGraphics.stroke()
  }

  // ── Fog of War ─────────────────────────────────────────────────────────────
  function redrawFog() {
    if (!fogContainer || !mapSprite) return
    fogContainer.removeChildren()
    const enc = store.current
    if (!enc) return

    const { gridSize, gridOffsetX, gridOffsetY, fogData } = enc
    const mapW = mapSprite.texture.width
    const mapH = mapSprite.texture.height
    const allHidden = (fogData as any)._allHidden === 'hidden'

    const cols = Math.ceil((mapW - gridOffsetX) / gridSize) + 1
    const rows = Math.ceil((mapH - gridOffsetY) / gridSize) + 1

    if (!allHidden && Object.keys(fogData).filter(k => k !== '_allHidden').length === 0) return

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const key = `${col},${row}`
        const state = fogData[key]

        let alpha = 0
        if (allHidden && !state) alpha = 0.92
        else if (state === 'hidden') alpha = 0.92
        else if (state === 'partial') alpha = 0.55
        else continue

        const cell = new PIXI.Graphics()
        cell.rect(
          gridOffsetX + col * gridSize,
          gridOffsetY + row * gridSize,
          gridSize,
          gridSize
        )
        cell.fill({ color: 0x0a0a19, alpha })
        // No interactive/pointer events on cells — handled at stage level
        fogContainer.addChild(cell)
      }
    }
  }

  // ── Tokens ─────────────────────────────────────────────────────────────────
  async function renderTokens() {
    if (!tokenContainer || !app) return
    tokenContainer.removeChildren()
    const enc = store.current
    if (!enc) return

    const tokens = options.isDmMode ? enc.tokens : enc.tokens.filter(t => t.isVisible)
    for (const token of tokens) {
      await renderToken(token)
    }
  }

  async function renderToken(token: any) {
    if (!tokenContainer || !app) return
    const enc = store.current
    if (!enc) return

    const { gridSize, gridOffsetX, gridOffsetY } = enc
    const pixelX = gridOffsetX + token.gridX * gridSize
    const pixelY = gridOffsetY + token.gridY * gridSize
    const pixelSize = gridSize * token.size

    const container = new PIXI.Container()
    container.x = pixelX
    container.y = pixelY
    container.label = `token-${token.id}`

    const ring = new PIXI.Graphics()
    const hasConditions = token.conditions && token.conditions.length > 0
    const ringColor = token.isDead ? 0x8b2030 :
      hasConditions ? 0xc9973a :
        !token.isVisible ? 0x2d2d50 : 0x1a8070
    ring.circle(pixelSize / 2, pixelSize / 2, pixelSize / 2)
    ring.fill({ color: ringColor, alpha: 0.3 })
    ring.circle(pixelSize / 2, pixelSize / 2, pixelSize / 2)
    ring.stroke({ color: ringColor, width: token.isDead ? 3 : 2, alpha: 0.9 })
    container.addChild(ring)

    if (hasConditions && (options.isDmMode || token.isVisible)) {
      // Condition overlay — hidden by default, shown on hover
      const overlay = new PIXI.Container()
      overlay.alpha = 0
      overlay.zIndex = 100

      // Dark background circle
      const bg = new PIXI.Graphics()
      bg.circle(pixelSize / 2, pixelSize / 2, pixelSize / 2 - 1)
      bg.fill({ color: 0x0a0a19, alpha: 0.85 })
      overlay.addChild(bg)

      // Condition text lines
      const conditions = token.conditions as any[]
      const lineHeight = Math.min(14, (pixelSize - 8) / conditions.length)
      const fontSize = Math.max(6, Math.min(11, lineHeight * 0.8))
      const totalHeight = conditions.length * lineHeight
      const startY = pixelSize / 2 - totalHeight / 2 + lineHeight / 2

      conditions.forEach((cond, i) => {
        const label = cond.value !== null ? `${cond.name} ${cond.value}` : cond.name
        const text = new PIXI.Text({
          text: label,
          style: {
            fontSize,
            fill: 0xffcc66,
            fontFamily: 'system-ui',
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 },
          },
        })
        text.anchor.set(0.5)
        text.x = pixelSize / 2
        text.y = startY + i * lineHeight
        overlay.addChild(text)
      })

      container.addChild(overlay)

      // Hover to show/hide
      if (options.isDmMode) {
        container.interactive = true
        container.on('pointerenter', () => { overlay.alpha = 1 })
        container.on('pointerleave', () => { overlay.alpha = 0 })
      } else {
        overlay.alpha = 1
      }
    }

    if (token.imageSource) {
      try {
        let url = token.imageSource
        // Images stored as data URLs - use directly
        if (token.imageSource) url = token.imageSource
        const texture = await PIXI.Assets.load(url)
        const sprite = new PIXI.Sprite(texture)
        // Scale to fill (cover) the circle, then center
        const scale = (pixelSize - 4) / Math.min(texture.width, texture.height)
        sprite.scale.set(scale)
        sprite.x = (pixelSize - sprite.width) / 2
        sprite.y = (pixelSize - sprite.height) / 2

        const mask = new PIXI.Graphics()
        mask.circle(pixelSize / 2, pixelSize / 2, pixelSize / 2 - 2)
        mask.fill(0xffffff)
        container.addChild(mask)
        container.addChild(sprite)
        sprite.mask = mask

        if (token.isDead) sprite.tint = 0x662222
        if (!token.isVisible && options.isDmMode) sprite.alpha = 0.5
      } catch {
        const text = new PIXI.Text({
          text: token.name.charAt(0).toUpperCase(),
          style: { fontSize: pixelSize * 0.45, fill: 0xc8c8e8, fontFamily: 'Cinzel', fontWeight: '600' },
        })
        text.anchor.set(0.5)
        text.x = pixelSize / 2
        text.y = pixelSize / 2
        container.addChild(text)
      }
    }

    if (options.isDmMode || token.isVisible) {
      const label = new PIXI.Text({
        text: token.label || token.name,
        style: { fontSize: 10, fill: 0xc8c8e8, fontFamily: 'system-ui', stroke: { color: 0x000000, width: 3 } },
      })
      label.anchor.set(0.5, 0)
      label.x = pixelSize / 2
      label.y = pixelSize + 2
      container.addChild(label)
    }

    if (options.isDmMode && !token.isVisible) {
      const badge = new PIXI.Graphics()
      badge.circle(pixelSize - 8, 8, 7)
      badge.fill({ color: 0x333355, alpha: 0.9 })
      badge.stroke({ color: 0x6b6b9a, width: 1 })
      container.addChild(badge)
      const eye = new PIXI.Text({
        text: '◌',
        style: { fontSize: 8, fill: 0x8888aa, fontFamily: 'system-ui' },
      })
      eye.anchor.set(0.5)
      eye.x = pixelSize - 8
      eye.y = 8
      container.addChild(eye)
    }

    // Token drag — DM only, only when select tool is active
    if (options.isDmMode) {
      container.interactive = true
      container.cursor = 'grab'
      let dragging = false
      let dragOffX = 0
      let dragOffY = 0

      container.on('pointerdown', (e) => {
        if (options.getActiveTool() !== 'select') return
        e.stopPropagation()
        dragging = true
        container.cursor = 'grabbing'
        container.zIndex = 1000
        const local = worldContainer!.toLocal(e.global)
        dragOffX = local.x - container.x
        dragOffY = local.y - container.y
      })

      app!.stage.on('pointermove', (e) => {
        if (!dragging) return
        const local = worldContainer!.toLocal(e.global)
        container.x = local.x - dragOffX
        container.y = local.y - dragOffY
      })

      app!.stage.on('pointerup', () => {
        if (!dragging) return
        dragging = false
        container.cursor = 'grab'
        container.zIndex = 0
        const snappedX = Math.round((container.x - gridOffsetX) / gridSize)
        const snappedY = Math.round((container.y - gridOffsetY) / gridSize)
        container.x = gridOffsetX + snappedX * gridSize
        container.y = gridOffsetY + snappedY * gridSize
        options.onTokenMoved?.(token.id, snappedX, snappedY)
      })
    }

    tokenContainer.addChild(container)
  }

  // ── Viewport / Interaction ─────────────────────────────────────────────────
  function setupInteraction() {
    if (!app) return

    app.stage.interactive = true
    app.stage.hitArea = { contains: () => true } as any

    app.stage.on('pointerdown', (e) => {
      // Fog painting — stage level, correct coordinates
      if (options.isDmMode && options.getActiveTool() === 'fog' && e.button === 0) {
        const enc = store.current
        if (enc) {
          const worldX = (e.global.x - viewport.x) / viewport.scale
          const worldY = (e.global.y - viewport.y) / viewport.scale
          const col = Math.floor((worldX - enc.gridOffsetX) / enc.gridSize)
          const row = Math.floor((worldY - enc.gridOffsetY) / enc.gridSize)
          const key = `${col},${row}`
          const current = enc.fogData[key]
          fogPaintMode = (!current || current === 'hidden') ? 'revealed' : 'hidden'
          fogPaintActive = true
          paintFogAtScreen(e.global.x, e.global.y)
        }
        return
      }

      // Pan — middle mouse or alt+left
      if (e.button === 1 || (e.button === 0 && e.originalEvent?.altKey)) {
        isPanning = true
        panStart = { x: e.global.x, y: e.global.y }
        panViewStart = { x: viewport.x, y: viewport.y }
        app!.canvas.style.cursor = 'grabbing'
      }
    })

    app.stage.on('pointermove', (e) => {
      if (fogPaintActive) {
        paintFogAtScreen(e.global.x, e.global.y)
        return
      }
      if (!isPanning) return
      viewport.x = panViewStart.x + (e.global.x - panStart.x)
      viewport.y = panViewStart.y + (e.global.y - panStart.y)
      applyViewport()
    })

    app.stage.on('pointerup', () => {
      fogPaintActive = false
      if (isPanning) {
        isPanning = false
        app!.canvas.style.cursor = 'default'
        store.updateViewport({ ...viewport })
      }
    })

    app.canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
      const mouseX = e.offsetX
      const mouseY = e.offsetY
      const worldX = (mouseX - viewport.x) / viewport.scale
      const worldY = (mouseY - viewport.y) / viewport.scale
      viewport.scale = Math.min(4, Math.max(0.1, viewport.scale * zoomFactor))
      viewport.x = mouseX - worldX * viewport.scale
      viewport.y = mouseY - worldY * viewport.scale
      applyViewport()
      drawGrid()
    }, { passive: false })
  }

  function applyViewport() {
    if (!worldContainer) return
    worldContainer.x = viewport.x
    worldContainer.y = viewport.y
    worldContainer.scale.set(viewport.scale)
  }

  function applyExternalViewport(vp: { x: number; y: number; scale: number }) {
    viewport = { ...vp }
    applyViewport()
  }

  function getGridPosFromScreen(screenX: number, screenY: number) {
    const enc = store.current
    if (!enc || !worldContainer) return { gridX: 0, gridY: 0 }
    const { gridSize, gridOffsetX, gridOffsetY } = enc
    const worldX = (screenX - viewport.x) / viewport.scale
    const worldY = (screenY - viewport.y) / viewport.scale
    return {
      gridX: Math.round((worldX - gridOffsetX) / gridSize),
      gridY: Math.round((worldY - gridOffsetY) / gridSize),
    }
  }

  function destroy() {
    app?.destroy(true)
    app = null
  }

  return { init, loadMap, drawGrid, redrawFog, renderTokens, applyExternalViewport, getGridPosFromScreen, destroy }
}