import { ref } from 'vue'

// Module-level so all components share the same instance
const pendingRoll = ref<string | null>(null)

export function useDiceRoll() {
  function triggerRoll(expression: string) {
    pendingRoll.value = expression
  }
  function clearPendingRoll() {
    pendingRoll.value = null
  }
  return { pendingRoll, triggerRoll, clearPendingRoll }
}
