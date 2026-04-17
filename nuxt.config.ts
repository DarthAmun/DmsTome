import pkg from './package.json'
const baseURL = process.env.NUXT_APP_BASE_URL ?? '/'
// Ensure trailing slash, then strip leading slash from asset path
const asset = (path: string) => `${baseURL}${path}`.replace('//', '/')

export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@vite-pwa/nuxt',
  ],

  app: {
    baseURL,
    head: {
      title: "DM's Tome",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Offline-first campaign manager for Dungeon Masters' },
        { name: 'theme-color', content: '#8b1a1a' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: asset('favicon.ico') },
        { rel: 'apple-touch-icon', href: asset('icons/apple-touch-icon.png') },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap' },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: "DM's Tome",
      short_name: "DM's Tome",
      description: "DM's Tome — your grimoire for all things tabletop",
      theme_color: '#8b1a1a',
      background_color: '#100808',
      display: 'standalone',
      orientation: 'landscape',
      start_url: baseURL,
      scope: baseURL,
      icons: [
        { src: asset('icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: asset('icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
        { src: asset('icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB — covers oh-vue-icons bundle
      navigateFallback: baseURL,
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
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
    devOptions: { enabled: false },
  },

  primevue: {
    options: { unstyled: true },
    importPT: { from: '~/assets/primevue-preset.ts' },
    components: {
      include: ['Button', 'InputText', 'InputNumber', 'Textarea', 'Select', 'Dialog', 'AutoComplete'],
    },
  },

  runtimeConfig: {
    public: { version: pkg.version },
  },

  css: ['~/assets/css/main.css'],
  tailwindcss: { configPath: '~/tailwind.config.ts' },
  router: { options: { hashMode: true } },
  components: [{ path: '~/components', pathPrefix: false }],
  imports: { dirs: ['stores', 'composables'] },
  compatibilityDate: '2024-04-03',
})
