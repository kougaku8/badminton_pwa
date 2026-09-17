const CACHE_NAME = "badminton-pwa-v4";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./db.js",
  "./manifest.json",
  "./heian-bado-yoyaku-icon_512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    }),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // 只处理 GET 请求
  if (request.method !== "GET") {
    return;
  }

  // 只处理当前 PWA 自己的请求
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 有缓存：
      // 立即返回缓存，同时后台尝试更新
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // 离线时什么都不做
          });

        return cachedResponse;
      }

      // 没有缓存：
      // 尝试联网
      return fetch(request).catch(() => {
        // 联网失败时，返回合法 Response
        return new Response("Offline", {
          status: 503,
          statusText: "Offline",
        });
      });
    }),
  );
});
