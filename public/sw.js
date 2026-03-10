const CACHE_NAME = 'nhatro-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/rooms.html',
    '/contracts.html',
    '/billing.html',
    '/settings.html',
    '/assets/css/style.css',
    '/assets/css/components.css',
    '/assets/js/app.js',
    '/assets/js/auth.js',
    '/assets/js/datastore.js',
    '/assets/js/firebase-config.js',
    '/assets/images/logo.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
