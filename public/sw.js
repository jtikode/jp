const CACHE_NAME = "jptraders-offline-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Read-only offline support for the salesman app only: a salesman can view
// their already-loaded routes, store sequence, regular items, and
// outstanding data with no signal. Submitting a visit (photo/GPS/amounts) is
// a POST and always falls through to the network untouched, so it still
// requires connectivity — this never caches or intercepts writes.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isSalesmanPage = url.pathname.startsWith("/salesman");
  const isStaticAsset = url.pathname.startsWith("/_next/static/");
  if (!isSalesmanPage && !isStaticAsset) return;

  event.respondWith(
    isSalesmanPage ? networkFirstThenCache(request) : cacheFirstThenNetwork(request),
  );
});

async function networkFirstThenCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirstThenNetwork(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
