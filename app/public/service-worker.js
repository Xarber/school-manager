const CACHE = "school-manager-v1";

const ASSETS = [
  "/manifest-en.json",
  "/manifest-it.json",
  "/favicon.ico",
  "/icons/icon-monochrome-512.png",
  "/icons/icon-default-light.png",
  "/index.html",
  "/_sitemap.html",
  "/+not-found.html",
  "/home/index.html",
  "/calendar/index.html",
  "/profile/index.html",
  "/profile/class/index.html",
  "/profile/profiledata.html",
  "/profile/settings/index.html",
  "/registry/index.html",
  "/registry/grades.html",
  "/registry/homework.html",
  "/registry/schedule.html",
  "/registry/resources/index.html",
  "/ai/index.html",
  "/ai/history.html",
  "/tabs/index.html"
];

// Install event
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const url of ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("Cache failed for:", url, err);
        }
      }
    })()
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Fetch handler
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request).then((networkRes) => {
      if (e.request.method === "GET") {
        caches.open(CACHE).then((cache) => cache.put(e.request, networkRes.clone()));
      }
      return networkRes;
    }).catch(() => {
      if (e.request.destination === "document") {
        return caches.match("/index.html");
      }
    }))
  );
});