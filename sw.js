const CACHE_NAME = 'superbet25-v4-FRESH'; const ASSETS = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.map(c => c !== CACHE_NAME ? caches.delete(c) : null)))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).then(r => caches.open(CACHE_NAME).then(c => { c.put(e.request, r.clone()); return r; })).catch(() => caches.match(e.request).then(c => c || caches.match('/index.html')))); });
