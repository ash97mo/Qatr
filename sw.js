// --- START OF FILE sw.js ---
const CACHE_NAME = 'egy-trains-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './trains_data.js',
  './icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // استبعاد اتصالات السيرفر اللحظي و GitHub API من الكاش
  if (url.hostname.includes('broker.emqx.io') || url.hostname.includes('api.github.com') || url.pathname.includes('/mqtt') || url.port === '8084') {
    return;
  }

  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});
// --- END OF FILE sw.js ---