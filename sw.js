/* ==========================================================
   UTI B - INDICADORES CLÍNICOS
   Service Worker
   Instituto de Infectologia Emílio Ribas
   Instituto Reverte | Augusto Cruz
   ========================================================== */

const CACHE_VERSION = "v1.0.4";
const CACHE_NAME = `uti-b-indicadores-${CACHE_VERSION}`;

/*
 * Somente arquivos da interface.
 * Nenhum dado clínico ou requisição ao Apps Script será armazenado.
 */
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./icon-192.png",
  "./icon-512.png"
];

/* ==========================================================
   INSTALAÇÃO
   ========================================================== */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ==========================================================
   ATIVAÇÃO
   Remove caches antigos automaticamente.
   ========================================================== */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* ==========================================================
   FETCH
   Estratégia:
   - Interface → Network First com fallback para cache.
   - Google Apps Script → Sempre rede.
   ========================================================== */

self.addEventListener("fetch", (event) => {

  const request = event.request;
  const url = new URL(request.url);

  /* Nunca cacheia POST */
  if (request.method !== "GET") return;

  /* Nunca intercepta Apps Script */
  if (url.hostname === "script.google.com") {
    return;
  }

  /* Recursos externos também ficam fora do cache */
  if (url.origin !== location.origin) {
    return;
  }

  /* Navegação da aplicação */
  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)
        .then((response) => {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => cache.put("./index.html", copy));

          return response;

        })
        .catch(() => caches.match("./index.html"))

    );

    return;
  }

  /* CSS, JS, Manifest, ícones */
  event.respondWith(

    fetch(request)
      .then((response) => {

        if (response.ok) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, copy));

        }

        return response;

      })
      .catch(() => caches.match(request))

  );

});

/* ==========================================================
   Mensagem para atualização futura
   ========================================================== */

self.addEventListener("message", (event) => {

  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }

});
