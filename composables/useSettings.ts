export interface AppSettings {
  theme: 'dark' | 'light'
  paperTexture: boolean
  pageAnimations: boolean
  sparkEffects: boolean
  inkWrite: boolean
}

const DEFAULTS: AppSettings = {
  theme: 'dark',
  paperTexture: false,
  pageAnimations: true,
  sparkEffects: true,
  inkWrite: false,
}

const settings = ref<AppSettings>({ ...DEFAULTS })

function applySettings() {
  if (!import.meta.client) return
  const root = document.documentElement
  root.setAttribute('data-theme', settings.value.theme)
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
