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
  // 非 GET 请求
  //
  // POST / PUT / DELETE 等
  // 完全交给浏览器
  // ==========================================
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);

      // ==========================================
      // 后台更新
      //
      // 不影响当前请求的返回
      // ==========================================
      const updateCache = async () => {
        try {
          const networkResponse = await fetch(request);

          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic" &&
            request.url.startsWith(self.location.origin)
          ) {
            const cache = await caches.open(CACHE_NAME);

            await cache.put(request, networkResponse.clone());

            console.log("[SW] Background cache updated:", request.url);
          }
        } catch (error) {
          console.warn("[SW] Background update failed:", request.url, error);
        }
      };

      // ==========================================
      // 1. Cache Hit
      //
      // 立即返回缓存
      // 同时后台更新
      // ==========================================
      if (cachedResponse) {
        event.waitUntil(updateCache());

        return cachedResponse;
      }

      // ==========================================
      // 2. Cache Miss
      //
      // 第一次访问必须等待网络
      // ==========================================
      try {
        const networkResponse = await fetch(request);

        // ==========================================
        // 3. 缓存本站成功的 GET
        // ==========================================
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic" &&
          request.url.startsWith(self.location.origin)
        ) {
          const cache = await caches.open(CACHE_NAME);

          await cache.put(request, networkResponse.clone());

          console.log("[SW] Initial cache saved:", request.url);
        }

        return networkResponse;
      } catch (error) {
        console.warn("[SW] Cache miss + network failed:", request.url, error);

        // ==========================================
        // 4. 没缓存 + 网络失败
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
