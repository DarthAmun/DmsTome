/**
 * Exposes window.dmstome using the Dexie-backed dbApi.
 * This replaces the Electron contextBridge preload.js.
 */
import { dbApi } from '~/composables/useDb'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    (window as any).dmstome = dbApi
  }
})
