import type { RouterConfig } from '@nuxt/schema'

// https://router.vuejs.org/api/interfaces/routeroptions.html
export default <RouterConfig> {
  routes: (_routes) => [
    ..._routes,
    // Add routes for service worker files to prevent Vue Router warnings
    {
      name: 'dev-sw',
      path: '/dev-sw.js',
      component: () => null,
      meta: { layout: false }
    },
    {
      name: 'dev-sw-query',
      path: '/dev-sw.js:query(.*)',
      component: () => null,
      meta: { layout: false }
    }
  ]
}
