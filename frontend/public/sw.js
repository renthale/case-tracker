const CACHE = 'case-tracker-v4';
const FILES = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) {
        fetch(e.request).then((res) => {
          if (res.ok) caches.open(CACHE).then((cache) => cache.put(e.request, res));
        });
        return cached;
      }
      return fetch(e.request).then((res) => {
        if (res.ok && res.type === 'basic') {
          caches.open(CACHE).then((cache) => cache.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('/'));
    })
  );
});
