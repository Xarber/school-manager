const CACHE = "school-manager-v1";

// Cache tutto ciò che è statico: HTML, bundle JS/CSS, icone
const ASSETS = [
  "/manifest-en.json",
  "/manifest-it.json",
  "/favicon.ico",
  "/icons/icon-monochrome-512.png",
  "/icons/icon-default-light.png"
];

// Funzione helper per mettere in cache tutte le pagine HTML generate
async function cacheHTMLFiles() {
  const cached = await caches.open(CACHE);

  // Lista di HTML generata dinamicamente: tutte quelle in dist
  const htmlPages = [
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
    "/welcome/[page].html",
    "/tabs/index.html"
  ];

  await cached.addAll([...ASSETS, ...htmlPages]);
}

self.addEventListener("install", (e) => {
  e.waitUntil(cacheHTMLFiles());
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

// Serve dalla cache, fallback fetch
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedRes) => {
      if (cachedRes) return cachedRes;
      return fetch(e.request)
        .then((networkRes) => {
          // Metti in cache file GET appena richiesti (JS, CSS, assets)
          if (e.request.method === "GET") {
            caches.open(CACHE).then((cache) => {
              cache.put(e.request, networkRes.clone());
            });
          }
          return networkRes;
        })
        .catch(() => {
          // fallback opzionale se network fallisce
          if (e.request.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
  );
});