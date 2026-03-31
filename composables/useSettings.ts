export interface AppSettings {
  paperTexture: boolean
  pageAnimations: boolean
  sparkEffects: boolean
  inkWrite: boolean
}

const DEFAULTS: AppSettings = {
  paperTexture: true,
  pageAnimations: true,
  sparkEffects: true,
  inkWrite: true,
}

const settings = ref<AppSettings>({ ...DEFAULTS })

function applySettings() {
  const root = document.documentElement
  root.style.setProperty('--paper', settings.value.paperTexture ? 'url("/natural-paper.png")' : 'none')
  root.classList.toggle('no-animations', !settings.value.pageAnimations)
}

if (import.meta.client) {
  try {
    const stored = localStorage.getItem('dmstome-settings')
    if (stored) Object.assign(settings.value, JSON.parse(stored))
  } catch {}
  applySettings()
}

export function useSettings() {
  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    settings.value[key] = value
    if (import.meta.client) {
      localStorage.setItem('dmstome-settings', JSON.stringify(settings.value))
      applySettings()
    }
  }
  return { settings, update }
}
