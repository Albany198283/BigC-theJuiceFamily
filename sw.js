self.addEventListener('install', (e) => {
  // Cache all critical files for offline use. Bump the cache name to invalidate
  // older caches when files change.
  e.waitUntil(
    caches.open('bcj-v8').then(cache =>
      cache.addAll([
        './',
        'index.html',
        'styles.css',
        'app.js',
        'manifest.webmanifest',
        'icons/icon-192.png',
        'icons/icon-512.png'
      ])
    )
  );
});

self.addEventListener('activate', (e) => {
  // Remove old caches when a new version is activated.
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== 'bcj-v8').map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  // Try to serve cached responses first, falling back to network if not found.
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
