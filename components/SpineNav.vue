<template>
  <nav v-if="!spineHidden && !isPlayerRoute" class="spine-tabs">

    <SpineSeal />

    <!-- ── Level 1: Campaigns ── -->
    <button
      class="spine-tab spine-tab--l1"
      :class="{ active: ctx.activeLevelOne.value === 'campaigns' }"
      title="Campaigns"
      @click="router.push('/?section=campaigns')">
      <OhVueIcon name="gi-broadsword" scale="0.8" />
      <span class="spine-label">Campaigns</span>
    </button>

    <!-- ── Level 2: Campaign sub-tabs ── -->
    <template v-if="ctx.showCampaignTabs.value">
      <NuxtLink
        :to="`/campaign/${ctx.campaignId.value}/chronicle`"
        class="spine-tab spine-tab--l2"
        :class="{ active: route.path.includes('/chronicle') || route.path.includes('/npcs') || route.path.includes('/locations') || route.path.includes('/factions') || route.path.includes('/quests') || route.path.includes('/events') || route.path.includes('/sessions') || (route.path.includes('/notes') && !route.path.includes('/encounter')) }"
        title="Chronicle">
        <OhVueIcon name="gi-scroll-unfurled" scale="0.8" />
        <span class="spine-label">Chronicle</span>
      </NuxtLink>

      <!-- Level 3: current entity type -->
      <div v-if="ctx.levelThree.value"
        class="spine-tab spine-tab--l3 spine-tab--active-type"
        :style="{ '--tab-icon-color': ctx.levelThree.value.color }">
        <OhVueIcon :name="ctx.levelThree.value.icon" scale="0.8" />
        <span class="spine-label">{{ ctx.levelThree.value.label }}</span>
      </div>

      <NuxtLink
        :to="`/campaign/${ctx.campaignId.value}/graphs`"
        class="spine-tab spine-tab--l2"
        :class="{ active: route.path.includes('/graph') }"
        title="Graph">
        <OhVueIcon name="gi-all-seeing-eye" scale="0.8" />
        <span class="spine-label">Graph</span>
      </NuxtLink>
      <NuxtLink
        :to="`/campaign/${ctx.campaignId.value}/encounters`"
        class="spine-tab spine-tab--l2"
        :class="{ active: route.path.includes('/encounter') }"
        title="Battlefield">
        <OhVueIcon name="gi-broadsword" scale="0.8" />
        <span class="spine-label">Battlefield</span>
      </NuxtLink>
      <NuxtLink
        :to="`/campaign/${ctx.campaignId.value}/locations`"
        class="spine-tab spine-tab--l2"
        :class="{ active: route.path.includes('/locations') }"
        title="Locations">
        <OhVueIcon name="gi-castle" scale="0.8" />
        <span class="spine-label">Locations</span>
      </NuxtLink>
    </template>

    <!-- ── Level 1: Systems ── -->
    <button
      class="spine-tab spine-tab--l1"
      :class="{ active: ctx.activeLevelOne.value === 'systems' }"
      title="Systems"
      @click="router.push('/?section=systems')">
      <OhVueIcon name="gi-scroll-unfurled" scale="0.8" />
      <span class="spine-label">Systems</span>
    </button>

    <!-- ── Level 2: System sub-tabs ── -->
    <template v-if="ctx.showSystemTabs.value">
      <NuxtLink
        :to="`/system/${ctx.systemId.value}/builder`"
        class="spine-tab spine-tab--l2"
        :class="{ active: route.path.includes('/builder') }"
        title="Builder">
        <OhVueIcon name="gi-blacksmith" scale="0.8" />
        <span class="spine-label">Builder</span>
      </NuxtLink>
      <NuxtLink
        :to="`/system/${ctx.systemId.value}/library`"
        class="spine-tab spine-tab--l2"
        :class="{ active: route.path.includes('/library')
               || route.path === `/system/${ctx.systemId.value}` }"
        title="Library">
        <OhVueIcon name="gi-open-treasure-chest" scale="0.8" />
        <span class="spine-label">Library</span>
      </NuxtLink>

      <!-- Level 3: current entity type (only on /system/:id/:typeId) -->
      <div v-if="ctx.levelThree.value"
        class="spine-tab spine-tab--l3 spine-tab--active-type"
        :style="{ '--tab-icon-color': ctx.levelThree.value.color }">
        <OhVueIcon :name="ctx.levelThree.value.icon" scale="0.8" />
        <span class="spine-label">{{ ctx.levelThree.value.label }}</span>
      </div>
    </template>

    <!-- ── Search + Settings ── -->
    <div class="spine-spacer" />
    <button class="spine-tab spine-tab--l1" title="Search (⌘K)" @click="searchOpen = true">
      <OhVueIcon name="fa-search" scale="0.8" />
    </button>
    <NuxtLink to="/settings" class="spine-tab spine-tab--l1" title="Settings">
      <OhVueIcon name="md-settings" scale="0.8" />
      <span class="spine-label">Settings</span>
    </NuxtLink>

  </nav>
</template>

<script setup lang="ts">
import { useSpineContext } from '~/composables/useSpineContext'
import { usePageChrome } from '~/composables/usePageChrome'
import { useGlobalSearch } from '~/composables/useGlobalSearch'

const route = useRoute()
const router = useRouter()
const ctx = useSpineContext()
const { spineHidden } = usePageChrome()
const { open: searchOpen } = useGlobalSearch()
const isPlayerRoute = computed(() =>
  route.path.endsWith('/player') || route.path.endsWith('/map-player')
)
</script>

