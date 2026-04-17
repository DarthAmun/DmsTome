/**
 * Type declarations for window.dmforge — browser-based API backed by Dexie/IndexedDB.
 * The dmforge name on window is kept for historical compatibility with all stores and pages.
 */
interface Window {
  dmforge: {
    campaigns: {
      list: () => Promise<any[]>
      create: (data: { name: string; description?: string }) => Promise<any>
      delete: (id: number) => Promise<void>
    }
    encounters: {
      list: (campaignId: number) => Promise<any[]>
      get: (id: number) => Promise<any>
      create: (data: { campaignId: number; name: string }) => Promise<any>
      update: (data: { id: number; [key: string]: any }) => Promise<any>
      delete: (id: number) => Promise<void>
    }
    tokens: {
      list: () => Promise<any[]>
      create: (data: { name: string; imageSource?: string | null; imageType?: string }) => Promise<any>
      delete: (id: number) => Promise<void>
    }
    encounterTokens: {
      add: (data: any) => Promise<any>
      update: (data: { id: number; [key: string]: any }) => Promise<void>
      remove: (id: number) => Promise<void>
    }
    entities: {
      list: (campaignId: number) => Promise<any[]>
      get: (id: number) => Promise<any>
      create: (data: any) => Promise<any>
      update: (data: { id: number; [key: string]: any }) => Promise<any>
      delete: (id: number) => Promise<void>
      listLinks: (campaignId: number) => Promise<any[]>
      createLink: (data: any) => Promise<any>
      deleteLinks: (sourceId: number) => Promise<void>
    }
    system: {
      /** Opens a file picker. Returns a base64 data URL, or null if cancelled. */
      openFileDialog: () => Promise<string | null>
      /** Returns the src as-is (already a data URL in PWA mode). */
      readImage: (src: string) => Promise<string | null>
    }
    window: {
      openPlayer: (encounterId: number) => Promise<void>
      closePlayer: () => Promise<void>
      syncEncounter: (data: any) => void
      onPlayerClosed: (cb: () => void) => void
      offPlayerClosed: () => void
      onEncounterSync: (cb: (data: any) => void) => void
      offEncounterSync: () => void
      openMapPlayer: (campaignId: number, locationId: number) => Promise<void>
      syncMap: (locationId: number | null) => void
      onMapSync: (cb: (locationId: number | null) => void) => void
      offMapSync: () => void
    }
    isElectron: boolean
  }
}
