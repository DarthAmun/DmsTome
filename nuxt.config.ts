export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: false },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@vite-pwa/nuxt',
  ],

  // GitHub Pages deploys to /dm-forge/ — set base URL for production
  // For local dev this is '/', for gh-pages it's '/dm-forge/'
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/',
    head: {
      title: 'DM Forge',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Offline-first campaign manager for Dungeon Masters' },
        { name: 'theme-color', content: '#ebbd34' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'DM Forge',
      short_name: 'DM Forge',
      description: 'Offline-first campaign manager for Dungeon Masters',
      theme_color: '#ebbd34',
      background_color: '#0d0d0d',
      display: 'standalone',
      orientation: 'landscape',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      // Cache Google Fonts
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600, // check for updates every hour
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },

  primevue: {
    options: { unstyled: true },
    importPT: { from: '~/assets/primevue-preset.ts' },
    components: {
      include: ['Button', 'InputText', 'InputNumber', 'Textarea', 'Select', 'Dialog', 'AutoComplete'],
    },
  },

  css: ['~/assets/css/main.css'],
  tailwindcss: { configPath: '~/tailwind.config.ts' },
  router: { options: { hashMode: true } },
  imports: { dirs: ['stores', 'composables'] },
  compatibilityDate: '2024-04-03',
})
