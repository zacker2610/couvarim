self.addEventListener('install', (event) => {
  console.log('SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We need a fetch handler to satisfy PWA criteria
  // For now, we just let requests through to the network
  event.respondWith(fetch(event.request));
});
