const CACHE_NAME = "badminton-pwa-v5";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./activity.html",
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
  const request = event.request;

  // ==========================================
  // POST / PUT / DELETE 等非 GET 请求
  // 不由 Service Worker 处理
  // 直接交给浏览器
  // ==========================================
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      // ==========================================
      // 1. Cache First
      // ==========================================
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      // ==========================================
      // 2. Cache Miss → 请求网络
      // ==========================================
      try {
        const networkResponse = await fetch(request);

        // ==========================================
        // 3. 只缓存本站成功的 GET 请求
        // ==========================================
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic" &&
          request.url.startsWith(self.location.origin)
        ) {
          const cache = await caches.open(CACHE_NAME);

          await cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        console.warn("[SW] Cache miss + network failed:", request.url, error);

        // ==========================================
        // 4. 没缓存 + 网络失败
        // 必须返回合法 Response
        // ==========================================
        return new Response("Network unavailable", {
          status: 503,
          statusText: "Service Unavailable",
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
    })(),
  );
});
