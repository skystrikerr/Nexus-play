// NexusPlay service worker — keeps the app installable and caches static
// assets. API calls and page navigations always go to the network (the app
// is backed by a live database, so there is no offline mode).
const CACHE = 'nexusplay-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== location.origin ||
    url.pathname.startsWith('/api')
  ) {
    return; // let the browser handle it
  }

  // Hashed build assets and icons: cache-first (they never change in place)
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(event.request).then(
          (hit) =>
            hit ||
            fetch(event.request).then((res) => {
              if (res.ok) cache.put(event.request, res.clone());
              return res;
            })
        )
      )
    );
  }
});
