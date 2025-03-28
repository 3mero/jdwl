// Mejorar el service worker para asegurar que la aplicación funcione sin conexión

const CACHE_NAME = "work-schedule-cache-v1"
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/globals.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Install a service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    }),
  )
})

// Cache and return requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      // Clone the request because it's a one-time use stream
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response because it's a one-time use stream
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            // Don't cache API requests or other dynamic content
            if (!event.request.url.includes("/api/")) {
              cache.put(event.request, responseToCache)
            }
          })

          return response
        })
        .catch(() => {
          // If fetch fails (offline), try to return a cached fallback
          return caches.match("/")
        })
    }),
  )
})

// Update a service worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

