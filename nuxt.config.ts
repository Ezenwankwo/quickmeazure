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
    disableServiceWorker: process.env.NODE_ENV !== 'production',
    // Disable dev SW
    injectRegister: 'auto',
    manifest: {
      name: 'QuickMeazure - Tailor Business Management',
      short_name: 'QuickMeazure',
      description: 'Easily manage your clients\'s measurements, styles, and payments with QuickMeazure.',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/favicons/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/favicons/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/favicons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      // When enabled in production, use these settings
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
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
        }
      ]
    },
    devOptions: {
      // Completely disable in development
      enabled: false,
      type: 'module'
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