const CACHE = "mh-client-v4";
const CORE = [
  "/assets/mh-logo-final.png",
  "/cliente/",
  "/index.html",
  "/manifest-client.webmanifest",
  "/assets/icons/mh-app-icon-round.png",
  "/assets/icons/mh-app-icon-maskable.png",
  "/assets/banner-abastecimento.png",
  "/assets/banner-linha-grill.png",
  "/assets/banner-estoque-negocio.png",
  "/assets/catalog-header-mh.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE).catch(() => undefined)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("mh-client-") && key !== CACHE).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html").then(r => r || Response.error()))
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});