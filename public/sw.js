const CACHE_NAME = 'cinema-tech-v1';
const ASSETS = [
    '/theater-tech/',
    '/theater-tech/index.html',
    '/theater-tech/src/styles/style.css',
    '/theater-tech/src/styles/style-mobile.css',
    '/theater-tech/data/screens.json',
    '/theater-tech/data/config.json',
    '/theater-tech/data/constants.json',
    '/theater-tech/data/icons.json',
    '/theater-tech/data/tooltips.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
});
