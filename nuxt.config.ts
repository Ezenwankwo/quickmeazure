import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui', 
    'nuxt-auth-utils', 
    '@nuxt/image', 
    '@nuxtjs/seo', 
    // Only include PWA module in production
    ...(process.env.NODE_ENV === 'production' ? ['@vite-pwa/nuxt'] : [])
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Keys within public are also exposed client-side
    public: {
      appName: 'QuickMeazure',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      paystackKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_paystack_public_key'
    },
    // Add auth secret for nuxt-auth-utils
    authSecret: process.env.AUTH_SECRET || 'your-secret-key',
    jwtSecret: process.env.JWT_SECRET,
    brevoApiKey: process.env.BREVO_API_KEY,
  },
  build: {
    transpile: ['@nuxt/ui']
  },
  ui: {
    colorMode: false
  },
  pwa: {
    registerType: 'autoUpdate',
    // Only generate service worker in production
    enabled: process.env.NODE_ENV === 'production',
    // Disable service worker registration completely
    disableServiceWorker: false,
    // Use auto for service worker registration
    injectRegister: 'auto',
    // Ensure manifest is included in the build
    includeManifestIcons: true,
    includeAssets: ['/favicons/**/*'],
    // Use the external manifest file instead of defining it here
    manifest: false,
    strategies: 'generateSW',
    registerWebManifestInRouteRules: true,
    
    workbox: {
      // When enabled in production, use these settings
      navigateFallback: '/',
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
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-assets-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        },
        {
          urlPattern: /\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 // 1 hour
            },
            networkTimeoutSeconds: 10
          }
        }
      ]
    },
    devOptions: {
      // Completely disable in development
      enabled: false,
      type: 'module',
      navigateFallback: '/',
      navigateFallbackAllowlist: [/^\/$/]
    }
  },
  site: {
    url: 'https://quickmeazure.com',
    name: 'QuickMeazure - Tailor Business Management',
    description: 'Easily manage your clients\'s measurements, styles, and payments with QuickMeazure.',
    defaultLocale: 'en',
  },
  vite: {
    optimizeDeps: {
      include: ['vue', '@nuxt/ui']
    },
    build: {
      sourcemap: false
    }
  },
  nitro: {
    preset: 'vercel',
    sourceMap: false
  },
  sourcemap: false,
  compatibilityDate: '2025-04-08',
  components: [
    { path: '~/components', pathPrefix: false }
  ],
})