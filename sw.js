const CACHE_NAME = 'authenta-check-v6';

// Get all images dynamically during install
const urlsToCache = [
    './',
    './index.html',
    './script.js',
    './style.css',
    './public/tw-fallback.css',
    './manifest.json',
    './set-1-images.json',
    './set-2-images.json',
    './showcase-images.json',
    './image-sets.json',
    './public/favicon.png',
    './public/logo.png'
];

// Preload all images during install
async function preloadImages() {
    const imageSets = [
        'showcase-images.json',
        'set-1-images.json',
        'set-2-images.json'
    ];
    
    const allImages = [];
    
    for (const setFile of imageSets) {
        try {
            const response = await fetch(setFile);
            if (response.ok) {
                const images = await response.json();
                // Add data/ prefix for set images
                if (setFile.includes('set-') || setFile.includes('showcase')) {
                    allImages.push(...images.map(img => `data/${img}`));
                } else {
                    allImages.push(...images);
                }
            }
        } catch (error) {
            console.error(`Failed to load ${setFile}:`, error);
        }
    }
    
    return allImages;
}

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .then(async () => {
                // Preload all images after caching core files
                const cache = await caches.open(CACHE_NAME);
                const allImages = await preloadImages();
                
                console.log(`Preloading ${allImages.length} images...`);
                
                // Cache images in batches to avoid overwhelming the browser
                const batchSize = 10;
                for (let i = 0; i < allImages.length; i += batchSize) {
                    const batch = allImages.slice(i, i + batchSize);
                    await Promise.allSettled(
                        batch.map(async (imgPath) => {
                            try {
                                const response = await fetch(imgPath);
                                if (response.ok) {
                                    await cache.put(imgPath, response);
                                }
                            } catch (error) {
                                console.warn(`Failed to cache image: ${imgPath}`, error);
                            }
                        })
                    );
                }
                
                console.log('All images preloaded!');
            })
    );
});

// Intercept network requests.
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If the request is in the cache, return it.
                if (response) {
                    return response;
                }

                // If the request is not in the cache, try to fetch it from the network.
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone the response before caching it
                        const responseToCache = networkResponse.clone();

                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Only cache GET requests
                                if (event.request.method === 'GET') {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return networkResponse;
                    }
                ).catch(() => {
                    // Network failed, return a fallback if available
                    // For images, you could return a placeholder
                    if (event.request.destination === 'image') {
                        return new Response('', { status: 204 });
                    }
                    // For other requests, let them fail
                    return new Response('Offline', { 
                        status: 503, 
                        statusText: 'Service Unavailable' 
                    });
                });
            })
    );
});

// Clean up old caches.
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});