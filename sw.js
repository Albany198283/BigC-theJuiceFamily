self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('bcj-v9').then(cache =>
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
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== 'bcj-v9').map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});


