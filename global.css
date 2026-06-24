const CACHE = 'bjj-dagboek-v1';

// Alles wat offline beschikbaar moet zijn
const PRECACHE = [
  '/',
  '/inloggen',
  '/dashboard',
  '/loggen',
  '/logboek',
  '/doelen',
  '/voortgang',
  '/offline',
];

// Install — precache statische assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — oude caches opruimen
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategie:
// - API calls: network first, geen cache fallback (data moet actueel zijn)
// - Pagina's: network first, cache als fallback
// - Assets (_astro/): cache first
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API calls altijd network — nooit cachen
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Statische assets (immutable) — cache first
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/fonts/')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Pagina's — network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached =>
          cached || caches.match('/offline')
        )
      )
  );
});
