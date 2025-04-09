import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  ui: {
    global: true
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Keys within public are also exposed client-side
    public: {
      appName: 'QuickMeazure'
    }
  },
  build: {
    transpile: ['@nuxt/ui']
  },
  vite: {
    optimizeDeps: {
      include: ['vue', '@nuxt/ui']
    }
  },
  compatibilityDate: '2025-04-08',
  nitro: {
    preset: 'node-server'
  }
})
