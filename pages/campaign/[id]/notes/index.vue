<script setup lang="ts">
const route = useRoute()
const campaignId = Number(route.params.id)
const lastType = (typeof localStorage !== 'undefined' && localStorage.getItem(`notes-last-type-${campaignId}`)) || 'session'
await navigateTo(`/campaign/${campaignId}/notes/${lastType}`, { replace: true })
</script>
