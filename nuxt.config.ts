import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  plugins: [
    '~/plugins/auth-interceptor.ts'
  ],
  runtimeConfig: {
    // Keys within public are also exposed client-side
    public: {
      appName: 'QuickMeazure'
    },
    jwtSecret: process.env.JWT_SECRET,
  },
  build: {
    transpile: ['@nuxt/ui']
  },
  vite: {
    optimizeDeps: {
      include: ['vue', '@nuxt/ui']
    },
    build: {
      sourcemap: false
    },
    // Disable service worker registration
    worker: {
      plugins: () => []
    }
  },
  nitro: {
    preset: 'node-server',
    sourceMap: false
  },
  sourcemap: false,
  compatibilityDate: '2025-04-08',
  components: [
    { path: '~/components', pathPrefix: false }
  ],
})
