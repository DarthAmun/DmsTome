const showNewCampaign = ref(false)
const showNewSystem = ref(false)

export function useAppDialogs() {
  return { showNewCampaign, showNewSystem }
}
