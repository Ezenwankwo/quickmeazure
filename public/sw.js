// This is a custom service worker file that will be injected by the PWA module
// It ensures proper handling of the root URL and other navigation requests

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// This will be injected by Workbox during the build process
self.__WB_MANIFEST

// Custom handler for navigation requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle navigation requests to the root URL
  if (event.request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/'))
    );
  }
});
