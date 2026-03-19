/**
 * Exposes window.dmforge using the Dexie-backed dbApi.
 * This replaces the Electron contextBridge preload.js.
 * All existing stores and components keep calling window.dmforge unchanged.
 */
import { dbApi } from '~/composables/useDb'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    (window as any).dmforge = dbApi
  }
})
