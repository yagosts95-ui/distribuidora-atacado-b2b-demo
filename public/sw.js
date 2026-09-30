const CACHE = "mh-digital-v10";
const CORE = ["/", "/index.html", "/manifest.webmanifest", "/assets/mh-logo-premium.png", "/assets/banner-abastecimento.png", "/assets/banner-linha-grill.png", "/assets/banner-estoque-negocio.png", "/assets/catalog-header-mh.png", "/assets/cards/sku-1001-cupim-grill.png", "/assets/cards/sku-1002-contra-file-grill.png", "/assets/cards/sku-1003-picanha-grill.png", "/assets/cards/sku-1004-file-mignon-sem-cordao.png", "/assets/cards/sku-1005-alcatra-coracao-grill.png", "/assets/cards/sku-1006-costela-desossada.png", "/assets/cards/bife-ancho.png", "/assets/cards/capa-de-file.png", "/assets/cards/coracao-da-alcatra.png", "/assets/cards/costela-em-tira.png", "/assets/cards/lagarto.png", "/assets/cards/maminha-da-alcatra.png", "/assets/cards/noix.png", "/assets/cards/paleta.png", "/assets/cards/picanha-linha-grill.png", "/assets/b2b-catalog.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match("/index.html").then((cached) => cached || Response.error()))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
