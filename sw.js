const CACHE_NAME = 'bullxmarket-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logo.png'
];

// 1. Install Event: Cache critical app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Force immediate activation
  );
});

// 2. Activate Event: Clean up old, out-of-date caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take immediate control of open pages
  );
});

// 3. Fetch Event: Serve cached assets offline, fallback to network
self.addEventListener('fetch', (event) => {
  event.waitUntil(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached asset if found, otherwise perform normal network request
      return cachedResponse || fetch(event.request);
    })
  );
});
