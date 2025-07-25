import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils',
    '@nuxt/image',
    '@nuxtjs/seo',
    '@vite-pwa/nuxt',
    '@sentry/nuxt/module',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxt/test-utils/module',
  ],
  components: [{ path: '~/components', pathPrefix: false }],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  site: {
    url: 'https://quickmeazure.com',
    name: 'QuickMeazure - Tailor Business Management',
    description:
      "Easily manage your clients's measurements, styles, and payments with QuickMeazure.",
    defaultLocale: 'en',
  },
  ui: {
    colorMode: false,
  },
  runtimeConfig: {
    // Keys within public are also exposed client-side
    public: {
      appName: 'QuickMeazure',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      paystackKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_paystack_public_key',
      sentry: {
        dsn: process.env.SENTRY_DSN,
      },
    },
    // Add auth secret for nuxt-auth-utils
    authSecret: process.env.AUTH_SECRET || 'your-secret-key',
    jwtSecret: process.env.JWT_SECRET,
    brevoApiKey: process.env.BREVO_API_KEY,
  },
  build: {
    transpile: ['@nuxt/ui'],
  },
  // Add sourcemap configuration for Sentry
  sourcemap: {
    client: true,
    server: true,
  },
  compatibilityDate: '2025-04-08',
  nitro: {
    preset: 'vercel',
    sourceMap: false,
    routeRules: {
      '/.well-known/appspecific/com.chrome.devtools.json': {
        redirect: { to: '/', statusCode: 404 },
      },
    },
  },
  vite: {
    optimizeDeps: {
      include: ['vue', '@nuxt/ui'],
    },
    build: {
      sourcemap: false,
    },
  },
  eslint: {
    config: {
      // Disable stylistic rules for now to reduce noise
      stylistic: false,
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    // Use auto for service worker registration
    injectRegister: 'auto',
    // Ensure manifest is included in the build
    includeManifestIcons: true,
    includeAssets: ['/favicons/**/*'],
    // Use the external manifest file instead of defining it here
    manifest: false,
    strategies: 'injectManifest',
    registerWebManifestInRouteRules: true,
    injectManifest: {
      injectionPoint: undefined,
      rollupFormat: 'iife',
    },

    workbox: {
      // When enabled in production, use these settings
      navigateFallback: '/',
      navigateFallbackDenylist: [/\/api\//],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-assets-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        {
          urlPattern: /\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60, // 1 hour
            },
            networkTimeoutSeconds: 10,
          },
        },
      ],
    },
    devOptions: {
      // Completely disable in development
      enabled: false,
      type: 'module',
      navigateFallback: '/',
      navigateFallbackAllowlist: [/^\/$/],
    },
  },
  // Add Sentry configuration
  sentry: {
    sourceMapsUploadOptions: {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    },
  },
})
