const CACHE_NAME = "jptraders-offline-v3";
const OFFLINE_URL = "/offline.html";

// Catalog/item-listing pages: what a retailer actually wants fast is the
// product list, not the freshest-possible price. Serve the copy already on
// the phone instantly, then refresh it in the background for next time
// (stale-while-revalidate) instead of making them wait on the network first.
const CATALOG_PATHS = [
  "/shop/home",
  "/shop/products",
  "/shop/fast-order",
  "/shop/quick-check",
  "/shop/lowest-rate",
  "/shop/clearance",
  "/shop/offers",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Read-only offline support for the salesman app and the retailer shop: the
// last page a device successfully loaded (routes/stores/regular-items for a
// salesman; catalog/home/orders for a retailer) stays viewable with no
// signal. Every write — a salesman's visit submission, a retailer's
// placeOrder — is a POST and always falls through to the network untouched,
// so it still requires connectivity; this never caches or intercepts
// writes. Order submission while offline is instead queued client-side
// (see src/lib/pendingOrders.ts) and retried once the network returns.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isSalesmanPage = url.pathname.startsWith("/team/salesman");
  const isShopPage =
    url.pathname.startsWith("/shop") &&
    !url.pathname.startsWith("/shop/login") &&
    !url.pathname.startsWith("/shop/register") &&
    !url.pathname.startsWith("/shop/who-is-ordering");
  const isCatalogPage = CATALOG_PATHS.some((p) => url.pathname.startsWith(p));
  const isStaticAsset = url.pathname.startsWith("/_next/static/");
  if (!isSalesmanPage && !isShopPage && !isStaticAsset) return;

  if (isCatalogPage) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(
    isSalesmanPage || isShopPage ? networkFirstThenCache(request) : cacheFirstThenNetwork(request),
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
    // A page this device has never loaded before, with no signal to fetch
    // it now — show the friendly offline card instead of the browser's own
    // ugly "no internet" error page.
    if (request.mode === "navigate") return cache.match(OFFLINE_URL);
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Don't block the response on the network — that's the whole point.
    // Refresh the cache for next time, but let this navigation resolve now.
    networkFetch.catch(() => {});
    return cached;
  }

  const fresh = await networkFetch;
  if (fresh) return fresh;
  if (request.mode === "navigate") return cache.match(OFFLINE_URL);
  return Response.error();
}

async function cacheFirstThenNetwork(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

// Retailer order-status notifications (Web Push). Unrelated to the
// salesman offline-cache logic above — this only reacts to push/click
// events, it never intercepts fetches.
self.addEventListener("push", (event) => {
  let payload = { title: "J.P. Traders", body: "" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data ? event.data.text() : "";
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon.svg",
      data: { url: payload.url || "/shop/orders" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/shop/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
