const CACHE_NAME = "badminton-pwa-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./db.js",
  "./manifest.json",
  "./heian-bado-yoyaku-icon_512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic" &&
              event.request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          return cachedResponse;
        });

      return cachedResponse || networkFetch;
    }),
  );
});
