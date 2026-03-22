const baseURL = process.env.NUXT_APP_BASE_URL ?? '/'
// Ensure trailing slash, then strip leading slash from asset path
const asset = (path: string) => `${baseURL}${path}`.replace('//', '/')

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: false },

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
        { name: 'theme-color', content: 'var(--blood)' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: asset('favicon.ico') },
        { rel: 'icon', type: 'image/svg+xml', href: asset('favicon.svg') },
        { rel: 'apple-touch-icon', href: asset('icons/icon-192.png') },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: "DM's Tome",
      short_name: "DM's Tome",
      description: "DM's Tome — your grimoire for all things tabletop",
      theme_color: 'var(--blood)',
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

  css: ['~/assets/css/main.css'],
  tailwindcss: { configPath: '~/tailwind.config.ts' },
  router: { options: { hashMode: true } },
  components: [{ path: '~/components', pathPrefix: false }],
  imports: { dirs: ['stores', 'composables'] },
  compatibilityDate: '2024-04-03',
})
