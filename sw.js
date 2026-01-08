const CACHE_NAME = 'authenta-check-v7';

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
                allImages.push(...images);
            }
        } catch (error) {
            // Silently handle JSON loading errors
        }
    }
    
    return allImages;
}

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 SW: Caching core files...');
                return cache.addAll(urlsToCache);
            })
            .then(async () => {
                console.log('✅ SW: Core files cached');
                // Preload all images after caching core files
                const cache = await caches.open(CACHE_NAME);
                const allImages = await preloadImages();
                
                console.log(`🖼️ SW: Starting image cache - ${allImages.length} images to download...`);
                
                // Cache images in batches to avoid overwhelming the browser
                const batchSize = 5;
                let cachedCount = 0;
                const startTime = Date.now();
                
                for (let i = 0; i < allImages.length; i += batchSize) {
                    const batch = allImages.slice(i, i + batchSize);
                    const batchNum = Math.floor(i / batchSize) + 1;
                    const totalBatches = Math.ceil(allImages.length / batchSize);
                    
                    console.log(`📥 SW: Processing batch ${batchNum}/${totalBatches}...`);
                    
                    await Promise.allSettled(
                        batch.map(async (imgPath) => {
                            try {
                                const response = await fetch(imgPath);
                                if (response.ok) {
                                    await cache.put(imgPath, response);
                                    cachedCount++;
                                    console.log(`  ✓ Cached (${cachedCount}/${allImages.length}): ${imgPath}`);
                                } else {
                                    console.warn(`  ✗ Failed (${response.status}): ${imgPath}`);
                                }
                            } catch (error) {
                                console.warn(`  ✗ Error: ${imgPath}`, error.message);
                            }
                        })
                    );
                    
                    // Small delay between batches
                    if (i + batchSize < allImages.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`🎉 SW: Image caching complete! ${cachedCount}/${allImages.length} images cached in ${duration}s`);
                
                // Notify all clients that images are ready
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({
                        type: 'IMAGES_CACHED',
                        count: cachedCount,
                        total: allImages.length
                    });
                });
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