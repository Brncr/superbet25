const CACHE_NAME = 'superbet25-v5-FAST'; const ASSETS = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.map(c => c !== CACHE_NAME ? caches.delete(c) : null)))); self.clients.claim(); });
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    // IGNORAR REQUISIÇÕES EXTERNAS (SUPABASE, ETC) - NETWORK ONLY
    if (url.origin !== self.location.origin) return;
    // NETWORK FIRST PARA ASSETS PRÓPRIOS
    e.respondWith(fetch(e.request).then(r => {
        const rc = r.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, rc)); return r;
    }).catch(() => caches.match(e.request).then(c => c || caches.match('/index.html'))));
});
